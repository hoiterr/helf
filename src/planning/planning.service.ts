import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Intensity,
  PlannedStatus,
  PlannedWorkout,
  Prisma,
  WorkoutTemplate,
} from '@prisma/client';
import { ReadinessService } from '../analytics/readiness.service';
import { dayKey, utcMidnight } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';
import { estimateLoad } from './load-estimate';
import { parseWorkout, ParsedWorkout } from './nl-parser';
import { CreatePlannedDto, CreateTemplateDto, UpdatePlannedDto } from './planning.dto';
import { DayAction, DayGuidance, WorkoutAdjustment } from './planning.types';

const INTENSITY_RANK: Record<Intensity, number> = {
  RECOVERY: 0,
  EASY: 1,
  MODERATE: 2,
  HARD: 3,
  MAX: 4,
};

function jsonOrUndef(value: unknown): Prisma.InputJsonValue | undefined {
  return value == null ? undefined : (value as Prisma.InputJsonValue);
}

@Injectable()
export class PlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readiness: ReadinessService,
  ) {}

  // ── Templates ───────────────────────────────────────────────────────────────

  createTemplate(userId: string, dto: CreateTemplateDto): Promise<WorkoutTemplate> {
    const intensity = dto.intensity ?? Intensity.MODERATE;
    const estimatedLoad =
      dto.estimatedLoad ??
      (dto.estimatedDurationMin != null
        ? estimateLoad(dto.estimatedDurationMin, intensity)
        : undefined);

    return this.prisma.workoutTemplate.create({
      data: {
        userId,
        title: dto.title,
        sportType: dto.sportType,
        intensity,
        estimatedDurationMin: dto.estimatedDurationMin,
        estimatedLoad,
        description: dto.description,
        steps: jsonOrUndef(dto.steps),
      },
    });
  }

  /** A user's own templates plus any system (userId == null) templates. */
  listTemplates(userId: string): Promise<WorkoutTemplate[]> {
    return this.prisma.workoutTemplate.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { title: 'asc' },
    });
  }

  // ── Quick-add ─────────────────────────────────────────────────────────────--

  /** Parse natural-language shorthand into a structured workout WITHOUT saving —
   *  powers the live preview as the user types. */
  preview(text: string): ParsedWorkout {
    return parseWorkout(text);
  }

  // ── Planned workouts ─────────────────────────────────────────────────────────

  async createPlanned(userId: string, dto: CreatePlannedDto): Promise<PlannedWorkout> {
    let title = dto.title;
    let sportType = dto.sportType;
    let intensity: Intensity = dto.intensity ?? Intensity.MODERATE;
    let durationMin = dto.estimatedDurationMin;
    let estimatedLoad: number | undefined;
    let steps: unknown = dto.steps;
    let templateId: string | undefined;

    if (dto.templateId) {
      const t = await this.prisma.workoutTemplate.findUniqueOrThrow({ where: { id: dto.templateId } });
      title = t.title;
      sportType = t.sportType;
      intensity = t.intensity;
      durationMin = t.estimatedDurationMin ?? undefined;
      estimatedLoad = t.estimatedLoad ?? undefined;
      steps = t.steps ?? undefined;
      templateId = t.id;
    } else if (dto.text) {
      const parsed = parseWorkout(dto.text);
      title = parsed.title;
      sportType = parsed.sportType;
      intensity = parsed.intensity;
      durationMin = parsed.estimatedDurationMin;
      estimatedLoad = parsed.estimatedLoad;
      steps = parsed.steps;
    }

    if (!title || !sportType) {
      throw new BadRequestException('Provide `text`, a `templateId`, or both `title` and `sportType`.');
    }
    if (estimatedLoad == null && durationMin != null) {
      estimatedLoad = estimateLoad(durationMin, intensity);
    }

    const date = utcMidnight(new Date(dto.date));
    const order = await this.prisma.plannedWorkout.count({ where: { userId, date } });

    return this.prisma.plannedWorkout.create({
      data: {
        userId,
        date,
        title,
        sportType,
        intensity,
        estimatedDurationMin: durationMin,
        estimatedLoad,
        notes: dto.notes,
        steps: jsonOrUndef(steps),
        order,
        templateId,
      },
    });
  }

  async updatePlanned(id: string, dto: UpdatePlannedDto): Promise<PlannedWorkout> {
    const data: Prisma.PlannedWorkoutUpdateInput = {};
    if (dto.date) data.date = utcMidnight(new Date(dto.date));
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.intensity !== undefined) data.intensity = dto.intensity;
    if (dto.estimatedDurationMin !== undefined) data.estimatedDurationMin = dto.estimatedDurationMin;
    if (dto.order !== undefined) data.order = dto.order;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes;

    // Keep projected load consistent when intensity/duration change.
    if (dto.intensity !== undefined || dto.estimatedDurationMin !== undefined) {
      const current = await this.prisma.plannedWorkout.findUniqueOrThrow({ where: { id } });
      const intensity = dto.intensity ?? current.intensity;
      const duration = dto.estimatedDurationMin ?? current.estimatedDurationMin ?? undefined;
      if (duration != null) data.estimatedLoad = estimateLoad(duration, intensity);
    }

    return this.prisma.plannedWorkout.update({ where: { id }, data });
  }

  async deletePlanned(id: string): Promise<void> {
    await this.prisma.plannedWorkout.delete({ where: { id } });
  }

  completePlanned(id: string, workoutId?: string): Promise<PlannedWorkout> {
    return this.prisma.plannedWorkout.update({
      where: { id },
      data: { status: PlannedStatus.COMPLETED, completedWorkoutId: workoutId ?? undefined },
    });
  }

  /**
   * Auto-reconcile a day: link completed device workouts to the day's planned
   * sessions (same-sport first, then any remaining), marking them COMPLETED. This
   * is how "what you actually did" closes the loop on "what you planned" with no
   * manual logging.
   */
  async reconcileDay(userId: string, dateInput: string | Date): Promise<{ linked: number }> {
    const date = utcMidnight(new Date(dateInput));
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + 1);

    const [planned, actuals] = await Promise.all([
      this.prisma.plannedWorkout.findMany({
        where: { userId, date, status: PlannedStatus.PLANNED },
        orderBy: { order: 'asc' },
      }),
      this.prisma.workout.findMany({
        where: { userId, start: { gte: date, lt: next }, plannedWorkout: { is: null } },
        orderBy: { start: 'asc' },
      }),
    ]);

    const used = new Set<string>();
    let linked = 0;
    for (const p of planned) {
      const sameSport = actuals.find((a) => !used.has(a.id) && sportMatches(p.sportType, a.sportType));
      const chosen = sameSport ?? actuals.find((a) => !used.has(a.id));
      if (!chosen) continue;
      used.add(chosen.id);
      await this.prisma.plannedWorkout.update({
        where: { id: p.id },
        data: { status: PlannedStatus.COMPLETED, completedWorkoutId: chosen.id },
      });
      linked++;
    }
    return { linked };
  }

  // ── Today guidance (the readiness gate) ───────────────────────────────────────

  async todayGuidance(userId: string): Promise<DayGuidance> {
    const today = utcMidnight(new Date());
    const [snap, planned] = await Promise.all([
      this.readiness.snapshot(userId),
      this.prisma.plannedWorkout.findMany({
        where: { userId, date: today, status: PlannedStatus.PLANNED },
        orderBy: { order: 'asc' },
      }),
    ]);

    const adjustments = planned.map((p) => this.adjust(p, snap.status));
    return {
      date: dayKey(today),
      readiness: { status: snap.status, score: snap.recoveryScore },
      headline: this.headline(snap.status, planned.length, adjustments),
      reasons: snap.messages,
      adjustments,
    };
  }

  /** Decide what to do with one planned session given today's readiness band. */
  private adjust(p: PlannedWorkout, status: DayGuidance['readiness']['status']): WorkoutAdjustment {
    const rank = INTENSITY_RANK[p.intensity];
    let action: DayAction = 'proceed';
    let suggested: Intensity = p.intensity;
    let suggestion = 'Train as planned.';

    if (status === 'RED') {
      if (rank >= INTENSITY_RANK.HARD) {
        action = 'swap';
        suggested = Intensity.RECOVERY;
        suggestion = 'Low readiness — swap for an easy recovery session, or take a rest day.';
      } else if (rank === INTENSITY_RANK.MODERATE) {
        action = 'reduce';
        suggested = Intensity.EASY;
        suggestion = 'Low readiness — keep it easy, Zone 1–2 only.';
      } else {
        suggestion = 'Low readiness, but this is already gentle — fine to proceed.';
      }
    } else if (status === 'AMBER') {
      if (rank === INTENSITY_RANK.MAX) {
        action = 'reduce';
        suggested = Intensity.HARD;
        suggestion = 'Moderate readiness — cap the top end at Zone 4, skip the Zone 5 work.';
      } else if (rank === INTENSITY_RANK.HARD) {
        action = 'reduce';
        suggested = Intensity.MODERATE;
        suggestion = 'Moderate readiness — trim to a steady tempo effort.';
      } else {
        suggestion = 'Moderate readiness — this session sits within range.';
      }
    } else {
      suggestion = 'Fully recovered — send it as planned.';
    }

    return {
      plannedWorkoutId: p.id,
      title: p.title,
      plannedIntensity: p.intensity,
      suggestedIntensity: suggested,
      action,
      suggestion,
    };
  }

  private headline(
    status: DayGuidance['readiness']['status'],
    plannedCount: number,
    adjustments: WorkoutAdjustment[],
  ): string {
    if (plannedCount === 0) {
      if (status === 'RED') return 'Nothing scheduled — and your body is asking for rest. Take it.';
      if (status === 'AMBER') return 'Nothing scheduled. An easy aerobic session would sit well today.';
      return 'Nothing scheduled, and you’re fresh — a great day to train.';
    }
    const changed = adjustments.filter((a) => a.action !== 'proceed').length;
    if (status === 'GREEN') return 'You’re ready — train as planned.';
    if (status === 'AMBER') {
      return changed > 0
        ? 'Moderate readiness — dialled back where it matters.'
        : 'Moderate readiness — your plan already fits.';
    }
    return changed > 0
      ? 'Low readiness — eased today’s plan toward recovery.'
      : 'Low readiness — your plan is already gentle.';
  }
}

function sportMatches(a: string, b?: string | null): boolean {
  if (!b) return false;
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x === y || x.includes(y) || y.includes(x);
}

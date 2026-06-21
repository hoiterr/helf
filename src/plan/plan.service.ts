import { BadRequestException, Injectable } from '@nestjs/common';
import { PlanBlock, RecurringRule, TrainingPlan } from '@prisma/client';
import { addDays, dayKey, MS_PER_WEEK, startOfUtcWeek, utcMidnight } from '../common/time';
import { BlockFocus, Intensity, PlannedStatus } from '../domain/enums';
import { estimateLoad } from '../planning/load-estimate';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, CreateRecurringRuleDto } from './plan.dto';

interface SessionFields {
  title: string;
  sportType: string;
  intensity: Intensity;
  estimatedDurationMin?: number;
  estimatedLoad?: number;
  steps?: string;
}

export interface PlanWeek {
  weekIndex: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  block: string;
  focus: string;
  weeklyLoadTarget: number | null;
  plannedLoad: number;
}

const DEFAULT_HORIZON_WEEKS = 4;

@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Plans + blocks ────────────────────────────────────────────────────────────

  createPlan(userId: string, dto: CreatePlanDto): Promise<TrainingPlan & { blocks: PlanBlock[] }> {
    return this.prisma.trainingPlan.create({
      data: {
        userId,
        name: dto.name,
        startDate: utcMidnight(new Date(dto.startDate)),
        goalDate: dto.goalDate ? utcMidnight(new Date(dto.goalDate)) : undefined,
        blocks: {
          create: (dto.blocks ?? []).map((b, i) => ({
            name: b.name,
            focus: b.focus ?? BlockFocus.BASE,
            weeks: b.weeks,
            order: i,
            weeklyLoadTarget: b.weeklyLoadTarget,
          })),
        },
      },
      include: { blocks: { orderBy: { order: 'asc' } } },
    });
  }

  listPlans(userId: string): Promise<TrainingPlan[]> {
    return this.prisma.trainingPlan.findMany({ where: { userId }, orderBy: { startDate: 'desc' } });
  }

  getPlan(id: string) {
    return this.prisma.trainingPlan.findUniqueOrThrow({
      where: { id },
      include: { blocks: { orderBy: { order: 'asc' } }, rules: true },
    });
  }

  /**
   * Week-by-week periodization overview: each week's block, focus, target load,
   * and the planned load currently scheduled into it (projected vs. target).
   */
  async schedule(planId: string): Promise<{ plan: object; weeks: PlanWeek[] }> {
    const plan = await this.prisma.trainingPlan.findUniqueOrThrow({
      where: { id: planId },
      include: { blocks: { orderBy: { order: 'asc' } } },
    });

    const totalWeeks = plan.blocks.reduce((sum, b) => sum + b.weeks, 0) || 1;
    const start = startOfUtcWeek(plan.startDate);
    const end = addDays(start, totalWeeks * 7 - 1);

    const planned = await this.prisma.plannedWorkout.findMany({
      where: { userId: plan.userId, date: { gte: start, lte: end } },
      select: { date: true, estimatedLoad: true },
    });

    const weeks: PlanWeek[] = [];
    let cursor = 0;
    for (const block of plan.blocks) {
      for (let w = 0; w < block.weeks; w++) {
        const weekStart = addDays(start, cursor * 7);
        const weekEnd = addDays(weekStart, 6);
        const plannedLoad = planned
          .filter((p) => p.date >= weekStart && p.date <= weekEnd)
          .reduce((s, p) => s + (p.estimatedLoad ?? 0), 0);
        weeks.push({
          weekIndex: cursor,
          weekNumber: cursor + 1,
          startDate: dayKey(weekStart),
          endDate: dayKey(weekEnd),
          block: block.name,
          focus: block.focus,
          weeklyLoadTarget: block.weeklyLoadTarget ?? null,
          plannedLoad: Math.round(plannedLoad),
        });
        cursor++;
      }
    }

    return {
      plan: {
        id: plan.id,
        name: plan.name,
        startDate: dayKey(plan.startDate),
        goalDate: plan.goalDate ? dayKey(plan.goalDate) : null,
        totalWeeks,
      },
      weeks,
    };
  }

  // ── Recurring rules ────────────────────────────────────────────────────────────

  async createRecurringRule(userId: string, dto: CreateRecurringRuleDto): Promise<RecurringRule> {
    let title = dto.title;
    let sportType = dto.sportType;
    let intensity: Intensity = dto.intensity ?? Intensity.MODERATE;
    let estimatedDurationMin = dto.estimatedDurationMin;
    let estimatedLoad = dto.estimatedLoad;

    if (dto.templateId) {
      const t = await this.prisma.workoutTemplate.findUnique({ where: { id: dto.templateId } });
      if (t) {
        title ??= t.title;
        sportType ??= t.sportType;
        intensity = dto.intensity ?? (t.intensity as Intensity);
        estimatedDurationMin ??= t.estimatedDurationMin ?? undefined;
        estimatedLoad ??= t.estimatedLoad ?? undefined;
      }
    }

    if (!title || !sportType) {
      throw new BadRequestException('Provide `templateId`, or both `title` and `sportType`.');
    }

    const startDate = utcMidnight(new Date(dto.startDate));
    const rule = await this.prisma.recurringRule.create({
      data: {
        userId,
        planId: dto.planId,
        title,
        sportType,
        intensity,
        estimatedDurationMin,
        estimatedLoad,
        daysOfWeek: JSON.stringify(dto.daysOfWeek),
        weekInterval: dto.weekInterval ?? 1,
        startDate,
        endDate: dto.endDate ? utcMidnight(new Date(dto.endDate)) : undefined,
        templateId: dto.templateId,
        active: dto.active ?? true,
      },
    });

    // Materialize a horizon immediately so the sessions show up on the calendar.
    const horizon = dto.endDate
      ? utcMidnight(new Date(dto.endDate))
      : addDays(startDate, DEFAULT_HORIZON_WEEKS * 7);
    await this.materialize(userId, startDate, horizon);

    return rule;
  }

  listRules(userId: string): Promise<RecurringRule[]> {
    return this.prisma.recurringRule.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async deleteRule(id: string, deleteFuture = false): Promise<{ ok: true; removedPlanned: number }> {
    let removedPlanned = 0;
    if (deleteFuture) {
      const res = await this.prisma.plannedWorkout.deleteMany({
        where: {
          recurringRuleId: id,
          generated: true,
          status: PlannedStatus.PLANNED,
          date: { gte: utcMidnight(new Date()) },
        },
      });
      removedPlanned = res.count;
    }
    await this.prisma.recurringRule.delete({ where: { id } });
    return { ok: true, removedPlanned };
  }

  // ── Materialization ────────────────────────────────────────────────────────────

  /**
   * Expand active recurring rules into concrete PlannedWorkout rows across a date
   * range. Idempotent — a session already generated for a rule+date is skipped, so
   * it's safe to call repeatedly (on rule creation, or to extend the horizon).
   */
  async materialize(
    userId: string,
    fromInput: string | Date,
    toInput: string | Date,
  ): Promise<{ created: number }> {
    const from = utcMidnight(new Date(fromInput));
    const to = utcMidnight(new Date(toInput));

    const rules = await this.prisma.recurringRule.findMany({
      where: { userId, active: true, startDate: { lte: to } },
    });

    let created = 0;
    for (const rule of rules) {
      if (rule.endDate && rule.endDate < from) continue;
      const days = safeParseDays(rule.daysOfWeek);
      if (days.length === 0) continue;
      const anchorWeek = startOfUtcWeek(rule.startDate);
      const ruleStart = utcMidnight(rule.startDate);
      const fields = await this.resolveSession(rule);

      let cursor = from.getTime() < ruleStart.getTime() ? new Date(ruleStart) : new Date(from);
      for (; cursor <= to; cursor = addDays(cursor, 1)) {
        if (rule.endDate && cursor > rule.endDate) break;
        if (!days.includes(cursor.getUTCDay())) continue;
        const weeksSince = Math.round((startOfUtcWeek(cursor).getTime() - anchorWeek.getTime()) / MS_PER_WEEK);
        if (weeksSince % rule.weekInterval !== 0) continue;

        const date = utcMidnight(cursor);
        const existing = await this.prisma.plannedWorkout.findFirst({
          where: { userId, recurringRuleId: rule.id, date },
          select: { id: true },
        });
        if (existing) continue;

        const order = await this.prisma.plannedWorkout.count({ where: { userId, date } });
        await this.prisma.plannedWorkout.create({
          data: {
            userId,
            date,
            title: fields.title,
            sportType: fields.sportType,
            intensity: fields.intensity,
            estimatedDurationMin: fields.estimatedDurationMin,
            estimatedLoad: fields.estimatedLoad,
            steps: fields.steps,
            status: PlannedStatus.PLANNED,
            order,
            generated: true,
            recurringRuleId: rule.id,
            planId: rule.planId ?? undefined,
          },
        });
        created++;
      }
    }
    return { created };
  }

  /** Resolve the concrete session fields for a rule (from its template, if any). */
  private async resolveSession(rule: RecurringRule): Promise<SessionFields> {
    let fields: SessionFields = {
      title: rule.title,
      sportType: rule.sportType,
      intensity: rule.intensity as Intensity,
      estimatedDurationMin: rule.estimatedDurationMin ?? undefined,
      estimatedLoad: rule.estimatedLoad ?? undefined,
    };
    if (rule.templateId) {
      const t = await this.prisma.workoutTemplate.findUnique({ where: { id: rule.templateId } });
      if (t) {
        fields = {
          title: t.title,
          sportType: t.sportType,
          intensity: t.intensity as Intensity,
          estimatedDurationMin: t.estimatedDurationMin ?? undefined,
          estimatedLoad: t.estimatedLoad ?? undefined,
          steps: t.steps ?? undefined,
        };
      }
    }
    if (fields.estimatedLoad == null && fields.estimatedDurationMin != null) {
      fields.estimatedLoad = estimateLoad(fields.estimatedDurationMin, fields.intensity);
    }
    return fields;
  }
}

function safeParseDays(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6) : [];
  } catch {
    return [];
  }
}

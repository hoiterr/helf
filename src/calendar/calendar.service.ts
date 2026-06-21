import { Injectable } from '@nestjs/common';
import { DailyRecovery, PlannedWorkout, Workout } from '@prisma/client';
import { bandForScore, ReadinessStatus } from '../analytics/rules';
import { workoutLoad } from '../analytics/training-load';
import { dayKey, utcMidnight } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';

export interface CalendarDay {
  date: string;
  readiness: { score: number; status: ReadinessStatus } | null;
  planned: PlannedWorkout[];
  completed: Workout[];
  plannedLoad: number;
  completedLoad: number;
}

/**
 * Builds the calendar read model over a date range: each day carries its planned
 * sessions, the completed device activities, the recovery readiness tint, and
 * projected-vs-actual load. One query set, bucketed by day — this is what the
 * week/month grid renders.
 */
@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async range(userId: string, fromInput: string, toInput: string): Promise<CalendarDay[]> {
    const from = utcMidnight(new Date(fromInput));
    const to = utcMidnight(new Date(toInput));
    const toExclusive = new Date(to);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);

    const [planned, completed, recoveries] = await Promise.all([
      this.prisma.plannedWorkout.findMany({
        where: { userId, date: { gte: from, lte: to } },
        orderBy: [{ date: 'asc' }, { order: 'asc' }],
      }),
      this.prisma.workout.findMany({
        where: { userId, start: { gte: from, lt: toExclusive } },
        orderBy: { start: 'asc' },
      }),
      this.prisma.dailyRecovery.findMany({ where: { userId, date: { gte: from, lte: to } } }),
    ]);

    const plannedByDay = bucket(planned, (p) => dayKey(p.date));
    const completedByDay = bucket(completed, (w) => dayKey(w.start));
    const recoveryByDay = new Map<string, DailyRecovery>(recoveries.map((r) => [dayKey(r.date), r]));

    const days: CalendarDay[] = [];
    for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = dayKey(d);
      const dayPlanned = plannedByDay.get(key) ?? [];
      const dayCompleted = completedByDay.get(key) ?? [];
      const recovery = recoveryByDay.get(key);
      const score = recovery?.score ?? null;

      days.push({
        date: key,
        readiness: score != null ? { score, status: bandForScore(score) } : null,
        planned: dayPlanned,
        completed: dayCompleted,
        plannedLoad: round(dayPlanned.reduce((s, p) => s + (p.estimatedLoad ?? 0), 0)),
        completedLoad: round(dayCompleted.reduce((s, w) => s + workoutLoad(w), 0)),
      });
    }
    return days;
  }
}

function bucket<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return map;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

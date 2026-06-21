import { Injectable } from '@nestjs/common';
import { DailyRecovery, SleepSession } from '@prisma/client';
import { daysAgo } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';
import { evaluateReadiness, ReadinessStatus } from './rules';
import { computeTrainingLoad, TrainingLoad } from './training-load';

export interface ReadinessSnapshot {
  status: ReadinessStatus;
  messages: string[];
  recoveryScore: number | null;
  load: TrainingLoad;
  latestRecovery: DailyRecovery | null;
  lastSleep: SleepSession | null;
  baselines: { hrvRmssd30d: number | null; restingHeartRate30d: number | null };
}

/**
 * Computes a user's current readiness: training load (CTL/ATL/TSB/ACWR), the
 * threshold rules verdict, and the underlying recovery/sleep records. This is the
 * single source of truth shared by the dashboard and the planning guidance engine,
 * so "are you ready?" means the same thing everywhere in the app.
 */
@Injectable()
export class ReadinessService {
  constructor(private readonly prisma: PrismaService) {}

  async snapshot(userId: string): Promise<ReadinessSnapshot> {
    const [latestRecovery, lastSleep, loadWorkouts, hrvAgg, rhrAgg] = await Promise.all([
      this.prisma.dailyRecovery.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
      this.prisma.sleepSession.findFirst({ where: { userId }, orderBy: { start: 'desc' } }),
      this.prisma.workout.findMany({
        where: { userId, start: { gte: daysAgo(42) } },
        select: { start: true, durationMin: true, strain: true, load: true },
      }),
      this.prisma.dailyRecovery.aggregate({
        where: { userId, date: { gte: daysAgo(30) }, hrvRmssd: { not: null } },
        _avg: { hrvRmssd: true },
      }),
      this.prisma.dailyRecovery.aggregate({
        where: { userId, date: { gte: daysAgo(30) }, restingHeartRate: { not: null } },
        _avg: { restingHeartRate: true },
      }),
    ]);

    const load = computeTrainingLoad(loadWorkouts);

    const verdict = evaluateReadiness({
      recoveryScore: latestRecovery?.score,
      hrvRmssd: latestRecovery?.hrvRmssd,
      hrvBaseline: hrvAgg._avg.hrvRmssd,
      restingHeartRate: latestRecovery?.restingHeartRate,
      restingHrBaseline: rhrAgg._avg.restingHeartRate,
      sleepMinutes: lastSleep?.totalSleepMin,
      load,
    });

    return {
      status: verdict.status,
      messages: verdict.messages,
      recoveryScore: latestRecovery?.score ?? null,
      load,
      latestRecovery,
      lastSleep,
      baselines: {
        hrvRmssd30d: hrvAgg._avg.hrvRmssd,
        restingHeartRate30d: rhrAgg._avg.restingHeartRate,
      },
    };
  }
}

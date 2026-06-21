import { Injectable } from '@nestjs/common';
import { daysAgo } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';
import { computeTrainingLoad } from '../analytics/training-load';
import { evaluateReadiness, ReadinessResult } from '../analytics/rules';

/**
 * Assembles the dashboard payload for a user: latest recovery, last night's
 * sleep, recent workouts, derived training load, and a threshold-based readiness
 * recommendation. This is the read model the calendar/dashboard UI consumes.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async build(userId: string) {
    const [latestRecovery, lastSleep, recentWorkouts, loadWorkouts, hrvAgg, rhrAgg] =
      await Promise.all([
        this.prisma.dailyRecovery.findFirst({
          where: { userId },
          orderBy: { date: 'desc' },
        }),
        this.prisma.sleepSession.findFirst({
          where: { userId },
          orderBy: { start: 'desc' },
        }),
        this.prisma.workout.findMany({
          where: { userId },
          orderBy: { start: 'desc' },
          take: 10,
        }),
        this.prisma.workout.findMany({
          where: { userId, start: { gte: daysAgo(42) } },
          select: { start: true, durationMin: true, strain: true, load: true },
        }),
        // 30-day HRV baseline from recovery records
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

    const recommendation: ReadinessResult = evaluateReadiness({
      recoveryScore: latestRecovery?.score,
      hrvRmssd: latestRecovery?.hrvRmssd,
      hrvBaseline: hrvAgg._avg.hrvRmssd,
      restingHeartRate: latestRecovery?.restingHeartRate,
      restingHrBaseline: rhrAgg._avg.restingHeartRate,
      sleepMinutes: lastSleep?.totalSleepMin,
      load,
    });

    return {
      latestRecovery,
      lastSleep,
      recentWorkouts,
      trainingLoad: load,
      recommendation,
      baselines: {
        hrvRmssd30d: hrvAgg._avg.hrvRmssd,
        restingHeartRate30d: rhrAgg._avg.restingHeartRate,
      },
    };
  }
}

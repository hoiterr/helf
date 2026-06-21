import { Injectable } from '@nestjs/common';
import { ReadinessService } from '../analytics/readiness.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Assembles the dashboard payload for a user: readiness (recovery, sleep, load,
 * and a recommendation — from the shared ReadinessService) plus recent workouts.
 * This is the read model the calendar/dashboard UI consumes.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readiness: ReadinessService,
  ) {}

  async build(userId: string) {
    const [snap, recentWorkouts] = await Promise.all([
      this.readiness.snapshot(userId),
      this.prisma.workout.findMany({ where: { userId }, orderBy: { start: 'desc' }, take: 10 }),
    ]);

    return {
      latestRecovery: snap.latestRecovery,
      lastSleep: snap.lastSleep,
      recentWorkouts,
      trainingLoad: snap.load,
      recommendation: { status: snap.status, messages: snap.messages },
      baselines: snap.baselines,
    };
  }
}

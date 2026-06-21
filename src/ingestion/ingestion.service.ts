import { Injectable, Logger } from '@nestjs/common';
import { Provider } from '../domain/enums';
import { CanonicalBatch } from '../canonical/canonical.types';
import { utcMidnight } from '../common/time';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Persists a normalized {@link CanonicalBatch} into the canonical tables.
 * Every write is an idempotent upsert keyed on (source, externalId) so replays —
 * webhook + poll covering the same window — never create duplicates.
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async persist(userId: string, source: Provider, batch: CanonicalBatch): Promise<void> {
    let count = 0;

    for (const s of batch.sleep) {
      await this.prisma.sleepSession.upsert({
        where: { source_externalId: { source, externalId: s.externalId } },
        create: {
          userId,
          source,
          externalId: s.externalId,
          start: s.start,
          end: s.end,
          timezoneOffset: s.timezoneOffset,
          totalSleepMin: s.totalSleepMin,
          timeInBedMin: s.timeInBedMin,
          efficiencyPct: s.efficiencyPct,
          lightMin: s.lightMin,
          deepMin: s.deepMin,
          remMin: s.remMin,
          awakeMin: s.awakeMin,
          avgHeartRate: s.avgHeartRate,
          avgHrvRmssd: s.avgHrvRmssd,
          respiratoryRate: s.respiratoryRate,
          sleepScore: s.sleepScore,
          raw: JSON.stringify(s.raw),
        },
        update: {
          start: s.start,
          end: s.end,
          totalSleepMin: s.totalSleepMin,
          timeInBedMin: s.timeInBedMin,
          efficiencyPct: s.efficiencyPct,
          lightMin: s.lightMin,
          deepMin: s.deepMin,
          remMin: s.remMin,
          awakeMin: s.awakeMin,
          avgHeartRate: s.avgHeartRate,
          avgHrvRmssd: s.avgHrvRmssd,
          respiratoryRate: s.respiratoryRate,
          sleepScore: s.sleepScore,
          raw: JSON.stringify(s.raw),
        },
      });
      count++;
    }

    for (const r of batch.recovery) {
      await this.prisma.dailyRecovery.upsert({
        where: { source_externalId: { source, externalId: r.externalId } },
        create: {
          userId,
          source,
          externalId: r.externalId,
          date: r.date,
          score: r.score,
          restingHeartRate: r.restingHeartRate,
          hrvRmssd: r.hrvRmssd,
          spo2Pct: r.spo2Pct,
          skinTempCelsius: r.skinTempCelsius,
          respiratoryRate: r.respiratoryRate,
          raw: JSON.stringify(r.raw),
        },
        update: {
          date: r.date,
          score: r.score,
          restingHeartRate: r.restingHeartRate,
          hrvRmssd: r.hrvRmssd,
          spo2Pct: r.spo2Pct,
          skinTempCelsius: r.skinTempCelsius,
          respiratoryRate: r.respiratoryRate,
          raw: JSON.stringify(r.raw),
        },
      });
      count++;
    }

    for (const w of batch.workouts) {
      await this.prisma.workout.upsert({
        where: { source_externalId: { source, externalId: w.externalId } },
        create: {
          userId,
          source,
          externalId: w.externalId,
          sportType: w.sportType,
          start: w.start,
          end: w.end,
          durationMin: w.durationMin,
          avgHeartRate: w.avgHeartRate,
          maxHeartRate: w.maxHeartRate,
          calories: w.calories,
          distanceMeters: w.distanceMeters,
          strain: w.strain,
          load: w.load,
          raw: JSON.stringify(w.raw),
        },
        update: {
          sportType: w.sportType,
          start: w.start,
          end: w.end,
          durationMin: w.durationMin,
          avgHeartRate: w.avgHeartRate,
          maxHeartRate: w.maxHeartRate,
          calories: w.calories,
          distanceMeters: w.distanceMeters,
          strain: w.strain,
          load: w.load,
          raw: JSON.stringify(w.raw),
        },
      });
      count++;
    }

    for (const d of batch.dailySummaries) {
      await this.prisma.dailySummary.upsert({
        where: { userId_source_date: { userId, source, date: utcMidnight(d.date) } },
        create: {
          userId,
          source,
          date: utcMidnight(d.date),
          steps: d.steps,
          activeCalories: d.activeCalories,
          totalCalories: d.totalCalories,
          restingHeartRate: d.restingHeartRate,
          avgStressLevel: d.avgStressLevel,
          raw: d.raw != null ? JSON.stringify(d.raw) : undefined,
        },
        update: {
          steps: d.steps,
          activeCalories: d.activeCalories,
          totalCalories: d.totalCalories,
          restingHeartRate: d.restingHeartRate,
          avgStressLevel: d.avgStressLevel,
        },
      });
      count++;
    }

    for (const h of batch.hrvSamples) {
      await this.prisma.hrvSample.upsert({
        where: {
          userId_source_recordedAt: { userId, source, recordedAt: h.recordedAt },
        },
        create: { userId, source, recordedAt: h.recordedAt, rmssd: h.rmssd },
        update: { rmssd: h.rmssd },
      });
      count++;
    }

    this.logger.log(`Persisted ${count} ${source} records for user ${userId}`);
  }
}

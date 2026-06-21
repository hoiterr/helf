/**
 * Canonical, provider-agnostic record shapes. Every provider normalizer converts
 * its raw payloads into these. The ingestion layer upserts them into the matching
 * Prisma tables. Optional fields are `undefined` when a provider doesn't report them.
 */

export interface CanonicalSleep {
  externalId: string;
  start: Date;
  end: Date;
  timezoneOffset?: number;
  totalSleepMin?: number;
  timeInBedMin?: number;
  efficiencyPct?: number;
  lightMin?: number;
  deepMin?: number;
  remMin?: number;
  awakeMin?: number;
  avgHeartRate?: number;
  avgHrvRmssd?: number;
  respiratoryRate?: number;
  sleepScore?: number;
  raw: unknown;
}

export interface CanonicalRecovery {
  externalId: string;
  /** Calendar day the recovery applies to. */
  date: Date;
  score?: number;
  restingHeartRate?: number;
  hrvRmssd?: number;
  spo2Pct?: number;
  skinTempCelsius?: number;
  respiratoryRate?: number;
  raw: unknown;
}

export interface CanonicalWorkout {
  externalId: string;
  sportType?: string;
  start: Date;
  end: Date;
  durationMin?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  distanceMeters?: number;
  strain?: number;
  load?: number;
  raw: unknown;
}

export interface CanonicalDailySummary {
  date: Date;
  steps?: number;
  activeCalories?: number;
  totalCalories?: number;
  restingHeartRate?: number;
  avgStressLevel?: number;
  raw?: unknown;
}

export interface CanonicalHrvSample {
  recordedAt: Date;
  rmssd: number;
}

/** Everything a single sync pulled, ready to persist. */
export interface CanonicalBatch {
  /** The provider's own user id (used to route incoming webhooks back to a connection). */
  externalUserId?: string;
  sleep: CanonicalSleep[];
  recovery: CanonicalRecovery[];
  workouts: CanonicalWorkout[];
  dailySummaries: CanonicalDailySummary[];
  hrvSamples: CanonicalHrvSample[];
}

export function emptyBatch(): CanonicalBatch {
  return { sleep: [], recovery: [], workouts: [], dailySummaries: [], hrvSamples: [] };
}

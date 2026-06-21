import { Intensity } from '@prisma/client';

/**
 * Maps planned intensity to a training-load multiplier. A planned session's load
 * is duration × this factor, so the calendar can project CTL/ATL/ACWR forward
 * from the plan — not just react to completed work. Same scale as analytics load.
 */
const INTENSITY_FACTOR: Record<Intensity, number> = {
  RECOVERY: 0.5,
  EASY: 0.8,
  MODERATE: 1.0,
  HARD: 1.4,
  MAX: 1.8,
};

export function intensityFactor(intensity: Intensity): number {
  return INTENSITY_FACTOR[intensity] ?? 1;
}

export function estimateLoad(durationMin: number, intensity: Intensity): number {
  return Math.round(durationMin * intensityFactor(intensity));
}

/** Rough duration estimate from distance for endurance sports (min). */
export function estimateDurationFromDistance(sportType: string, meters: number): number | undefined {
  const km = meters / 1000;
  const s = sportType.toLowerCase();
  if (s.includes('run')) return Math.round(km * 6); // ~6 min/km
  if (s.includes('cycl') || s.includes('ride') || s.includes('bike')) return Math.round(km * 2);
  if (s.includes('swim')) return Math.round(km * 20);
  if (s.includes('walk') || s.includes('hike')) return Math.round(km * 11);
  return undefined;
}

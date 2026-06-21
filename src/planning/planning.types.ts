import { Intensity } from '@prisma/client';
import { ReadinessStatus } from '../analytics/rules';

/** What the guidance engine recommends doing with a planned session today. */
export type DayAction = 'proceed' | 'reduce' | 'swap' | 'rest';

export interface WorkoutAdjustment {
  plannedWorkoutId: string;
  title: string;
  plannedIntensity: Intensity;
  suggestedIntensity: Intensity;
  action: DayAction;
  /** One-line, plain-language coaching the user can accept with a tap. */
  suggestion: string;
}

/** The "Today" verdict: readiness + per-workout recommendations. */
export interface DayGuidance {
  date: string;
  readiness: { status: ReadinessStatus; score: number | null };
  headline: string;
  /** Why — the threshold-engine reasons behind the readiness verdict. */
  reasons: string[];
  adjustments: WorkoutAdjustment[];
}

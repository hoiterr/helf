/**
 * Structured representation of what happens inside a workout. Stored as JSON on
 * WorkoutTemplate/PlannedWorkout.steps. Kept deliberately simple and unit-explicit
 * so it survives across sports (a strength set and a running interval are both steps).
 */
export type StepKind = 'warmup' | 'work' | 'interval' | 'rest' | 'cooldown' | 'strength';

export interface WorkoutStep {
  kind: StepKind;
  /** Human label, e.g. "Threshold" or "Back squat". */
  label?: string;
  /** Number of times this step repeats (sets / interval rounds). */
  repeat?: number;
  durationMin?: number;
  distanceMeters?: number;
  /** Target HR/power zone 1–5. */
  targetZone?: number;
  /** Strength: reps per set. */
  reps?: number;
  /** Strength: load in kg. */
  weightKg?: number;
  exercise?: string;
}

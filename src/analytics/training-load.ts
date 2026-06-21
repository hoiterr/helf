/**
 * Training-load math — the same family of metrics used by TrainingPeaks / sports
 * science, computed from canonical workouts so they work across any device.
 *
 *   CTL  (Chronic Training Load)  — 42-day EWMA of daily load  ≈ "fitness"
 *   ATL  (Acute Training Load)    — 7-day EWMA of daily load   ≈ "fatigue"
 *   TSB  (Training Stress Balance)= CTL − ATL                  ≈ "form/freshness"
 *   ACWR (Acute:Chronic Ratio)    = 7-day load / (28-day load / 4)  injury-risk signal
 *
 * These are intentionally provider-agnostic and explainable — the AI layer reads
 * these numbers, it doesn't invent them.
 */

export interface WorkoutLike {
  start: Date;
  durationMin?: number | null;
  strain?: number | null;
  load?: number | null;
}

export interface TrainingLoad {
  ctl: number;
  atl: number;
  tsb: number;
  acwr: number;
  acwrZone: 'undertraining' | 'optimal' | 'caution' | 'high-risk' | 'insufficient-data';
}

/** A single session's contribution to daily load. Prefer an explicit provider
 *  load/strain; otherwise approximate from duration. */
export function workoutLoad(w: WorkoutLike): number {
  if (w.load != null) return w.load;
  // Whoop strain is 0–21 on a non-linear scale; scale up so it's comparable to
  // duration-based load. Rough heuristic — tune against real data.
  if (w.strain != null) return w.strain * 5;
  if (w.durationMin != null) return w.durationMin; // 1 load unit ≈ 1 min as a floor
  return 0;
}

function ewma(series: number[], timeConstantDays: number): number {
  const alpha = 1 - Math.exp(-1 / timeConstantDays);
  let value = 0;
  for (const v of series) value += alpha * (v - value);
  return value;
}

function round(n: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export function computeTrainingLoad(workouts: WorkoutLike[], now: Date = new Date()): TrainingLoad {
  const WINDOW = 42;
  const byDay = new Map<string, number>();
  for (const w of workouts) {
    const key = w.start.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + workoutLoad(w));
  }

  // Build a contiguous daily series for the last 42 days (oldest → newest).
  const series: number[] = [];
  for (let i = WINDOW - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    series.push(byDay.get(d.toISOString().slice(0, 10)) ?? 0);
  }

  const ctl = ewma(series, 42);
  const atl = ewma(series, 7);
  const acute = series.slice(-7).reduce((a, b) => a + b, 0);
  const chronicWeekly = series.slice(-28).reduce((a, b) => a + b, 0) / 4;
  const acwr = chronicWeekly > 0 ? acute / chronicWeekly : 0;

  return {
    ctl: round(ctl),
    atl: round(atl),
    tsb: round(ctl - atl),
    acwr: round(acwr, 2),
    acwrZone: classifyAcwr(acwr, chronicWeekly),
  };
}

function classifyAcwr(acwr: number, chronicWeekly: number): TrainingLoad['acwrZone'] {
  if (chronicWeekly <= 0) return 'insufficient-data';
  if (acwr < 0.8) return 'undertraining';
  if (acwr <= 1.3) return 'optimal'; // the widely-cited "sweet spot"
  if (acwr <= 1.5) return 'caution';
  return 'high-risk';
}

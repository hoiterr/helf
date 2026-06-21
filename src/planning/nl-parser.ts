import { Intensity } from '../domain/enums';
import { estimateDurationFromDistance, estimateLoad } from './load-estimate';
import { WorkoutStep } from './workout-step.types';

/**
 * Deterministic natural-language workout parser. Turns shorthand like
 *   "5x5 back squat @100kg"          → strength sets
 *   "20min zone 2 ride"              → endurance work block
 *   "6x3min @z4 / 2min easy" run     → intervals
 *   "10km tempo run"                 → distance-based run
 * into a structured, schedulable workout.
 *
 * This is intentionally rule-based and transparent — it runs instantly, offline,
 * with no model call — and is the upgrade slot for an LLM parser later (the output
 * shape, ParsedWorkout, stays the same).
 */
export interface ParsedWorkout {
  title: string;
  sportType: string;
  intensity: Intensity;
  estimatedDurationMin?: number;
  estimatedLoad?: number;
  steps: WorkoutStep[];
  /** 0–1 confidence that we understood the input (low → offer a manual edit). */
  confidence: number;
}

const SPORTS: { label: string; keys: RegExp }[] = [
  { label: 'Running', keys: /\b(run|jog|tempo run|5k|10k|sprints?)\b/ },
  { label: 'Cycling', keys: /\b(ride|bike|cycl\w*|spin|zwift)\b/ },
  { label: 'Swimming', keys: /\b(swim)\b/ },
  { label: 'Strength', keys: /\b(lift|squat|deadlift|bench|press|strength|gym|hypertrophy)\b/ },
  { label: 'Rowing', keys: /\b(row|erg)\b/ },
  { label: 'Mobility', keys: /\b(yoga|mobility|stretch|pilates)\b/ },
  { label: 'Walking', keys: /\b(walk|hike|hiking)\b/ },
];

const INTENSITY_KEYWORDS: { intensity: Intensity; keys: RegExp }[] = [
  { intensity: 'RECOVERY', keys: /\b(recovery|shakeout|easy spin|regen)\b/ },
  { intensity: 'EASY', keys: /\b(easy|zone ?[12]|z[12]|aerobic|base)\b/ },
  { intensity: 'MODERATE', keys: /\b(moderate|steady|tempo|zone ?3|z3)\b/ },
  { intensity: 'HARD', keys: /\b(hard|threshold|interval|zone ?4|z4|vo2|hiit)\b/ },
  { intensity: 'MAX', keys: /\b(max|all ?out|race|zone ?5|z5|sprint)\b/ },
];

function detectSport(text: string): string {
  for (const s of SPORTS) if (s.keys.test(text)) return s.label;
  return 'Workout';
}

function detectIntensity(text: string): Intensity {
  // Highest matching intensity wins (so "easy + intervals" → HARD-ish? no: take the
  // most specific). We scan hardest-first so explicit hard cues dominate.
  const order: Intensity[] = ['MAX', 'HARD', 'MODERATE', 'EASY', 'RECOVERY'];
  for (const level of order) {
    const match = INTENSITY_KEYWORDS.find((k) => k.intensity === level);
    if (match && match.keys.test(text)) return level;
  }
  return 'MODERATE';
}

function detectZone(text: string): number | undefined {
  const m = /\b(?:zone ?|z)([1-5])\b/.exec(text);
  return m ? parseInt(m[1], 10) : undefined;
}

function totalMinutes(text: string): number | undefined {
  let total = 0;
  let found = false;
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*(h|hr|hour|hrs|hours)\b/g)) {
    total += parseFloat(m[1]) * 60;
    found = true;
  }
  // Require "min" (not a bare "m") so "400m" reads as metres, not 400 minutes.
  for (const m of text.matchAll(/(\d+)\s*(min|mins|minute|minutes)\b/g)) {
    total += parseInt(m[1], 10);
    found = true;
  }
  return found ? Math.round(total) : undefined;
}

function detectDistanceMeters(text: string): number | undefined {
  const km = /(\d+(?:\.\d+)?)\s*km\b/.exec(text);
  if (km) return Math.round(parseFloat(km[1]) * 1000);
  const mi = /(\d+(?:\.\d+)?)\s*(mi|mile|miles)\b/.exec(text);
  if (mi) return Math.round(parseFloat(mi[1]) * 1609.34);
  // Bare metres, ≥3 digits (e.g. "400m", "1500m") to avoid clashing with minute shorthand.
  const m = /(\d{3,5})\s*m\b/.exec(text);
  if (m) return parseInt(m[1], 10);
  return undefined;
}

function titleCase(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function parseWorkout(input: string): ParsedWorkout {
  const text = input.toLowerCase().trim();
  const sportType = detectSport(text);
  const intensity = detectIntensity(text);
  const zone = detectZone(text);
  const steps: WorkoutStep[] = [];
  let signals = 0;

  // Sets/intervals: "5x5", "6x3min", "8x400m"
  const sets = /\b(\d+)\s*[x×]\s*(\d+)\s*(min|mins|m|reps?|s)?\b/.exec(text);
  if (sets) {
    signals++;
    const repeat = parseInt(sets[1], 10);
    const amount = parseInt(sets[2], 10);
    const unit = sets[3];
    if (unit === 'min' || unit === 'mins') {
      steps.push({ kind: 'interval', repeat, durationMin: amount, targetZone: zone, label: 'Interval' });
    } else if (unit === 'm') {
      steps.push({ kind: 'interval', repeat, distanceMeters: amount, targetZone: zone, label: 'Interval' });
    } else {
      // strength: N sets × R reps
      const weight = /@?\s*(\d+(?:\.\d+)?)\s*kg\b/.exec(text);
      const exercise =
        /\b(?:back |front |overhead )?(squat|deadlift|bench(?: press)?|press|row|clean|snatch|lunge|pull[- ]?up|push[- ]?up)\b/.exec(
          text,
        )?.[0];
      steps.push({
        kind: 'strength',
        repeat,
        reps: amount,
        weightKg: weight ? parseFloat(weight[1]) : undefined,
        exercise: exercise ? titleCase(exercise) : undefined,
        label: exercise ? titleCase(exercise) : 'Strength set',
      });
    }
  }

  const distance = detectDistanceMeters(text);
  let durationMin = totalMinutes(text);

  if (distance && steps.length === 0) {
    signals++;
    steps.push({ kind: 'work', distanceMeters: distance, targetZone: zone, label: 'Distance' });
    if (!durationMin) durationMin = estimateDurationFromDistance(sportType, distance);
  } else if (durationMin && steps.length === 0) {
    signals++;
    steps.push({ kind: 'work', durationMin, targetZone: zone, label: zone ? `Zone ${zone}` : 'Work' });
  }

  if (durationMin) signals++;
  if (zone) signals++;
  if (sportType !== 'Workout') signals++;

  // Derive duration for interval/strength sets if none was stated.
  if (!durationMin) {
    const fromSteps = steps.reduce((sum, s) => {
      if (s.durationMin) return sum + s.durationMin * (s.repeat ?? 1);
      if (s.kind === 'strength') return sum + (s.repeat ?? 1) * 2; // ~2 min per set
      return sum;
    }, 0);
    if (fromSteps > 0) durationMin = fromSteps;
  }

  // Intervals dominate the duration estimate: "6×3min" is ~18 min of work, not the
  // 5 a naive minute-sum would give. Use repeat × per-rep (by time or distance).
  const intervalStep = steps.find((s) => s.kind === 'interval' && s.repeat);
  if (intervalStep?.repeat) {
    if (intervalStep.durationMin) {
      durationMin = intervalStep.repeat * intervalStep.durationMin;
    } else if (intervalStep.distanceMeters) {
      const est = estimateDurationFromDistance(sportType, intervalStep.repeat * intervalStep.distanceMeters);
      if (est) durationMin = est;
    }
  }

  const estimatedLoad = durationMin ? estimateLoad(durationMin, intensity) : undefined;

  // Title: prefer a clean version of the user's words, else synthesize one.
  const title =
    input.trim().length > 0 && input.trim().length <= 60
      ? titleCase(input)
      : `${titleCase(intensity.toLowerCase())} ${sportType}`;

  const confidence = Math.min(1, signals / 4);

  return { title, sportType, intensity, estimatedDurationMin: durationMin, estimatedLoad, steps, confidence };
}

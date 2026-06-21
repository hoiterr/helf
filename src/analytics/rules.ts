import { TrainingLoad } from './training-load';

/**
 * Deterministic, explainable "precoded thresholds" — the rules engine.
 *
 * Every threshold here should ultimately be config-driven and per-user tunable
 * (move these constants into a settings table). They are intentionally
 * transparent so the AI/coaching layer can *explain* a recommendation rather
 * than fabricate one. The AI sits ON TOP of this; it doesn't replace it.
 */

export interface ReadinessInputs {
  recoveryScore?: number | null; // 0-100
  hrvRmssd?: number | null;
  hrvBaseline?: number | null; // e.g. 30-day mean
  restingHeartRate?: number | null;
  restingHrBaseline?: number | null;
  sleepMinutes?: number | null;
  load: TrainingLoad;
}

export type ReadinessStatus = 'GREEN' | 'AMBER' | 'RED';

export interface ReadinessResult {
  status: ReadinessStatus;
  messages: string[];
}

const RANK: Record<ReadinessStatus, number> = { GREEN: 0, AMBER: 1, RED: 2 };
const worse = (a: ReadinessStatus, b: ReadinessStatus): ReadinessStatus =>
  RANK[a] >= RANK[b] ? a : b;

// ── Tunable thresholds ────────────────────────────────────────────────────────
const RECOVERY_RED = 34; // Whoop "red" band
const RECOVERY_AMBER = 67; // Whoop "yellow" band
const MIN_SLEEP_MIN = 360; // 6h
const HRV_DROP_FRACTION = 0.15; // HRV >15% below baseline
const RHR_ELEVATION_BPM = 5; // resting HR this far above baseline

export function evaluateReadiness(input: ReadinessInputs): ReadinessResult {
  let status: ReadinessStatus = 'GREEN';
  const messages: string[] = [];

  if (input.recoveryScore != null) {
    if (input.recoveryScore < RECOVERY_RED) {
      status = worse(status, 'RED');
      messages.push('Recovery is low — prioritise rest or easy Zone 2 only.');
    } else if (input.recoveryScore < RECOVERY_AMBER) {
      status = worse(status, 'AMBER');
      messages.push('Moderate recovery — keep intensity in check today.');
    }
  }

  if (input.sleepMinutes != null && input.sleepMinutes < MIN_SLEEP_MIN) {
    status = worse(status, 'AMBER');
    messages.push('Under 6h sleep — avoid high-intensity sessions today.');
  }

  if (input.hrvRmssd != null && input.hrvBaseline) {
    const drop = (input.hrvBaseline - input.hrvRmssd) / input.hrvBaseline;
    if (drop > HRV_DROP_FRACTION) {
      status = worse(status, 'AMBER');
      messages.push(
        `HRV is ${Math.round(drop * 100)}% below your baseline — a sign of incomplete recovery.`,
      );
    }
  }

  if (input.restingHeartRate != null && input.restingHrBaseline) {
    if (input.restingHeartRate - input.restingHrBaseline >= RHR_ELEVATION_BPM) {
      status = worse(status, 'AMBER');
      messages.push('Resting heart rate is elevated — possible fatigue or illness.');
    }
  }

  if (input.load.acwrZone === 'high-risk') {
    status = worse(status, 'RED');
    messages.push(
      `Training-load spike (ACWR ${input.load.acwr}) — elevated injury risk, deload recommended.`,
    );
  } else if (input.load.acwrZone === 'caution') {
    status = worse(status, 'AMBER');
    messages.push(`Training load is ramping fast (ACWR ${input.load.acwr}) — progress carefully.`);
  }

  if (messages.length === 0) {
    messages.push('Recovered and well-balanced — good to train as planned.');
  }

  return { status, messages };
}

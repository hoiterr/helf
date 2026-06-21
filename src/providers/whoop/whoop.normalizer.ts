import {
  CanonicalRecovery,
  CanonicalSleep,
  CanonicalWorkout,
} from '../../canonical/canonical.types';
import { utcMidnight } from '../../common/time';
import { WhoopRecovery, WhoopSleep, WhoopWorkout } from './whoop.types';

const MS_PER_MIN = 60_000;

function tzOffsetMinutes(offset: string | undefined): number | undefined {
  // "+02:00" -> 120, "-05:30" -> -330
  if (!offset) return undefined;
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(offset);
  if (!m) return undefined;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

/** Map a WHOOP sport_id to a human label. Extend as needed from Whoop's sport list. */
function sportLabel(sportId: number): string {
  const map: Record<number, string> = {
    [-1]: 'Activity',
    0: 'Running',
    1: 'Cycling',
    45: 'Weightlifting',
    48: 'Functional Fitness',
    52: 'Hiking',
    63: 'Walking',
    71: 'Swimming',
  };
  return map[sportId] ?? `Sport ${sportId}`;
}

export function normalizeRecovery(r: WhoopRecovery): CanonicalRecovery {
  return {
    externalId: String(r.cycle_id),
    date: utcMidnight(new Date(r.created_at)),
    score: r.score?.recovery_score,
    restingHeartRate: r.score?.resting_heart_rate,
    hrvRmssd: r.score?.hrv_rmssd_milli,
    spo2Pct: r.score?.spo2_percentage,
    skinTempCelsius: r.score?.skin_temp_celsius,
    raw: r,
  };
}

export function normalizeSleep(s: WhoopSleep): CanonicalSleep {
  const start = new Date(s.start);
  const end = new Date(s.end);
  const stages = s.score?.stage_summary;
  const inBedMin = stages ? Math.round(stages.total_in_bed_time_milli / MS_PER_MIN) : undefined;
  const awakeMin = stages ? Math.round(stages.total_awake_time_milli / MS_PER_MIN) : undefined;
  const lightMin = stages ? Math.round(stages.total_light_sleep_time_milli / MS_PER_MIN) : undefined;
  const deepMin = stages
    ? Math.round(stages.total_slow_wave_sleep_time_milli / MS_PER_MIN)
    : undefined;
  const remMin = stages ? Math.round(stages.total_rem_sleep_time_milli / MS_PER_MIN) : undefined;
  const totalSleepMin =
    inBedMin != null && awakeMin != null ? Math.max(inBedMin - awakeMin, 0) : undefined;

  return {
    externalId: s.id,
    start,
    end,
    timezoneOffset: tzOffsetMinutes(s.timezone_offset),
    totalSleepMin,
    timeInBedMin: inBedMin,
    efficiencyPct: s.score?.sleep_efficiency_percentage,
    lightMin,
    deepMin,
    remMin,
    awakeMin,
    respiratoryRate: s.score?.respiratory_rate,
    sleepScore: s.score?.sleep_performance_percentage,
    raw: s,
  };
}

export function normalizeWorkout(w: WhoopWorkout): CanonicalWorkout {
  const start = new Date(w.start);
  const end = new Date(w.end);
  const kj = w.score?.kilojoule;
  return {
    externalId: w.id,
    sportType: sportLabel(w.sport_id),
    start,
    end,
    durationMin: (end.getTime() - start.getTime()) / MS_PER_MIN,
    avgHeartRate: w.score?.average_heart_rate,
    maxHeartRate: w.score?.max_heart_rate,
    // Whoop reports energy in kilojoules; convert to kcal (1 kcal = 4.184 kJ).
    calories: kj != null ? Math.round(kj / 4.184) : undefined,
    distanceMeters: w.score?.distance_meter,
    strain: w.score?.strain,
    raw: w,
  };
}

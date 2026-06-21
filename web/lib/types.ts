// Response shapes from the helf backend (subset we consume).
import type { Intensity, ReadinessStatus, DayAction } from '@helf/ui';

export type { Intensity, ReadinessStatus, DayAction };

export interface TodayAdjustment {
  plannedWorkoutId: string;
  title: string;
  plannedIntensity: Intensity;
  suggestedIntensity: Intensity;
  action: DayAction;
  suggestion: string;
}

export interface TodayResponse {
  date: string;
  readiness: { status: ReadinessStatus; score: number | null };
  headline: string;
  reasons: string[];
  adjustments: TodayAdjustment[];
}

export interface TrainingLoad {
  ctl: number;
  atl: number;
  tsb: number;
  acwr: number;
  acwrZone: 'undertraining' | 'optimal' | 'caution' | 'high-risk' | 'insufficient-data';
}

export interface DashboardResponse {
  latestRecovery: { score: number | null; hrvRmssd: number | null; restingHeartRate: number | null } | null;
  lastSleep: {
    totalSleepMin: number | null;
    deepMin: number | null;
    remMin: number | null;
    lightMin: number | null;
    awakeMin: number | null;
    efficiencyPct: number | null;
  } | null;
  trainingLoad: TrainingLoad;
  recommendation: { status: ReadinessStatus; messages: string[] };
  baselines: { hrvRmssd30d: number | null; restingHeartRate30d: number | null };
}

export interface PlannedItem {
  id: string;
  title: string;
  sportType: string;
  intensity: Intensity;
  status: 'PLANNED' | 'COMPLETED' | 'SKIPPED';
  estimatedDurationMin: number | null;
  estimatedLoad: number | null;
}

export interface CalendarDay {
  date: string;
  readiness: { score: number; status: ReadinessStatus } | null;
  planned: PlannedItem[];
  completed: unknown[];
  plannedLoad: number;
  completedLoad: number;
}

export interface ParsedWorkout {
  sportType: string;
  intensity: Intensity;
  estimatedDurationMin?: number;
  confidence: number;
}

export interface Template {
  id: string;
  title: string;
  sportType: string;
  intensity: Intensity;
  estimatedDurationMin: number | null;
}

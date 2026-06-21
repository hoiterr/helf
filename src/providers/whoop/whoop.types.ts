/**
 * Subset of WHOOP API v2 response shapes we consume.
 * Docs: https://developer.whoop.com/api/  (verify field names against the live spec)
 */

export interface WhoopTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type: string;
}

export interface WhoopPaginated<T> {
  records: T[];
  next_token?: string;
}

export interface WhoopProfile {
  user_id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface WhoopRecovery {
  cycle_id: number;
  sleep_id?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score?: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage?: number;
    skin_temp_celsius?: number;
  };
}

export interface WhoopSleep {
  id: string;
  user_id: number;
  created_at: string;
  start: string;
  end: string;
  timezone_offset: string; // e.g. "+02:00"
  nap: boolean;
  score_state: string;
  score?: {
    stage_summary?: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
    };
    sleep_performance_percentage?: number;
    sleep_efficiency_percentage?: number;
    respiratory_rate?: number;
  };
}

export interface WhoopWorkout {
  id: string;
  user_id: number;
  created_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_id: number;
  score_state: string;
  score?: {
    strain: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
    kilojoule?: number;
    distance_meter?: number;
  };
}

/** Whoop webhook payload, e.g. { user_id, id, type: "recovery.updated" }. */
export interface WhoopWebhookEvent {
  user_id: number;
  id: number | string;
  type: string;
}

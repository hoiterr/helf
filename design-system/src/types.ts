/** Shared domain unions used across planning components (mirror the backend enums). */
export type Intensity = 'RECOVERY' | 'EASY' | 'MODERATE' | 'HARD' | 'MAX';
export type WorkoutStatus = 'PLANNED' | 'COMPLETED' | 'SKIPPED';
export type ReadinessStatus = 'GREEN' | 'AMBER' | 'RED';
/** What the readiness engine recommends doing with a planned session. */
export type DayAction = 'proceed' | 'reduce' | 'swap' | 'rest';

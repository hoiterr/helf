/**
 * Domain enums as const-objects + matching union types.
 *
 * These used to be Prisma `enum`s, but the app now runs on SQLite for zero-config
 * local dev (`npm run dev`), and SQLite has no enum columns. Defining them here
 * keeps full type-safety and a single source of truth, independent of the DB:
 *   - `Provider.WHOOP` etc. work as values
 *   - `: Provider` works as a type
 *   - `@IsEnum(Provider)` works for validation
 *
 * The DB stores these as plain strings; cast at the read boundary when needed.
 */

export const Provider = {
  WHOOP: 'WHOOP',
  OURA: 'OURA',
  POLAR: 'POLAR',
  WITHINGS: 'WITHINGS',
  EIGHT_SLEEP: 'EIGHT_SLEEP',
  GARMIN: 'GARMIN',
  STRAVA: 'STRAVA',
  DEXCOM: 'DEXCOM',
} as const;
export type Provider = (typeof Provider)[keyof typeof Provider];

export const ConnectionStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
  ERROR: 'ERROR',
} as const;
export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];

export const Intensity = {
  RECOVERY: 'RECOVERY',
  EASY: 'EASY',
  MODERATE: 'MODERATE',
  HARD: 'HARD',
  MAX: 'MAX',
} as const;
export type Intensity = (typeof Intensity)[keyof typeof Intensity];

export const PlannedStatus = {
  PLANNED: 'PLANNED',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
} as const;
export type PlannedStatus = (typeof PlannedStatus)[keyof typeof PlannedStatus];

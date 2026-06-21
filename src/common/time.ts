export function daysAgo(days: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/** UTC calendar-day key, e.g. "2026-06-21". */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Midnight UTC for the calendar day of `date` — used as the canonical `date` value. */
export function utcMidnight(date: Date): Date {
  return new Date(`${dayKey(date)}T00:00:00.000Z`);
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

/** UTC midnight of the Sunday that begins `date`'s week. */
export function startOfUtcWeek(date: Date): Date {
  const d = utcMidnight(date);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d;
}

export const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

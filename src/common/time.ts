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

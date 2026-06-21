export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayYmd(): string {
  return ymd(new Date());
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/** UTC Sunday that starts the current week. */
export function startOfWeek(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  x.setUTCDate(x.getUTCDate() - x.getUTCDay());
  return x;
}

export function formatMinutes(min: number | null | undefined): string {
  if (min == null) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function longDate(d: Date = new Date()): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

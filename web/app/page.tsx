'use client';

import {
  Badge,
  CalendarWeek,
  Card,
  MetricCard,
  QuickAddInput,
  SleepStagesBar,
  TodayPanel,
  TrainingLoadCard,
  type CalendarWeekDay,
  type TrendDirection,
} from '@helf/ui';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { addDays, formatMinutes, longDate, startOfWeek, todayYmd, ymd } from '../lib/date';
import type { CalendarDay, DashboardResponse, ParsedWorkout, TodayResponse } from '../lib/types';

function trend(
  value: number | null | undefined,
  baseline: number | null | undefined,
  higherIsBetter: boolean,
): { direction: TrendDirection; value: string; good?: boolean } | undefined {
  if (value == null || baseline == null) return undefined;
  const diff = Math.round(value - baseline);
  if (diff === 0) return { direction: 'flat', value: 'on baseline' };
  const direction: TrendDirection = diff > 0 ? 'up' : 'down';
  const good = higherIsBetter ? diff > 0 : diff < 0;
  return { direction, value: `${diff > 0 ? '+' : ''}${diff}`, good };
}

export default function HomePage() {
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [dash, setDash] = useState<DashboardResponse | null>(null);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [quick, setQuick] = useState('');
  const [parsed, setParsed] = useState<ParsedWorkout | null>(null);

  const load = useCallback(async () => {
    const weekStart = startOfWeek();
    const from = ymd(weekStart);
    const to = ymd(addDays(weekStart, 6));
    const [t, d, c] = await Promise.all([api.today(), api.dashboard(), api.calendar(from, to)]);
    setToday(t);
    setDash(d);
    setDays(c);
  }, []);

  useEffect(() => {
    load()
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [load]);

  // Live parse preview (debounced) as the user types in quick-add.
  useEffect(() => {
    if (!quick.trim()) {
      setParsed(null);
      return;
    }
    const id = setTimeout(() => {
      api.parse(quick).then(setParsed).catch(() => setParsed(null));
    }, 250);
    return () => clearTimeout(id);
  }, [quick]);

  const refresh = () =>
    load().catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));

  const acceptAdjustment = (id: string) => {
    const adj = today?.adjustments.find((a) => a.plannedWorkoutId === id);
    if (!adj) return;
    const body = adj.action === 'proceed' ? {} : { intensity: adj.suggestedIntensity };
    api.updatePlanned(id, body).then(refresh).catch(() => undefined);
  };
  const skipAdjustment = (id: string) =>
    api.updatePlanned(id, { status: 'SKIPPED' }).then(refresh).catch(() => undefined);

  const submitQuick = () => {
    if (!quick.trim()) return;
    api
      .createPlanned({ date: todayYmd(), text: quick.trim() })
      .then(() => {
        setQuick('');
        return refresh();
      })
      .catch(() => undefined);
  };

  if (loading) return <div className="helf-state">Loading your day…</div>;
  if (error) {
    return (
      <div className="helf-state">
        <p>Couldn’t reach the API.</p>
        <p>
          Make sure the backend is running (<code>npm run dev</code> in the repo root) at{' '}
          <code>{api.baseUrl}</code>.
        </p>
        <p style={{ fontSize: 12, opacity: 0.7 }}>{error}</p>
      </div>
    );
  }

  const week: CalendarWeekDay[] = days.map((day) => ({
    date: day.date,
    readiness: day.readiness ? { status: day.readiness.status } : null,
    isToday: day.date === todayYmd(),
    items: day.planned.map((p) => ({
      id: p.id,
      title: p.title,
      sport: p.sportType,
      intensity: p.intensity,
      status: p.status,
    })),
  }));

  const rec = dash?.latestRecovery ?? null;
  const sleep = dash?.lastSleep ?? null;

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24, maxWidth: 1040, margin: '0 auto' }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>Today</div>
          <div style={{ color: 'var(--helf-color-text-muted)', fontSize: 14 }}>{longDate()}</div>
        </div>
        {today && <Badge tone="brand">{today.readiness.status}</Badge>}
      </header>

      {today && (
        <TodayPanel
          status={today.readiness.status}
          score={today.readiness.score}
          headline={today.headline}
          reasons={today.reasons}
          adjustments={today.adjustments.map((a) => ({
            id: a.plannedWorkoutId,
            title: a.title,
            plannedIntensity: a.plannedIntensity,
            suggestedIntensity: a.suggestedIntensity,
            action: a.action,
            suggestion: a.suggestion,
          }))}
          onAccept={acceptAdjustment}
          onSkip={skipAdjustment}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <MetricCard label="Recovery" value={rec?.score ?? '—'} unit={rec?.score != null ? '%' : undefined} caption="latest" />
        <MetricCard
          label="HRV"
          value={rec?.hrvRmssd != null ? Math.round(rec.hrvRmssd) : '—'}
          unit={rec?.hrvRmssd != null ? 'ms' : undefined}
          trend={trend(rec?.hrvRmssd, dash?.baselines.hrvRmssd30d, true)}
          caption="vs 30-day avg"
        />
        <MetricCard
          label="Resting HR"
          value={rec?.restingHeartRate != null ? Math.round(rec.restingHeartRate) : '—'}
          unit={rec?.restingHeartRate != null ? 'bpm' : undefined}
          trend={trend(rec?.restingHeartRate, dash?.baselines.restingHeartRate30d, false)}
          caption="vs 30-day avg"
        />
        <MetricCard label="Sleep" value={formatMinutes(sleep?.totalSleepMin)} caption="last night" />
      </div>

      <Card title="This week">
        <CalendarWeek days={week} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {dash && (
          <TrainingLoadCard
            ctl={dash.trainingLoad.ctl}
            atl={dash.trainingLoad.atl}
            tsb={dash.trainingLoad.tsb}
            acwr={dash.trainingLoad.acwr}
            acwrZone={dash.trainingLoad.acwrZone}
          />
        )}
        <Card title="Last night" subtitle={sleep?.efficiencyPct != null ? `${Math.round(sleep.efficiencyPct)}% efficiency` : undefined}>
          <SleepStagesBar
            stages={{
              deep: sleep?.deepMin ?? 0,
              rem: sleep?.remMin ?? 0,
              light: sleep?.lightMin ?? 0,
              awake: sleep?.awakeMin ?? 0,
            }}
          />
        </Card>
      </div>

      <QuickAddInput value={quick} onChange={setQuick} parsed={parsed} onSubmit={submitQuick} />
    </div>
  );
}

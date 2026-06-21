'use client';

import {
  Button,
  CalendarWeek,
  QuickAddInput,
  TemplateChip,
  type CalendarWeekDay,
} from '@helf/ui';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { addDays, startOfWeek, todayYmd, ymd } from '../../lib/date';
import type { CalendarDay, ParsedWorkout, Template } from '../../lib/types';

function shortDate(d: string): string {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function CalendarPage() {
  const [offset, setOffset] = useState(0);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState(todayYmd());
  const [quick, setQuick] = useState('');
  const [parsed, setParsed] = useState<ParsedWorkout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const weekStart = addDays(startOfWeek(), offset * 7);
  const from = ymd(weekStart);
  const to = ymd(addDays(weekStart, 6));

  const load = useCallback(async () => {
    const [c, t] = await Promise.all([api.calendar(from, to), api.templates()]);
    setDays(c);
    setTemplates(t);
  }, [from, to]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!quick.trim()) return setParsed(null);
    const id = setTimeout(() => api.parse(quick).then(setParsed).catch(() => setParsed(null)), 250);
    return () => clearTimeout(id);
  }, [quick]);

  const refresh = () => load().catch(() => undefined);

  const addTemplate = (templateId: string) =>
    api.createPlanned({ date: selected, templateId }).then(refresh).catch(() => undefined);

  const submitQuick = () => {
    if (!quick.trim()) return;
    api.createPlanned({ date: selected, text: quick.trim() }).then(() => {
      setQuick('');
      return refresh();
    }).catch(() => undefined);
  };

  if (error) {
    return (
      <div className="helf-state">
        <p>Couldn’t reach the API at <code>{api.baseUrl}</code>.</p>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, maxWidth: 1040, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>
          {shortDate(from)} – {shortDate(to)}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={() => setOffset((o) => o - 1)}>← Prev</Button>
          <Button size="sm" variant="ghost" onClick={() => setOffset(0)}>This week</Button>
          <Button size="sm" variant="secondary" onClick={() => setOffset((o) => o + 1)}>Next →</Button>
        </div>
      </header>

      {loading ? (
        <div className="helf-state">Loading…</div>
      ) : (
        <CalendarWeek days={week} onAdd={(d) => setSelected(d)} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14, color: 'var(--helf-color-text-muted)' }}>
          Adding to <strong style={{ color: 'var(--helf-color-text)' }}>{shortDate(selected)}</strong> — tap “+ Add” on a day to change it.
        </div>
        <QuickAddInput value={quick} onChange={setQuick} parsed={parsed} onSubmit={submitQuick} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {templates.map((t) => (
            <TemplateChip
              key={t.id}
              title={t.title}
              sport={t.sportType}
              intensity={t.intensity}
              durationMin={t.estimatedDurationMin ?? undefined}
              onClick={() => addTemplate(t.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

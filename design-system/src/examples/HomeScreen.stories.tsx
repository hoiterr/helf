import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { Intensity } from '../types';
import { Badge } from '../components/Badge/Badge';
import { Card } from '../components/Card/Card';
import { CalendarWeek, type CalendarWeekDay } from '../components/CalendarWeek/CalendarWeek';
import { MetricCard } from '../components/MetricCard/MetricCard';
import { QuickAddInput, type QuickAddParsed } from '../components/QuickAddInput/QuickAddInput';
import { SleepStagesBar } from '../components/SleepStagesBar/SleepStagesBar';
import { TodayPanel } from '../components/TodayPanel/TodayPanel';
import { TrainingLoadCard } from '../components/TrainingLoadCard/TrainingLoadCard';

function demoParse(text: string): QuickAddParsed | null {
  if (!text.trim()) return null;
  const t = text.toLowerCase();
  const sportType = /run|jog/.test(t) ? 'Running' : /ride|bike|cycl/.test(t) ? 'Cycling' : /swim/.test(t) ? 'Swimming' : /squat|lift|strength/.test(t) ? 'Strength' : 'Workout';
  const intensity: Intensity = /z5|max/.test(t) ? 'MAX' : /z4|hard|threshold|vo2/.test(t) ? 'HARD' : /z3|tempo/.test(t) ? 'MODERATE' : /recovery|z1/.test(t) ? 'RECOVERY' : 'EASY';
  const dur = /(\d+)\s*min\b/.exec(t);
  return { sportType, intensity, estimatedDurationMin: dur ? parseInt(dur[1], 10) : undefined, confidence: 0.8 };
}

const week: CalendarWeekDay[] = [
  { date: '2026-06-21', isToday: true, readiness: { status: 'AMBER' }, items: [{ id: 'g', title: 'Heavy lower', sport: 'Strength', intensity: 'HARD' }] },
  { date: '2026-06-22', readiness: { status: 'GREEN' }, items: [{ id: 'a', title: 'Zone 2 ride', sport: 'Cycling', intensity: 'EASY' }] },
  { date: '2026-06-23', readiness: { status: 'GREEN' }, items: [{ id: 't1', title: 'Threshold run', sport: 'Running', intensity: 'HARD' }] },
  { date: '2026-06-24', items: [{ id: 'm', title: 'Mobility', sport: 'Mobility', intensity: 'RECOVERY' }] },
  { date: '2026-06-25', items: [{ id: 't2', title: 'Threshold run', sport: 'Running', intensity: 'HARD' }] },
  { date: '2026-06-26', items: [] },
  { date: '2026-06-27', items: [{ id: 'lr', title: 'Long ride', sport: 'Cycling', intensity: 'MODERATE' }] },
];

/**
 * Day-to-day HOME SCREEN wireframe, composed entirely from the design system.
 * Top-to-bottom priority: who/where (plan context) → what to do now (readiness
 * gate) → how's my body (vitals) → the week ahead → fitness/fatigue + last night
 * → one-line capture. See docs/home-screen.md for the rationale + data mapping.
 */
function HomeScreen() {
  const [quick, setQuick] = useState('');

  return (
    <div
      className="helf-root"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 20, padding: 24, maxWidth: 1040, margin: '0 auto' }}
    >
      {/* Header: greeting + plan/block context */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>Good morning, Alex</div>
          <div style={{ color: 'var(--helf-color-text-muted)', fontSize: 14 }}>Sunday, 21 June</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge tone="brand">Spring Build</Badge>
          <Badge tone="neutral">Week 1 of 6 · Base</Badge>
        </div>
      </header>

      {/* Hero: the readiness gate — the day's decision, one tap */}
      <TodayPanel
        status="AMBER"
        score={58}
        headline="Moderate readiness — dialled back where it matters."
        reasons={['Under 6h sleep — avoid high-intensity sessions today.', 'Training load ramping (ACWR 1.32) — progress carefully.']}
        adjustments={[
          { id: 'g', title: 'Heavy lower', plannedIntensity: 'HARD', suggestedIntensity: 'MODERATE', action: 'reduce', suggestion: 'Moderate readiness — trim to a steady tempo effort.' },
        ]}
      />

      {/* Vitals: the body's status at a glance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <MetricCard label="Recovery" value={58} unit="%" trend={{ direction: 'down', value: '-9', good: false }} caption="WHOOP" />
        <MetricCard label="HRV" value={61} unit="ms" trend={{ direction: 'down', value: '-7', good: false }} caption="vs 30-day avg" />
        <MetricCard label="Resting HR" value={56} unit="bpm" trend={{ direction: 'up', value: '+3', good: false }} caption="vs 30-day avg" />
        <MetricCard label="Sleep" value="5h 48m" trend={{ direction: 'down', value: 'below target', good: false }} />
      </div>

      {/* The week ahead */}
      <Card title="This week" subtitle="Spring Build · Base block">
        <CalendarWeek days={week} />
      </Card>

      {/* Secondary: form + last night, side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <TrainingLoadCard ctl={62} atl={74} tsb={-12} acwr={1.32} acwrZone="caution" />
        <Card title="Last night" subtitle="6h 32m in bed · 84% efficiency">
          <SleepStagesBar stages={{ deep: 58, rem: 71, light: 219, awake: 44 }} />
        </Card>
      </div>

      {/* One-line capture, always at hand */}
      <QuickAddInput value={quick} onChange={setQuick} parsed={demoParse(quick)} onSubmit={() => setQuick('')} />
    </div>
  );
}

const meta: Meta<typeof HomeScreen> = {
  title: 'Examples/HomeScreen',
  component: HomeScreen,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof HomeScreen>;

export const Today: Story = {};

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { Intensity } from '../types';
import { CalendarWeek, type CalendarWeekDay } from '../components/CalendarWeek/CalendarWeek';
import { QuickAddInput, type QuickAddParsed } from '../components/QuickAddInput/QuickAddInput';
import { TemplateChip } from '../components/TemplateChip/TemplateChip';
import { TodayPanel } from '../components/TodayPanel/TodayPanel';

function demoParse(text: string): QuickAddParsed | null {
  if (!text.trim()) return null;
  const t = text.toLowerCase();
  const sportType = /run|jog/.test(t) ? 'Running' : /ride|bike|cycl/.test(t) ? 'Cycling' : /swim/.test(t) ? 'Swimming' : /squat|lift|strength/.test(t) ? 'Strength' : 'Workout';
  const intensity: Intensity = /z5|max|sprint/.test(t) ? 'MAX' : /z4|hard|threshold|vo2/.test(t) ? 'HARD' : /z3|tempo/.test(t) ? 'MODERATE' : /recovery|z1/.test(t) ? 'RECOVERY' : 'EASY';
  const dur = /(\d+)\s*min\b/.exec(t);
  return { sportType, intensity, estimatedDurationMin: dur ? parseInt(dur[1], 10) : undefined, confidence: 0.8 };
}

const week: CalendarWeekDay[] = [
  { date: '2026-06-15', readiness: { status: 'GREEN' }, items: [{ id: 'a', title: 'Easy 5k', sport: 'Running', intensity: 'EASY', status: 'COMPLETED' }] },
  { date: '2026-06-16', readiness: { status: 'GREEN' }, items: [{ id: 'b', title: 'Threshold 4×5', sport: 'Running', intensity: 'HARD', status: 'COMPLETED' }] },
  { date: '2026-06-17', readiness: { status: 'AMBER' }, items: [{ id: 'c', title: 'Zone 2 ride', sport: 'Cycling', intensity: 'EASY', status: 'COMPLETED' }] },
  { date: '2026-06-18', readiness: { status: 'RED' }, items: [{ id: 'd', title: 'Mobility', sport: 'Mobility', intensity: 'RECOVERY' }] },
  { date: '2026-06-19', readiness: { status: 'AMBER' }, items: [{ id: 'e', title: 'VO2 6×3min', sport: 'Running', intensity: 'MAX' }] },
  { date: '2026-06-20', items: [{ id: 'f', title: 'Long ride', sport: 'Cycling', intensity: 'MODERATE' }] },
  { date: '2026-06-21', isToday: true, items: [{ id: 'g', title: 'Heavy lower', sport: 'Strength', intensity: 'HARD' }] },
];

function Planner() {
  const [quick, setQuick] = useState('40min zone 2 ride');

  return (
    <div className="helf-root" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24, maxWidth: 980 }}>
      <TodayPanel
        status="AMBER"
        score={58}
        headline="Moderate readiness — dialled back where it matters."
        reasons={['Under 6h sleep — avoid high-intensity sessions today.', 'Training load is ramping fast (ACWR 1.38) — progress carefully.']}
        adjustments={[
          { id: 'g', title: 'Heavy lower', plannedIntensity: 'HARD', suggestedIntensity: 'MODERATE', action: 'reduce', suggestion: 'Moderate readiness — trim to a steady tempo effort.' },
        ]}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <QuickAddInput value={quick} onChange={setQuick} parsed={demoParse(quick)} onSubmit={() => setQuick('')} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TemplateChip title="Easy 5k" sport="Running" intensity="EASY" durationMin={30} />
          <TemplateChip title="Threshold 4×5" sport="Running" intensity="HARD" durationMin={50} />
          <TemplateChip title="Zone 2 ride" sport="Cycling" intensity="EASY" durationMin={90} />
          <TemplateChip title="Mobility flow" sport="Mobility" intensity="RECOVERY" durationMin={20} />
        </div>
      </div>

      <CalendarWeek days={week} onAdd={() => undefined} onSelect={() => undefined} />
    </div>
  );
}

const meta: Meta<typeof Planner> = {
  title: 'Examples/Planner',
  component: Planner,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Planner>;

export const Week: Story = {};

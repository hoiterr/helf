import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { Intensity } from '../../types';
import { QuickAddInput, type QuickAddParsed } from './QuickAddInput';

// Tiny demo parser so the story is interactive. The real app passes the backend
// parser's output (src/planning/nl-parser.ts) into `parsed`.
function demoParse(text: string): QuickAddParsed | null {
  if (!text.trim()) return null;
  const t = text.toLowerCase();
  const sportType = /run|jog/.test(t)
    ? 'Running'
    : /ride|bike|cycl/.test(t)
      ? 'Cycling'
      : /swim/.test(t)
        ? 'Swimming'
        : /squat|lift|strength|bench|dead/.test(t)
          ? 'Strength'
          : 'Workout';
  const intensity: Intensity = /z5|max|sprint|race/.test(t)
    ? 'MAX'
    : /z4|hard|threshold|interval|vo2/.test(t)
      ? 'HARD'
      : /z3|tempo|steady/.test(t)
        ? 'MODERATE'
        : /z1|recovery|shakeout/.test(t)
          ? 'RECOVERY'
          : 'EASY';
  const dur = /(\d+)\s*(min|m)\b/.exec(t);
  const sets = /\b(\d+)\s*[x×]\s*(\d+)\b/.test(t);
  const estimatedDurationMin = dur ? parseInt(dur[1], 10) : sets ? 30 : undefined;
  const confidence = (sportType !== 'Workout' ? 0.4 : 0) + (estimatedDurationMin ? 0.4 : 0) + 0.2;
  return { sportType, intensity, estimatedDurationMin, confidence: Math.min(1, confidence) };
}

function Demo() {
  const [value, setValue] = useState('40min zone 2 ride');
  const [added, setAdded] = useState<string[]>([]);
  return (
    <div style={{ width: 560, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <QuickAddInput
        value={value}
        onChange={setValue}
        parsed={demoParse(value)}
        onSubmit={() => {
          if (value.trim()) setAdded((a) => [...a, value.trim()]);
          setValue('');
        }}
      />
      {added.length > 0 && (
        <ul style={{ fontSize: 14, color: 'var(--helf-color-text-muted)' }}>
          {added.map((a, i) => (
            <li key={i}>Added: {a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

const meta: Meta<typeof QuickAddInput> = {
  title: 'Planning/QuickAddInput',
  component: QuickAddInput,
};
export default meta;

type Story = StoryObj<typeof QuickAddInput>;

export const Interactive: Story = { render: () => <Demo /> };

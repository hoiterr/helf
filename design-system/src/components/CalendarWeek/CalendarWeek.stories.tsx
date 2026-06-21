import type { Meta, StoryObj } from '@storybook/react';
import { CalendarWeek, type CalendarWeekDay } from './CalendarWeek';

const week: CalendarWeekDay[] = [
  {
    date: '2026-06-15',
    readiness: { status: 'GREEN' },
    items: [{ id: '1', title: 'Easy 5k', sport: 'Running', intensity: 'EASY', status: 'COMPLETED' }],
  },
  {
    date: '2026-06-16',
    readiness: { status: 'GREEN' },
    items: [{ id: '2', title: 'Threshold 4×5', sport: 'Running', intensity: 'HARD', status: 'COMPLETED' }],
  },
  { date: '2026-06-17', readiness: { status: 'AMBER' }, items: [{ id: '3', title: 'Zone 2 ride', sport: 'Cycling', intensity: 'EASY', status: 'COMPLETED' }] },
  { date: '2026-06-18', readiness: { status: 'RED' }, items: [{ id: '4', title: 'Rest / mobility', sport: 'Mobility', intensity: 'RECOVERY' }] },
  {
    date: '2026-06-19',
    readiness: { status: 'AMBER' },
    items: [{ id: '5', title: 'VO2 6×3min', sport: 'Running', intensity: 'MAX' }],
  },
  { date: '2026-06-20', items: [{ id: '6', title: 'Long ride', sport: 'Cycling', intensity: 'MODERATE' }] },
  { date: '2026-06-21', isToday: true, items: [{ id: '7', title: 'Heavy lower', sport: 'Strength', intensity: 'HARD' }] },
];

const meta: Meta<typeof CalendarWeek> = {
  title: 'Planning/CalendarWeek',
  component: CalendarWeek,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div style={{ padding: 24 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof CalendarWeek>;

export const TrainingWeek: Story = {
  args: { days: week, onAdd: () => undefined, onSelect: () => undefined },
};

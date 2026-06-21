import type { Meta, StoryObj } from '@storybook/react';
import { WorkoutCard } from './WorkoutCard';

const meta: Meta<typeof WorkoutCard> = {
  title: 'Planning/WorkoutCard',
  component: WorkoutCard,
  decorators: [(Story) => <div style={{ width: 380 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof WorkoutCard>;

export const Planned: Story = {
  args: { title: 'Threshold intervals', sport: 'Running', intensity: 'HARD', durationMin: 50, load: 70 },
};

export const Completed: Story = {
  args: {
    title: 'Zone 2 ride',
    sport: 'Cycling',
    intensity: 'EASY',
    durationMin: 90,
    load: 72,
    status: 'COMPLETED',
  },
};

export const WithGuidance: Story = {
  args: {
    title: '6×3min VO2',
    sport: 'Running',
    intensity: 'MAX',
    durationMin: 45,
    load: 81,
    adjustment: { action: 'reduce', suggestion: 'Moderate readiness — cap at Zone 4, skip the Zone 5 work.' },
  },
};

export const RestSwap: Story = {
  args: {
    title: 'Heavy squats 5×5',
    sport: 'Strength',
    intensity: 'HARD',
    durationMin: 60,
    load: 84,
    adjustment: { action: 'swap', suggestion: 'Low readiness — swap for an easy recovery session, or rest.' },
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { MetricCard } from './MetricCard';

const meta: Meta<typeof MetricCard> = {
  title: 'Dashboard/MetricCard',
  component: MetricCard,
};
export default meta;

type Story = StoryObj<typeof MetricCard>;

export const Hrv: Story = {
  args: {
    label: 'HRV',
    value: 68,
    unit: 'ms',
    trend: { direction: 'up', value: '+6', good: true },
    caption: 'vs 30-day avg',
  },
};

export const RestingHr: Story = {
  args: {
    label: 'Resting HR',
    value: 54,
    unit: 'bpm',
    trend: { direction: 'down', value: '-2', good: true },
    caption: 'vs 30-day avg',
  },
};

export const Sleep: Story = {
  args: { label: 'Sleep', value: '7h 42m', trend: { direction: 'flat', value: 'on target' } },
};

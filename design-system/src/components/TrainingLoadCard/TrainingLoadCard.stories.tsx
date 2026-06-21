import type { Meta, StoryObj } from '@storybook/react';
import { TrainingLoadCard } from './TrainingLoadCard';

const meta: Meta<typeof TrainingLoadCard> = {
  title: 'Dashboard/TrainingLoadCard',
  component: TrainingLoadCard,
  decorators: [(Story) => <div style={{ width: 360 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof TrainingLoadCard>;

export const Optimal: Story = {
  args: { ctl: 62, atl: 58, tsb: 4, acwr: 1.12, acwrZone: 'optimal' },
};

export const Fatigued: Story = {
  args: { ctl: 70, atl: 92, tsb: -22, acwr: 1.48, acwrZone: 'caution' },
};

export const HighRisk: Story = {
  args: { ctl: 55, atl: 95, tsb: -40, acwr: 1.7, acwrZone: 'high-risk' },
};

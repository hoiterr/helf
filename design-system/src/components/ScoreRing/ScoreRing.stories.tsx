import type { Meta, StoryObj } from '@storybook/react';
import { ScoreRing } from './ScoreRing';

const meta: Meta<typeof ScoreRing> = {
  title: 'Dashboard/ScoreRing',
  component: ScoreRing,
  args: { label: 'Recovery', size: 140 },
};
export default meta;

type Story = StoryObj<typeof ScoreRing>;

export const High: Story = { args: { value: 82 } };
export const Moderate: Story = { args: { value: 54 } };
export const Low: Story = { args: { value: 28 } };
export const Readiness: Story = { args: { value: 71, label: 'Readiness' } };

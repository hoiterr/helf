import type { Meta, StoryObj } from '@storybook/react';
import { ReadinessBanner } from './ReadinessBanner';

const meta: Meta<typeof ReadinessBanner> = {
  title: 'Dashboard/ReadinessBanner',
  component: ReadinessBanner,
  decorators: [(Story) => <div style={{ width: 460 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof ReadinessBanner>;

export const Green: Story = {
  args: {
    status: 'GREEN',
    messages: ['Recovered and well-balanced — good to train as planned.'],
  },
};

export const Amber: Story = {
  args: {
    status: 'AMBER',
    messages: [
      'Under 6h sleep — avoid high-intensity sessions today.',
      'HRV is 18% below your baseline — a sign of incomplete recovery.',
    ],
  },
};

export const Red: Story = {
  args: {
    status: 'RED',
    messages: [
      'Recovery is low — prioritise rest or easy Zone 2 only.',
      'Training-load spike (ACWR 1.62) — elevated injury risk, deload recommended.',
    ],
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { IntensityPill } from './IntensityPill';

const meta: Meta<typeof IntensityPill> = {
  title: 'Planning/IntensityPill',
  component: IntensityPill,
  argTypes: {
    intensity: { control: 'inline-radio', options: ['RECOVERY', 'EASY', 'MODERATE', 'HARD', 'MAX'] },
  },
};
export default meta;

type Story = StoryObj<typeof IntensityPill>;

export const Ramp: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <IntensityPill intensity="RECOVERY" />
      <IntensityPill intensity="EASY" />
      <IntensityPill intensity="MODERATE" />
      <IntensityPill intensity="HARD" />
      <IntensityPill intensity="MAX" />
    </div>
  ),
};

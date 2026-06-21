import type { Meta, StoryObj } from '@storybook/react';
import { SleepStagesBar } from './SleepStagesBar';

const meta: Meta<typeof SleepStagesBar> = {
  title: 'Dashboard/SleepStagesBar',
  component: SleepStagesBar,
  decorators: [(Story) => <div style={{ width: 420 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof SleepStagesBar>;

export const TypicalNight: Story = {
  args: { stages: { deep: 95, rem: 110, light: 230, awake: 27 } },
};

export const PoorNight: Story = {
  args: { stages: { deep: 38, rem: 52, light: 165, awake: 64 } },
};

export const NoLegend: Story = {
  args: { stages: { deep: 95, rem: 110, light: 230, awake: 27 }, hideLegend: true },
};

import type { Meta, StoryObj } from '@storybook/react';
import { TemplateChip } from './TemplateChip';

const meta: Meta<typeof TemplateChip> = {
  title: 'Planning/TemplateChip',
  component: TemplateChip,
};
export default meta;

type Story = StoryObj<typeof TemplateChip>;

export const Library: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 460 }}>
      <TemplateChip title="Easy 5k" sport="Running" intensity="EASY" durationMin={30} />
      <TemplateChip title="Threshold 4×5" sport="Running" intensity="HARD" durationMin={50} />
      <TemplateChip title="Zone 2 ride" sport="Cycling" intensity="EASY" durationMin={90} />
      <TemplateChip title="Heavy lower" sport="Strength" intensity="HARD" durationMin={60} />
      <TemplateChip title="Mobility flow" sport="Mobility" intensity="RECOVERY" durationMin={20} />
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';
import { SportIcon } from './SportIcon';

const meta: Meta<typeof SportIcon> = {
  title: 'Planning/SportIcon',
  component: SportIcon,
};
export default meta;

type Story = StoryObj<typeof SportIcon>;

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      {['Running', 'Cycling', 'Swimming', 'Strength', 'Rowing', 'Mobility', 'Hiking'].map((s) => (
        <SportIcon key={s} sport={s} />
      ))}
    </div>
  ),
};

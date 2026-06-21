import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Recovered', dot: true },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'brand', 'success', 'warning', 'danger'] },
  },
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Success: Story = { args: { tone: 'success', children: 'High recovery' } };
export const Warning: Story = { args: { tone: 'warning', children: 'Moderate' } };
export const Danger: Story = { args: { tone: 'danger', children: 'Low recovery' } };
export const Brand: Story = { args: { tone: 'brand', dot: false, children: 'WHOOP' } };

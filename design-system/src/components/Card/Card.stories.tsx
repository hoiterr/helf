import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Button/Button';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  args: {
    title: 'Last night',
    subtitle: '7h 42m in bed',
    children: 'Your sleep looked consistent with your 30-day average.',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Training plan',
    subtitle: 'Week 3 · Build',
    actions: <Button size="sm" variant="ghost">Edit</Button>,
    children: 'Three quality sessions scheduled this week.',
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { TodayPanel } from './TodayPanel';

const meta: Meta<typeof TodayPanel> = {
  title: 'Planning/TodayPanel',
  component: TodayPanel,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div style={{ padding: 24, maxWidth: 820 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof TodayPanel>;

export const Ready: Story = {
  args: {
    status: 'GREEN',
    score: 82,
    headline: 'You’re ready — train as planned.',
    reasons: ['Recovered and well-balanced — good to train as planned.'],
    adjustments: [
      {
        id: '1',
        title: 'Threshold 4×5min',
        plannedIntensity: 'HARD',
        suggestedIntensity: 'HARD',
        action: 'proceed',
        suggestion: 'Fully recovered — send it as planned.',
      },
    ],
  },
};

export const DialledBack: Story = {
  args: {
    status: 'AMBER',
    score: 58,
    headline: 'Moderate readiness — dialled back where it matters.',
    reasons: [
      'Under 6h sleep — avoid high-intensity sessions today.',
      'Training load is ramping fast (ACWR 1.38) — progress carefully.',
    ],
    adjustments: [
      {
        id: '1',
        title: 'VO2 6×3min',
        plannedIntensity: 'MAX',
        suggestedIntensity: 'HARD',
        action: 'reduce',
        suggestion: 'Moderate readiness — cap the top end at Zone 4, skip the Zone 5 work.',
      },
    ],
  },
};

export const RestDay: Story = {
  args: {
    status: 'RED',
    score: 26,
    headline: 'Low readiness — eased today’s plan toward recovery.',
    reasons: ['Recovery is low — prioritise rest or easy Zone 2 only.'],
    adjustments: [
      {
        id: '1',
        title: 'Heavy squats 5×5',
        plannedIntensity: 'HARD',
        suggestedIntensity: 'RECOVERY',
        action: 'swap',
        suggestion: 'Low readiness — swap for an easy recovery session, or take a rest day.',
      },
    ],
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../components/Badge/Badge';
import { Card } from '../components/Card/Card';
import { MetricCard } from '../components/MetricCard/MetricCard';
import { ReadinessBanner } from '../components/ReadinessBanner/ReadinessBanner';
import { ScoreRing } from '../components/ScoreRing/ScoreRing';
import { SleepStagesBar } from '../components/SleepStagesBar/SleepStagesBar';

/**
 * A composed "today" view — exactly the data the backend `/users/:id/dashboard`
 * endpoint returns, rendered with the design system. Demonstrates how the parts
 * fit together.
 */
function DashboardExample() {
  return (
    <div
      className="helf-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 24,
        maxWidth: 760,
      }}
    >
      <ReadinessBanner
        status="AMBER"
        messages={[
          'Under 6h sleep — avoid high-intensity sessions today.',
          'Training load is ramping fast (ACWR 1.38) — progress carefully.',
        ]}
      />

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Card title="Recovery" actions={<Badge tone="brand">WHOOP</Badge>}>
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <ScoreRing value={58} label="Recovery" />
          </div>
        </Card>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            flex: 1,
            minWidth: 280,
          }}
        >
          <MetricCard label="HRV" value={61} unit="ms" trend={{ direction: 'down', value: '-7', good: false }} caption="vs 30-day avg" />
          <MetricCard label="Resting HR" value={56} unit="bpm" trend={{ direction: 'up', value: '+3', good: false }} caption="vs 30-day avg" />
          <MetricCard label="Sleep" value="5h 48m" trend={{ direction: 'down', value: 'below target', good: false }} />
          <MetricCard label="Strain" value={11.4} caption="yesterday" />
        </div>
      </div>

      <Card title="Last night" subtitle="6h 32m in bed">
        <SleepStagesBar stages={{ deep: 58, rem: 71, light: 219, awake: 44 }} />
      </Card>
    </div>
  );
}

const meta: Meta<typeof DashboardExample> = {
  title: 'Examples/Dashboard',
  component: DashboardExample,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof DashboardExample>;

export const Today: Story = {};

import type { ReactNode } from 'react';
import './MetricCard.css';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface MetricCardProps {
  /** Metric name, e.g. "Resting HR". */
  label: string;
  /** Primary value, e.g. 52 or "7h 42m". */
  value: ReactNode;
  /** Unit shown after the value, e.g. "bpm" or "ms". */
  unit?: string;
  /** Trend vs. baseline. `good` controls whether the direction reads as positive. */
  trend?: { direction: TrendDirection; value: string; good?: boolean };
  /** Small caption under the value, e.g. "vs 30-day avg". */
  caption?: string;
}

const ARROW: Record<TrendDirection, string> = { up: '▲', down: '▼', flat: '→' };

/** A single dashboard stat tile (HRV, resting HR, sleep, etc.) with an optional trend. */
export function MetricCard({ label, value, unit, trend, caption }: MetricCardProps) {
  const trendTone =
    trend == null || trend.direction === 'flat'
      ? 'flat'
      : trend.good ?? trend.direction === 'up'
        ? 'good'
        : 'bad';

  return (
    <div className="helf-metric">
      <span className="helf-metric__label">{label}</span>
      <div className="helf-metric__value-row">
        <span className="helf-metric__value">{value}</span>
        {unit && <span className="helf-metric__unit">{unit}</span>}
        {trend && (
          <span className={`helf-metric__trend helf-metric__trend--${trendTone}`}>
            <span aria-hidden="true">{ARROW[trend.direction]}</span> {trend.value}
          </span>
        )}
      </div>
      {caption && <span className="helf-metric__caption">{caption}</span>}
    </div>
  );
}

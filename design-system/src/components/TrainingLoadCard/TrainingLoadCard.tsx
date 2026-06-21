import './TrainingLoadCard.css';
import type { Tone } from '../../tokens/tokens';
import { Badge } from '../Badge/Badge';

export type AcwrZone =
  | 'undertraining'
  | 'optimal'
  | 'caution'
  | 'high-risk'
  | 'insufficient-data';

export interface TrainingLoadCardProps {
  /** Chronic Training Load — "fitness". */
  ctl: number;
  /** Acute Training Load — "fatigue". */
  atl: number;
  /** Training Stress Balance (ctl − atl) — "form / freshness". */
  tsb: number;
  acwr: number;
  acwrZone: AcwrZone;
}

const ZONE_TONE: Record<AcwrZone, Tone> = {
  optimal: 'success',
  caution: 'warning',
  'high-risk': 'danger',
  undertraining: 'neutral',
  'insufficient-data': 'neutral',
};
const ZONE_LABEL: Record<AcwrZone, string> = {
  optimal: 'Optimal',
  caution: 'Ramping',
  'high-risk': 'High risk',
  undertraining: 'Detraining',
  'insufficient-data': 'No data',
};

function formTone(tsb: number): string {
  if (tsb >= 5) return 'var(--helf-color-success)'; // fresh
  if (tsb <= -20) return 'var(--helf-color-danger)'; // very fatigued
  if (tsb < -5) return 'var(--helf-color-warning)'; // fatigued
  return 'var(--helf-color-text)'; // balanced
}

/** Fitness / fatigue / form at a glance, plus the ACWR injury-risk signal. */
export function TrainingLoadCard({ ctl, atl, tsb, acwr, acwrZone }: TrainingLoadCardProps) {
  return (
    <div className="helf-load">
      <div className="helf-load__head">
        <h3 className="helf-load__title">Training load</h3>
        <Badge tone={ZONE_TONE[acwrZone]}>ACWR {acwr.toFixed(2)} · {ZONE_LABEL[acwrZone]}</Badge>
      </div>
      <div className="helf-load__stats">
        <div className="helf-load__stat">
          <span className="helf-load__value">{Math.round(ctl)}</span>
          <span className="helf-load__label">Fitness</span>
        </div>
        <div className="helf-load__stat">
          <span className="helf-load__value">{Math.round(atl)}</span>
          <span className="helf-load__label">Fatigue</span>
        </div>
        <div className="helf-load__stat">
          <span className="helf-load__value" style={{ color: formTone(tsb) }}>
            {tsb > 0 ? '+' : ''}{Math.round(tsb)}
          </span>
          <span className="helf-load__label">Form</span>
        </div>
      </div>
    </div>
  );
}

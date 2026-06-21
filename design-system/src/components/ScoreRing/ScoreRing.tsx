import './ScoreRing.css';
import { toneForScore, type Tone } from '../../tokens/tokens';

export interface ScoreRingProps {
  /** Score 0–100 (recovery / readiness). */
  value: number;
  /** Caption under the number, e.g. "Recovery". */
  label?: string;
  /** Diameter in px. @default 140 */
  size?: number;
  /** Override the auto color. By default the tone is derived from the score thresholds. */
  tone?: Tone;
}

const TONE_VAR: Record<Tone, string> = {
  success: 'var(--helf-color-success)',
  warning: 'var(--helf-color-warning)',
  danger: 'var(--helf-color-danger)',
  neutral: 'var(--helf-color-text-muted)',
};

/**
 * Circular recovery/readiness gauge. Color is derived from the score
 * (red < 34, amber < 67, else green) unless `tone` is given — mirroring the
 * backend readiness thresholds.
 */
export function ScoreRing({ value, label, size = 140, tone }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const resolvedTone: Tone = tone ?? toneForScore(clamped);
  const color = TONE_VAR[resolvedTone];

  const stroke = Math.max(8, Math.round(size * 0.09));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className="helf-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
           aria-label={`${label ?? 'Score'}: ${Math.round(clamped)} out of 100`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--helf-color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="helf-ring__center">
        <span className="helf-ring__value" style={{ color }}>
          {Math.round(clamped)}
        </span>
        {label && <span className="helf-ring__label">{label}</span>}
      </div>
    </div>
  );
}

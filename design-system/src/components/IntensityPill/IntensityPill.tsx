import './IntensityPill.css';
import type { Intensity } from '../../types';

export interface IntensityPillProps {
  intensity: Intensity;
  size?: 'sm' | 'md';
}

const LABEL: Record<Intensity, string> = {
  RECOVERY: 'Recovery',
  EASY: 'Easy',
  MODERATE: 'Moderate',
  HARD: 'Hard',
  MAX: 'Max',
};

/** Colour-ramped effort label (calm grey → hot red), aligned with the backend Intensity enum. */
export function IntensityPill({ intensity, size = 'md' }: IntensityPillProps) {
  return (
    <span className={`helf-intensity helf-intensity--${intensity.toLowerCase()} helf-intensity--${size}`}>
      {LABEL[intensity]}
    </span>
  );
}

import './TemplateChip.css';
import type { Intensity } from '../../types';
import { SportIcon } from '../SportIcon/SportIcon';

export interface TemplateChipProps {
  title: string;
  sport: string;
  intensity?: Intensity;
  durationMin?: number;
  /** One-tap: drop this saved session onto the selected day. */
  onClick?: () => void;
}

const DOT: Record<Intensity, string> = {
  RECOVERY: 'var(--helf-color-text-muted)',
  EASY: 'var(--helf-color-success)',
  MODERATE: 'var(--helf-color-primary)',
  HARD: 'var(--helf-color-warning)',
  MAX: 'var(--helf-color-danger)',
};

/** A reusable saved session, added to a day in one tap. The "spend less time" lever. */
export function TemplateChip({ title, sport, intensity, durationMin, onClick }: TemplateChipProps) {
  return (
    <button className="helf-tchip" type="button" onClick={onClick}>
      <SportIcon sport={sport} size={26} chip={false} />
      <span className="helf-tchip__title">{title}</span>
      {durationMin != null && <span className="helf-tchip__meta">{durationMin}m</span>}
      {intensity && (
        <span className="helf-tchip__dot" style={{ background: DOT[intensity] }} aria-hidden="true" />
      )}
      <span className="helf-tchip__add" aria-hidden="true">+</span>
    </button>
  );
}

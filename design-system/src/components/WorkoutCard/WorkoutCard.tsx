import './WorkoutCard.css';
import type { DayAction, Intensity, WorkoutStatus } from '../../types';
import { IntensityPill } from '../IntensityPill/IntensityPill';
import { SportIcon } from '../SportIcon/SportIcon';

export interface WorkoutCardProps {
  title: string;
  sport: string;
  intensity: Intensity;
  durationMin?: number;
  load?: number;
  status?: WorkoutStatus;
  /** Readiness-aware hint from the guidance engine; shown only when action ≠ proceed. */
  adjustment?: { action: DayAction; suggestion: string };
  compact?: boolean;
  onClick?: () => void;
}

function fmtDuration(min?: number): string | null {
  if (min == null) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** A planned or completed session. Shows readiness-aware guidance inline when present. */
export function WorkoutCard({
  title,
  sport,
  intensity,
  durationMin,
  load,
  status = 'PLANNED',
  adjustment,
  compact = false,
  onClick,
}: WorkoutCardProps) {
  const meta = [fmtDuration(durationMin), load != null ? `${Math.round(load)} load` : null]
    .filter(Boolean)
    .join(' · ');
  const showHint = adjustment && adjustment.action !== 'proceed';

  const className = [
    'helf-wcard',
    compact ? 'helf-wcard--compact' : '',
    status === 'COMPLETED' ? 'helf-wcard--done' : '',
    status === 'SKIPPED' ? 'helf-wcard--skipped' : '',
    onClick ? 'helf-wcard--clickable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const inner = (
    <>
      <div className="helf-wcard__main">
        <SportIcon sport={sport} size={compact ? 28 : 40} />
        <div className="helf-wcard__body">
          <div className="helf-wcard__titlerow">
            <span className="helf-wcard__title">{title}</span>
            {status === 'COMPLETED' && (
              <span className="helf-wcard__check" aria-label="Completed">✓</span>
            )}
          </div>
          <div className="helf-wcard__metarow">
            <IntensityPill intensity={intensity} size="sm" />
            {meta && <span className="helf-wcard__meta">{meta}</span>}
          </div>
        </div>
      </div>
      {showHint && (
        <div className={`helf-wcard__hint helf-wcard__hint--${adjustment.action}`}>
          {adjustment.suggestion}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button className={className} type="button" onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

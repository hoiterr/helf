import './CalendarDayCell.css';
import type { Intensity, ReadinessStatus, WorkoutStatus } from '../../types';
import { sportEmoji } from '../SportIcon/SportIcon';

export interface DayCellItem {
  id: string;
  title: string;
  sport: string;
  intensity: Intensity;
  status?: WorkoutStatus;
}

export interface CalendarDayCellProps {
  /** ISO date 'YYYY-MM-DD'. */
  date: string;
  readiness?: { status: ReadinessStatus } | null;
  items?: DayCellItem[];
  isToday?: boolean;
  onAdd?: (date: string) => void;
  onSelect?: (id: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const READINESS_COLOR: Record<ReadinessStatus, string> = {
  GREEN: 'var(--helf-color-success)',
  AMBER: 'var(--helf-color-warning)',
  RED: 'var(--helf-color-danger)',
};
const INTENSITY_COLOR: Record<Intensity, string> = {
  RECOVERY: 'var(--helf-color-text-muted)',
  EASY: 'var(--helf-color-success)',
  MODERATE: 'var(--helf-color-primary)',
  HARD: 'var(--helf-color-warning)',
  MAX: 'var(--helf-color-danger)',
};

/** A single day in the calendar grid: weekday/date, readiness dot, and its sessions. */
export function CalendarDayCell({
  date,
  readiness,
  items = [],
  isToday = false,
  onAdd,
  onSelect,
}: CalendarDayCellProps) {
  const d = new Date(`${date}T00:00:00Z`);
  const weekday = WEEKDAYS[d.getUTCDay()];
  const dayNum = d.getUTCDate();

  return (
    <div className={['helf-day', isToday ? 'helf-day--today' : ''].filter(Boolean).join(' ')}>
      <div className="helf-day__head">
        <span className="helf-day__weekday">{weekday}</span>
        <span className="helf-day__num">{dayNum}</span>
        {readiness && (
          <span
            className="helf-day__readiness"
            style={{ background: READINESS_COLOR[readiness.status] }}
            title={`Readiness: ${readiness.status}`}
          />
        )}
      </div>

      <div className="helf-day__items">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={[
              'helf-day__item',
              item.status === 'COMPLETED' ? 'helf-day__item--done' : '',
              item.status === 'SKIPPED' ? 'helf-day__item--skipped' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ borderLeftColor: INTENSITY_COLOR[item.intensity] }}
            onClick={() => onSelect?.(item.id)}
          >
            <span className="helf-day__item-emoji" aria-hidden="true">
              {sportEmoji(item.sport)}
            </span>
            <span className="helf-day__item-title">{item.title}</span>
            {item.status === 'COMPLETED' && <span className="helf-day__item-check">✓</span>}
          </button>
        ))}
      </div>

      {onAdd && (
        <button type="button" className="helf-day__add" onClick={() => onAdd(date)}>
          + Add
        </button>
      )}
    </div>
  );
}

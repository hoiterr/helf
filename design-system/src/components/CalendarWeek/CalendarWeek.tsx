import './CalendarWeek.css';
import type { ReadinessStatus } from '../../types';
import { CalendarDayCell, type DayCellItem } from '../CalendarDayCell/CalendarDayCell';

export interface CalendarWeekDay {
  date: string;
  readiness?: { status: ReadinessStatus } | null;
  items?: DayCellItem[];
  isToday?: boolean;
}

export interface CalendarWeekProps {
  days: CalendarWeekDay[];
  onAdd?: (date: string) => void;
  onSelect?: (id: string) => void;
}

/** A 7-day training week. Maps directly onto the backend `GET /calendar` range. */
export function CalendarWeek({ days, onAdd, onSelect }: CalendarWeekProps) {
  return (
    <div className="helf-week">
      {days.map((day) => (
        <CalendarDayCell
          key={day.date}
          date={day.date}
          readiness={day.readiness}
          items={day.items}
          isToday={day.isToday}
          onAdd={onAdd}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

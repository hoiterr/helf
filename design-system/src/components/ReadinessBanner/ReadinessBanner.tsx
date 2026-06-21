import './ReadinessBanner.css';
import { Badge, type BadgeTone } from '../Badge/Badge';

/** Matches the backend rules engine's readiness status. */
export type ReadinessStatus = 'GREEN' | 'AMBER' | 'RED';

export interface ReadinessBannerProps {
  status: ReadinessStatus;
  /** Threshold-engine messages explaining the status. */
  messages: string[];
  /** Optional headline override. Defaults to a status-appropriate phrase. */
  title?: string;
}

const STATUS_META: Record<
  ReadinessStatus,
  { tone: BadgeTone; label: string; defaultTitle: string }
> = {
  GREEN: { tone: 'success', label: 'Ready', defaultTitle: 'Good to train' },
  AMBER: { tone: 'warning', label: 'Caution', defaultTitle: 'Train with care' },
  RED: { tone: 'danger', label: 'Rest', defaultTitle: 'Prioritise recovery' },
};

/**
 * Surfaces the daily readiness verdict from the rules engine: a colored banner
 * with a status badge and the plain-language reasons behind it.
 */
export function ReadinessBanner({ status, messages, title }: ReadinessBannerProps) {
  const meta = STATUS_META[status];
  return (
    <div className={`helf-readiness helf-readiness--${status.toLowerCase()}`}>
      <div className="helf-readiness__head">
        <h3 className="helf-readiness__title">{title ?? meta.defaultTitle}</h3>
        <Badge tone={meta.tone} dot>
          {meta.label}
        </Badge>
      </div>
      {messages.length > 0 && (
        <ul className="helf-readiness__messages">
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

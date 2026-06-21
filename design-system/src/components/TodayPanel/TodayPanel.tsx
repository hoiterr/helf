import './TodayPanel.css';
import type { DayAction, Intensity, ReadinessStatus } from '../../types';
import type { Tone } from '../../tokens/tokens';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { IntensityPill } from '../IntensityPill/IntensityPill';
import { ScoreRing } from '../ScoreRing/ScoreRing';

export interface TodayAdjustment {
  id: string;
  title: string;
  plannedIntensity: Intensity;
  suggestedIntensity: Intensity;
  action: DayAction;
  suggestion: string;
}

export interface TodayPanelProps {
  status: ReadinessStatus;
  score?: number | null;
  headline: string;
  reasons?: string[];
  adjustments: TodayAdjustment[];
  onAccept?: (id: string) => void;
  onModify?: (id: string) => void;
  onSkip?: (id: string) => void;
}

const STATUS_TONE: Record<ReadinessStatus, Tone> = {
  GREEN: 'success',
  AMBER: 'warning',
  RED: 'danger',
};
const STATUS_LABEL: Record<ReadinessStatus, string> = {
  GREEN: 'Ready',
  AMBER: 'Caution',
  RED: 'Rest',
};

/**
 * The home-screen "Today" gate. It already knows the user's readiness and plan,
 * and tells them what to do with each session — accept, modify, or skip — so the
 * decision is one tap, not a planning exercise.
 */
export function TodayPanel({
  status,
  score,
  headline,
  reasons = [],
  adjustments,
  onAccept,
  onModify,
  onSkip,
}: TodayPanelProps) {
  return (
    <section className={`helf-today helf-today--${status.toLowerCase()}`}>
      <div className="helf-today__head">
        <div className="helf-today__gauge">
          {score != null ? (
            <ScoreRing value={score} label="Readiness" size={120} tone={STATUS_TONE[status]} />
          ) : (
            <Badge tone={STATUS_TONE[status]} dot>
              {STATUS_LABEL[status]}
            </Badge>
          )}
        </div>
        <div className="helf-today__intro">
          <h2 className="helf-today__headline">{headline}</h2>
          {reasons.length > 0 && (
            <ul className="helf-today__reasons">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {adjustments.length > 0 && (
        <div className="helf-today__list">
          {adjustments.map((a) => {
            const changed = a.action !== 'proceed' && a.suggestedIntensity !== a.plannedIntensity;
            return (
              <div key={a.id} className="helf-today__item">
                <div className="helf-today__item-info">
                  <span className="helf-today__item-title">{a.title}</span>
                  <div className="helf-today__item-pills">
                    {changed ? (
                      <>
                        <IntensityPill intensity={a.plannedIntensity} size="sm" />
                        <span className="helf-today__arrow" aria-hidden="true">→</span>
                        <IntensityPill intensity={a.suggestedIntensity} size="sm" />
                      </>
                    ) : (
                      <IntensityPill intensity={a.plannedIntensity} size="sm" />
                    )}
                  </div>
                  <p className="helf-today__suggestion">{a.suggestion}</p>
                </div>
                <div className="helf-today__actions">
                  <Button size="sm" variant="primary" onClick={() => onAccept?.(a.id)}>
                    {changed ? 'Accept change' : 'Accept'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => onModify?.(a.id)}>
                    Modify
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onSkip?.(a.id)}>
                    Skip
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

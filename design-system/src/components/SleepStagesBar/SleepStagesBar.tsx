import './SleepStagesBar.css';

export interface SleepStages {
  /** Minutes in each stage. */
  deep: number;
  light: number;
  rem: number;
  awake: number;
}

export interface SleepStagesBarProps {
  stages: SleepStages;
  /** Hide the legend below the bar. */
  hideLegend?: boolean;
}

type StageKey = keyof SleepStages;

const STAGE_META: { key: StageKey; label: string; varName: string }[] = [
  { key: 'deep', label: 'Deep', varName: '--helf-color-primary' },
  { key: 'rem', label: 'REM', varName: '--helf-color-success' },
  { key: 'light', label: 'Light', varName: '--helf-color-primary-subtle' },
  { key: 'awake', label: 'Awake', varName: '--helf-color-warning' },
];

function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Stacked horizontal bar of sleep stages with a legend. Inputs are minutes per stage. */
export function SleepStagesBar({ stages, hideLegend = false }: SleepStagesBarProps) {
  const total = STAGE_META.reduce((sum, s) => sum + Math.max(0, stages[s.key]), 0);

  return (
    <div className="helf-sleep">
      <div className="helf-sleep__bar" role="img" aria-label={`Sleep stages, ${fmt(total)} total`}>
        {total === 0
          ? <div className="helf-sleep__empty" />
          : STAGE_META.map((s) => {
              const value = Math.max(0, stages[s.key]);
              if (value === 0) return null;
              return (
                <div
                  key={s.key}
                  className="helf-sleep__segment"
                  style={{ flexGrow: value, background: `var(${s.varName})` }}
                  title={`${s.label}: ${fmt(value)}`}
                />
              );
            })}
      </div>
      {!hideLegend && (
        <ul className="helf-sleep__legend">
          {STAGE_META.map((s) => (
            <li key={s.key} className="helf-sleep__legend-item">
              <span className="helf-sleep__swatch" style={{ background: `var(${s.varName})` }} />
              <span className="helf-sleep__legend-label">{s.label}</span>
              <span className="helf-sleep__legend-value">{fmt(Math.max(0, stages[s.key]))}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

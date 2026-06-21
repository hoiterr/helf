import './QuickAddInput.css';
import type { KeyboardEvent } from 'react';
import type { Intensity } from '../../types';
import { IntensityPill } from '../IntensityPill/IntensityPill';
import { SportIcon } from '../SportIcon/SportIcon';

export interface QuickAddParsed {
  sportType: string;
  intensity: Intensity;
  estimatedDurationMin?: number;
  /** 0–1 — below ~0.5 we nudge the user to refine or edit manually. */
  confidence: number;
}

export interface QuickAddInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  /** Live parse of `value` (computed by the backend / parser) shown as a preview. */
  parsed?: QuickAddParsed | null;
  disabled?: boolean;
}

/**
 * Natural-language workout entry. The user types shorthand ("20min zone 2 ride")
 * and sees the structured interpretation before committing — creation in one line.
 * Presentational: pass `parsed` from the parser; the component renders the preview.
 */
export function QuickAddInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Add a workout — e.g. “5×5 back squat @100kg” or “40min zone 2 ride”',
  parsed,
  disabled = false,
}: QuickAddInputProps) {
  const canSubmit = value.trim().length > 0 && !disabled;

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && canSubmit) onSubmit?.();
  }

  return (
    <div className="helf-quickadd">
      <div className="helf-quickadd__row">
        <span className="helf-quickadd__spark" aria-hidden="true">⚡</span>
        <input
          className="helf-quickadd__input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
        />
        <button
          className="helf-quickadd__add"
          type="button"
          onClick={() => canSubmit && onSubmit?.()}
          disabled={!canSubmit}
        >
          Add
        </button>
      </div>

      {parsed && value.trim().length > 0 && (
        <div className="helf-quickadd__preview">
          <SportIcon sport={parsed.sportType} size={24} />
          <span className="helf-quickadd__sport">{parsed.sportType}</span>
          <IntensityPill intensity={parsed.intensity} size="sm" />
          {parsed.estimatedDurationMin != null && (
            <span className="helf-quickadd__chip">{parsed.estimatedDurationMin} min</span>
          )}
          {parsed.confidence < 0.5 && (
            <span className="helf-quickadd__lowconf">Add detail for a better match</span>
          )}
        </div>
      )}
    </div>
  );
}

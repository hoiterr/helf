/**
 * JS mirror of the most-used design tokens, for consumers that need token values
 * in code (e.g. computing chart colors). The CSS variables in `tokens.css` remain
 * the source of truth for styling.
 */
export const tokens = {
  color: {
    primary: 'var(--helf-color-primary)',
    success: 'var(--helf-color-success)',
    warning: 'var(--helf-color-warning)',
    danger: 'var(--helf-color-danger)',
    text: 'var(--helf-color-text)',
    textMuted: 'var(--helf-color-text-muted)',
    surface: 'var(--helf-color-surface)',
    border: 'var(--helf-color-border)',
  },
  space: (step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8): string => `var(--helf-space-${step})`,
  radius: { sm: 'var(--helf-radius-sm)', md: 'var(--helf-radius-md)', lg: 'var(--helf-radius-lg)', full: 'var(--helf-radius-full)' },
} as const;

/** Semantic tone shared by recovery/readiness components. */
export type Tone = 'success' | 'warning' | 'danger' | 'neutral';

/** Map a 0–100 recovery/readiness score to a tone using helf's thresholds. */
export function toneForScore(score: number): Exclude<Tone, 'neutral'> {
  if (score < 34) return 'danger';
  if (score < 67) return 'warning';
  return 'success';
}

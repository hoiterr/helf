import './SportIcon.css';

export interface SportIconProps {
  /** Free-text sport label, e.g. "Running", "Strength" (matched loosely). */
  sport: string;
  size?: number;
  /** Muted circular background. @default true */
  chip?: boolean;
}

const RULES: { test: RegExp; emoji: string }[] = [
  { test: /run|jog|sprint/i, emoji: '🏃' },
  { test: /cycl|ride|bike|spin/i, emoji: '🚴' },
  { test: /swim/i, emoji: '🏊' },
  { test: /lift|strength|gym|squat|dead|bench|press/i, emoji: '🏋️' },
  { test: /row|erg/i, emoji: '🚣' },
  { test: /yoga|mobility|stretch|pilates/i, emoji: '🧘' },
  { test: /walk|hike/i, emoji: '🥾' },
];

/** Resolve a sport label to a representative emoji. Exported for reuse in cards/cells. */
export function sportEmoji(sport: string): string {
  return RULES.find((r) => r.test.test(sport))?.emoji ?? '💪';
}

/** Small sport glyph, optionally on a muted circular chip. No external assets. */
export function SportIcon({ sport, size = 36, chip = true }: SportIconProps) {
  return (
    <span
      className={chip ? 'helf-sport helf-sport--chip' : 'helf-sport'}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
      role="img"
      aria-label={sport}
    >
      {sportEmoji(sport)}
    </span>
  );
}

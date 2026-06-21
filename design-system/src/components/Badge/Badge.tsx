import type { ReactNode } from 'react';
import './Badge.css';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

export interface BadgeProps {
  /** Semantic color. @default 'neutral' */
  tone?: BadgeTone;
  /** Show a leading status dot. */
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

/** Compact status label. Use `success`/`warning`/`danger` for recovery/readiness states. */
export function Badge({ tone = 'neutral', dot = false, className, children }: BadgeProps) {
  return (
    <span
      className={['helf-badge', `helf-badge--${tone}`, className ?? ''].filter(Boolean).join(' ')}
    >
      {dot && <span className="helf-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

import type { ReactNode } from 'react';
import './Card.css';

export interface CardProps {
  /** Optional header title. */
  title?: ReactNode;
  /** Optional secondary line under the title. */
  subtitle?: ReactNode;
  /** Optional content rendered at the top-right of the header (e.g. a Button or Badge). */
  actions?: ReactNode;
  /** Remove inner padding (for media/edge-to-edge content). */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

/** Surface container that groups related content. The building block of the dashboard grid. */
export function Card({ title, subtitle, actions, flush = false, className, children }: CardProps) {
  const hasHeader = title != null || subtitle != null || actions != null;
  return (
    <section className={['helf-card', className ?? ''].filter(Boolean).join(' ')}>
      {hasHeader && (
        <header className="helf-card__header">
          <div className="helf-card__titles">
            {title != null && <h3 className="helf-card__title">{title}</h3>}
            {subtitle != null && <p className="helf-card__subtitle">{subtitle}</p>}
          </div>
          {actions != null && <div className="helf-card__actions">{actions}</div>}
        </header>
      )}
      <div className={flush ? 'helf-card__body helf-card__body--flush' : 'helf-card__body'}>
        {children}
      </div>
    </section>
  );
}

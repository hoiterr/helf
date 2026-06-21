import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual emphasis. @default 'primary' */
  variant?: ButtonVariant;
  /** Control height/padding. @default 'md' */
  size?: ButtonSize;
  /** Stretch to the full width of the container. */
  fullWidth?: boolean;
  children: ReactNode;
}

/** The primary action control. Renders a native `<button>`; all button props pass through. */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'helf-btn',
    `helf-btn--${variant}`,
    `helf-btn--${size}`,
    fullWidth ? 'helf-btn--full' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    // eslint-disable-next-line react/button-has-type
    <button className={classes} type={type} {...rest}>
      {children}
    </button>
  );
}

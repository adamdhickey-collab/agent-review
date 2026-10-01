import type { HTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import './Badge.css';

/* A small label with a tone. Tone is meaning: neutral says nothing,
   accent marks the thing in hand, success is a pass, warning is a change
   that needs a look, danger is a failure. A badge is never the only place
   a state is said: its text says it too. */

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Outline instead of a tinted ground, for a badge inside a tinted row. */
  variant?: 'tint' | 'outline';
  icon?: IconName;
  /** Monospace, for a value a machine wrote: a hash, a token, a count. */
  mono?: boolean;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', variant = 'tint', icon, mono, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={['badge', `badge--${tone}`, `badge--${variant}`, mono ? 'badge--mono' : '', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {icon ? <Icon name={icon} size={12} /> : null}
      {children}
    </span>
  );
}

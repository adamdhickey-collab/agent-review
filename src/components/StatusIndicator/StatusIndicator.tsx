import type { HTMLAttributes } from 'react';
import './StatusIndicator.css';

/* A dot and a word. The dot is the glance, the word is the meaning, and a
   screen reader gets the word. `live` marks something still happening
   with a pulse, which stops under prefers-reduced-motion. */

export type StatusTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface StatusIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone;
  label: string;
  /** Still changing: the dot pulses. */
  live?: boolean;
  /** Hide the word visually; it stays for assistive technology. */
  dotOnly?: boolean;
}

export function StatusIndicator({ tone, label, live, dotOnly, className, ...rest }: StatusIndicatorProps) {
  return (
    <span className={['status', `status--${tone}`, live ? 'is-live' : '', className].filter(Boolean).join(' ')} {...rest}>
      <span className="status__dot" aria-hidden="true" />
      <span className={dotOnly ? 'visually-hidden' : 'status__label'}>{label}</span>
    </span>
  );
}

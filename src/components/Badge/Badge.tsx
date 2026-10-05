import type { HTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import './Badge.css';

/* A small label with a tone. Tone is meaning: neutral says nothing,
   accent marks the thing in hand, success is a pass, warning is a change
   that needs a look, danger is a failure. A badge is never the only place
   a state is said: its text says it too.

   Two sizes. The default is a label in a row, at the extra-small type. The
   large is a badge that is the content rather than a note on it: the
   delegated work's account shows each check as one, with its count, read
   at a glance, where the default's 11px word was the smallest thing on the
   screen. It is 24px tall, the compact control's height written as a size
   rather than as that token (a coarse pointer raises the token for
   controls, and a badge is not one), with the small type and a 14px icon.
   The default is as it was.

   Three variants. Tint is the default. Outline is for a badge inside a row
   that is already tinted. Quiet keeps the meaning in the mark and drops it
   from the ground: no ground, a hairline edge, the neutral ink, and the
   icon in the tone's ink. It is for a state that asks nothing of the reader (a check that
   passed, a label that names a kind), so that on a screen of badges the
   tinted ones are the ones that need a person. Added for the delegated
   work, where seven tinted pills competed with the one decision that
   mattered; the tint and outline badges are unchanged. */

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Outline instead of a tinted ground, for a badge inside a tinted row.
      Quiet, for a state that needs nothing: a neutral badge whose icon carries the tone. */
  variant?: 'tint' | 'outline' | 'quiet';
  icon?: IconName;
  /** Monospace, for a value a machine wrote: a hash, a token, a count. */
  mono?: boolean;
  /** Large, for a badge read at a glance as content: 24px tall, with the small type. */
  size?: 'default' | 'large';
  children: ReactNode;
}

export function Badge({ tone = 'neutral', variant = 'tint', icon, mono, size = 'default', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={['badge', `badge--${tone}`, `badge--${variant}`, mono ? 'badge--mono' : '', size === 'large' ? 'badge--large' : '', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === 'large' ? 14 : 12} /> : null}
      {children}
    </span>
  );
}

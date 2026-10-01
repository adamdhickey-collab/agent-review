import type { HTMLAttributes, ReactNode } from 'react';
import './Toolbar.css';

/* A row of controls over a region. Wraps at a narrow width rather than
   overflowing, which is the whole reason it is a component: a toolbar
   written inline is a toolbar that overflows at 768. A `role="toolbar"`
   with a label, so a screen reader knows the controls belong together. */

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  /** Leading content: a count, a title. */
  start?: ReactNode;
  /** Controls, right-aligned; wrap under `start` when there is no room. */
  children?: ReactNode;
  /** A tinted ground, for a toolbar that appears in response to a selection. */
  tone?: 'plain' | 'accent';
}

export function Toolbar({ label, start, children, tone = 'plain', className, ...rest }: ToolbarProps) {
  return (
    <div role="toolbar" aria-label={label} className={['toolbar', `toolbar--${tone}`, className].filter(Boolean).join(' ')} {...rest}>
      {start ? <div className="toolbar__start">{start}</div> : null}
      {children ? <div className="toolbar__actions">{children}</div> : null}
    </div>
  );
}

/** A thin vertical rule between groups of toolbar controls. */
export function ToolbarSeparator() {
  return <span className="toolbar__separator" role="separator" aria-orientation="vertical" />;
}

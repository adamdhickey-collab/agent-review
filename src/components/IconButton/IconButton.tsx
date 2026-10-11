import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import './IconButton.css';

/* A button that is only an icon. The label is required and is the
   accessible name; it also shows as a tooltip on hover and on keyboard
   focus, so nothing here is reachable by pointer alone.

   `shortcut` is the key that does the same thing, shown after the label in
   the tooltip ("Keyboard shortcuts (?)"), which is where a person looking at
   the button learns it. It is only shown: the screen that owns the key
   listens for it, and says it to assistive technology with
   aria-keyshortcuts, which names the keys pressed (Shift+/ for a question
   mark), not the character they make.

   `tooltip="end"` lines the tooltip up with the button's end edge instead
   of centring it under the button, for a button at the end of a row near the
   window's edge. A centred tooltip there runs past the edge, and even while
   it is invisible it makes the page wider than the window: the delegated
   work's "Next decision", at the end of the inspector's head, made a 400px
   window 404px wide (Preview Studio, 2026-10-11). The default is as it was. */

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  icon: IconName;
  label: string;
  size?: 'default' | 'compact';
  /** A pressed state for a toggle, rendered as aria-pressed. */
  pressed?: boolean;
  /** The key that does the same thing, shown after the label in the tooltip. */
  shortcut?: string;
  /** Where the tooltip sits: centred under the button, or lined up with its end edge for a button at the end of a row. */
  tooltip?: 'center' | 'end';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, size = 'default', pressed, shortcut, tooltip = 'center', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={['icon-btn', `icon-btn--${size}`, tooltip === 'end' ? 'icon-btn--tip-end' : '', className].filter(Boolean).join(' ')}
      aria-label={label}
      aria-pressed={pressed}
      data-tooltip={shortcut ? `${label} (${shortcut})` : label}
      {...rest}
    >
      <Icon name={icon} size={size === 'compact' ? 14 : 16} />
    </button>
  );
});

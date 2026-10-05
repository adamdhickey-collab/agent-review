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
   mark), not the character they make. */

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  icon: IconName;
  label: string;
  size?: 'default' | 'compact';
  /** A pressed state for a toggle, rendered as aria-pressed. */
  pressed?: boolean;
  /** The key that does the same thing, shown after the label in the tooltip. */
  shortcut?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, size = 'default', pressed, shortcut, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={['icon-btn', `icon-btn--${size}`, className].filter(Boolean).join(' ')}
      aria-label={label}
      aria-pressed={pressed}
      data-tooltip={shortcut ? `${label} (${shortcut})` : label}
      {...rest}
    >
      <Icon name={icon} size={size === 'compact' ? 14 : 16} />
    </button>
  );
});

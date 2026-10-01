import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import './Button.css';

/* The one button. Four variants say what pressing it means (primary: the
   step forward; secondary: an ordinary action; danger: something that
   cannot be taken back without a second step; ghost: an action beside
   text that should not compete with it). Two sizes: default, and compact
   for a control inside a row or a toolbar.

   A loading button stays the same width, keeps its label for a screen
   reader, and cannot be pressed twice. A disabled button uses the real
   attribute, so it leaves the tab order and the browser says why. */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'default' | 'compact';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner in place of the leading icon and blocks presses. */
  loading?: boolean;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'default', loading = false, leadingIcon, trailingIcon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  const lead = loading ? 'loader' : leadingIcon;
  return (
    <button
      ref={ref}
      type={type}
      className={['btn', `btn--${variant}`, `btn--${size}`, loading ? 'is-loading' : '', className].filter(Boolean).join(' ')}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : rest.onClick}
      {...rest}
    >
      {lead ? <Icon name={lead} size={size === 'compact' ? 14 : 16} className="btn__icon" /> : null}
      <span className="btn__label">{children}</span>
      {trailingIcon ? <Icon name={trailingIcon} size={size === 'compact' ? 14 : 16} className="btn__icon" /> : null}
    </button>
  );
});

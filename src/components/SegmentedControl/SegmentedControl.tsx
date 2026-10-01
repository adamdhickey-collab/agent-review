import { useId, type KeyboardEvent } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import './SegmentedControl.css';

/* One choice among a few, all visible: before/after, a viewport width, a
   density. A radio group in behaviour: one tab stop, arrow keys move the
   choice, the chosen one is aria-checked. Options can be an icon with a
   label the tooltip and the screen reader get. */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  /** Icon only; the label becomes the accessible name and tooltip. */
  iconOnly?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'default' | 'compact';
  className?: string;
}

export function SegmentedControl<T extends string>({ label, options, value, onChange, size = 'default', className }: SegmentedControlProps<T>) {
  const id = useId();
  const index = options.findIndex((o) => o.value === value);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = options[(index + step + options.length) % options.length];
    onChange(next.value);
    (e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={['segmented', `segmented--${size}`, className].filter(Boolean).join(' ')}
      onKeyDown={onKeyDown}
    >
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={o.iconOnly ? o.label : undefined}
            data-tooltip={o.iconOnly ? o.label : undefined}
            data-value={o.value}
            id={`${id}-${o.value}`}
            tabIndex={checked ? 0 : -1}
            className="segmented__option"
            onClick={() => onChange(o.value)}
          >
            {o.icon ? <Icon name={o.icon} size={size === 'compact' ? 14 : 16} /> : null}
            {o.iconOnly ? null : <span>{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

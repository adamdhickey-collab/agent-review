import { useId, type KeyboardEvent, type ReactNode } from 'react';
import './Tabs.css';

/* Tabs over one region. The WAI pattern: a tablist with one tab stop,
   arrow keys to move, the panel labelled by its tab. A tab can carry a
   count, which is where "Findings 5" lives. */

export interface Tab<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface TabsProps<T extends string> {
  label: string;
  tabs: readonly Tab<T>[];
  value: T;
  onChange: (value: T) => void;
  /** The content of the selected panel. */
  children: ReactNode;
  className?: string;
}

export function Tabs<T extends string>({ label, tabs, value, onChange, children, className }: TabsProps<T>) {
  const id = useId();
  const index = tabs.findIndex((t) => t.value === value);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length];
    onChange(next.value);
    (e.currentTarget.querySelector(`#${CSS.escape(`${id}-tab-${next.value}`)}`) as HTMLElement | null)?.focus();
  }

  return (
    <div className={['tabs', className].filter(Boolean).join(' ')}>
      <div role="tablist" aria-label={label} className="tabs__list" onKeyDown={onKeyDown}>
        {tabs.map((t) => {
          const selected = t.value === value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              id={`${id}-tab-${t.value}`}
              aria-selected={selected}
              aria-controls={`${id}-panel-${t.value}`}
              tabIndex={selected ? 0 : -1}
              className="tabs__tab"
              onClick={() => onChange(t.value)}
            >
              <span>{t.label}</span>
              {t.count !== undefined ? <span className="tabs__count">{t.count}</span> : null}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${id}-panel-${value}`} aria-labelledby={`${id}-tab-${value}`} className="tabs__panel" tabIndex={0}>
        {children}
      </div>
    </div>
  );
}

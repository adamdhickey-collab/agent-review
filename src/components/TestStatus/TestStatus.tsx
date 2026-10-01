import type { HTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import './TestStatus.css';

/* The result of a check, as an icon with a name and a word. Four states
   that mean four different things to a reviewer: passed needs nothing,
   changed needs a look, failed blocks, running is not yet an answer. A
   fifth, skipped, is for a check that did not run and says so rather
   than passing. */

export type TestState = 'passed' | 'changed' | 'failed' | 'running' | 'skipped';

const PRESENTATION: Record<TestState, { icon: IconName; word: string; tone: string }> = {
  passed: { icon: 'circle-check', word: 'Passed', tone: 'success' },
  changed: { icon: 'circle-dot', word: 'Changed', tone: 'warning' },
  failed: { icon: 'circle-x', word: 'Failed', tone: 'danger' },
  running: { icon: 'loader', word: 'Running', tone: 'neutral' },
  skipped: { icon: 'circle', word: 'Skipped', tone: 'neutral' },
};

export interface TestStatusProps extends HTMLAttributes<HTMLSpanElement> {
  state: TestState;
  /** What to say instead of the state's own word: "3 changes", "1 regression". */
  label?: string;
  /** The word only visually hidden: an icon in a tight column. */
  iconOnly?: boolean;
}

export function TestStatus({ state, label, iconOnly, className, ...rest }: TestStatusProps) {
  const p = PRESENTATION[state];
  const text = label ?? p.word;
  return (
    <span
      className={['test-status', `test-status--${p.tone}`, className].filter(Boolean).join(' ')}
      data-state={state}
      {...rest}
    >
      <Icon name={p.icon} size={14} label={iconOnly ? text : undefined} />
      {iconOnly ? null : <span>{text}</span>}
    </span>
  );
}

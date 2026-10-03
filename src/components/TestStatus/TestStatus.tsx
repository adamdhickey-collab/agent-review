import type { HTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import './TestStatus.css';

/* The result of a check, as an icon with a name and a word. Four states
   that mean four different things to a reviewer: passed needs nothing,
   changed needs a look, failed blocks, running is not yet an answer. A
   fifth, skipped, is for a check that did not run and says so rather
   than passing.

   Each state has its own shape, so the five differ by silhouette as well
   as by colour: a disc passed, a triangle wants a look, an octagon stops,
   an open arc is still running, an empty dashed ring did not run. The
   three that are answers are solid, drawn on a 16 grid for the 16px they
   are shown at (Icon.tsx has the drawing and the reason); the two that
   are not answers are rings.

   They were the line set's circle-check, alert and circle-x at 14px, and
   a queue row is five of these with no word beside them. There the stroke
   was 1px, the tick 3.5px across, and passed and failed were the same thin
   ring in two colours. Changed had already left that family for the
   caution triangle, which is what a reader takes to mean "look at this";
   this finishes the move for the other four.

   Running takes the accent rather than the grey it had: it is the one
   state that is happening now, and grey is what skipped already is. */

export type TestState = 'passed' | 'changed' | 'failed' | 'running' | 'skipped';

const PRESENTATION: Record<TestState, { icon: IconName; word: string; tone: string }> = {
  passed: { icon: 'status-passed', word: 'Passed', tone: 'success' },
  changed: { icon: 'status-changed', word: 'Changed', tone: 'warning' },
  failed: { icon: 'status-failed', word: 'Failed', tone: 'danger' },
  running: { icon: 'status-running', word: 'Running', tone: 'accent' },
  skipped: { icon: 'status-skipped', word: 'Skipped', tone: 'neutral' },
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
      <Icon name={p.icon} size={16} label={iconOnly ? text : undefined} />
      {iconOnly ? null : <span>{text}</span>}
    </span>
  );
}

import { createContext, useCallback, useContext, useMemo, useReducer, useState, type ReactNode } from 'react';
import { queue as initialQueue } from '../data/scenario';
import type { Change, Decision } from '../data/types';
import { initialDelegation } from '../data/billing';
import { initialTableRun } from '../data/table';
import { reduce, type Action, type DelegationState, type RunId } from '../data/delegation';

/* The review's state: the queue, and the decisions made in this session.
   In memory, on purpose. A real Agent Review would write a decision to
   the pull request; this one keeps it until the page reloads, and the
   shape of what it keeps is what the write would carry.

   Every decision is undoable for a moment (the Undo in the banner), which
   is rule 6 in skills/ui-quality/SKILL.md applied to the product itself.

   The delegated work is a second piece of state, moved only by `reduce`
   in data/delegation.ts, so the screen and the stories drive the same
   machine. It starts from the billing run each time the page loads, and
   Reset puts it back there without a reload.

   There are two delegated runs, the billing run and the shared table, each
   its own state, so switching between them keeps where a person got to in
   each; Reset puts back the one on screen. */

const STARTS: Record<RunId, () => DelegationState> = {
  billing: initialDelegation,
  'shared-table': initialTableRun,
};

type Runs = Record<RunId, DelegationState>;

function runsReducer(runs: Runs, { run, action }: { run: RunId; action: Action }): Runs {
  const next = reduce(runs[run], action);
  return next === runs[run] ? runs : { ...runs, [run]: next };
}

interface Store {
  changes: Change[];
  find(id: string): Change | undefined;
  decide(id: string, decision: Decision): void;
  undo(id: string): void;
  /** The last decision made, for the banner. */
  last?: { id: string; previous: Change; decision: Decision };
  /** The delegated runs, each moved only by `reduce`. */
  runs: Runs;
  delegate(run: RunId, action: Action): void;
  /** Back to the start of the run. */
  resetDelegation(run: RunId): void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({
  children,
  delegation: start,
}: {
  children: ReactNode;
  /** Where a delegated run starts, for a story: the run its brief names; each run from its own start by default. */
  delegation?: DelegationState;
}) {
  const [changes, setChanges] = useState<Change[]>(initialQueue);
  const [last, setLast] = useState<Store['last']>();
  const startOf = useCallback((run: RunId) => (start && start.brief.id === run ? start : STARTS[run]()), [start]);
  const [runs, dispatch] = useReducer(runsReducer, undefined, () => ({ billing: startOf('billing'), 'shared-table': startOf('shared-table') }));
  const delegate = useCallback((run: RunId, action: Action) => dispatch({ run, action }), []);
  const resetDelegation = useCallback((run: RunId) => dispatch({ run, action: { type: 'reset', to: startOf(run) } }), [startOf]);

  const decide = useCallback((id: string, decision: Decision) => {
    setChanges((cs) => {
      const previous = cs.find((c) => c.id === id);
      if (!previous) return cs;
      setLast({ id, previous, decision });
      const state = decision.action === 'accept' ? 'accepted' : decision.action === 'reject' ? 'rejected' : 'returned';
      return cs.map((c) => (c.id === id ? { ...c, state, decision } : c));
    });
  }, []);

  const undo = useCallback(
    (id: string) => {
      setChanges((cs) => cs.map((c) => (c.id === id && last?.id === id ? last.previous : c)));
      setLast(undefined);
    },
    [last],
  );

  const value = useMemo<Store>(
    () => ({ changes, find: (id) => changes.find((c) => c.id === id), decide, undo, last, runs, delegate, resetDelegation }),
    [changes, decide, undo, last, runs, delegate, resetDelegation],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

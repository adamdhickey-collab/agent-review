import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { queue as initialQueue } from '../data/scenario';
import type { Change, Decision } from '../data/types';

/* The review's state: the queue, and the decisions made in this session.
   In memory, on purpose. A real Agent Review would write a decision to
   the pull request; this one keeps it until the page reloads, and the
   shape of what it keeps is what the write would carry.

   Every decision is undoable for a moment (the Undo in the banner), which
   is rule 6 in skills/ui-quality/SKILL.md applied to the product itself. */

interface Store {
  changes: Change[];
  find(id: string): Change | undefined;
  decide(id: string, decision: Decision): void;
  undo(id: string): void;
  /** The last decision made, for the banner. */
  last?: { id: string; previous: Change; decision: Decision };
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [changes, setChanges] = useState<Change[]>(initialQueue);
  const [last, setLast] = useState<Store['last']>();

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
    () => ({ changes, find: (id) => changes.find((c) => c.id === id), decide, undo, last }),
    [changes, decide, undo, last],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

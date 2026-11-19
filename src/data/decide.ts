import { EVIDENCE, initialCycle, NO_FEATURES, outcomeOf, reduceCycle, STORY_BATCH, STORY_ROWS, type CycleAction, type CycleState, type StopWhen } from './cycle';

/* THE SHORT PATH (2026-11-18). The prototype's front door since this date:
   one question, "When should Archive stop and ask?", in three beats, where
   the design cycle (cycle.ts) takes six stages to reach it. A reader who
   played all six remembered one decision, the one the case study is about:
   the agent's review, kept, stopping only when a batch holds an active
   customer. So the short path starts there. The cycle stays, one press
   away, for whoever wants the brief, the agent's question about a shared
   component, and the decision record.

   It reads the cycle's data rather than keeping its own: the same ticket,
   the same engineering note, the same rows, the same review, and the same
   rule, which `outcomeOf` already writes from when the review stops. The
   batches are the case study's: a routine cleanup of a trial and a churned
   customer, then Northside Trucking added to it. */

export type BatchId = 'routine' | 'northside';

export const SHORT_BATCHES: Record<BatchId, { name: string; ids: string[]; says: string }> = {
  routine: {
    name: 'Routine cleanup',
    ids: STORY_BATCH.filter((id) => id !== 'c_01HZKJ'),
    says: 'Alder & Finch, on a trial, and Juniper Foods, churned. Nobody active.',
  },
  northside: {
    name: 'Add Northside',
    ids: STORY_BATCH,
    says: 'The same two, and Northside Trucking: active, $5,040 a month.',
  },
};

/** The five rows the case study shows: the batch, then two active customers left alone. */
export const SHORT_ROWS = STORY_ROWS;

export const TICKET = EVIDENCE.find((e) => e.id === 'ticket-okafor')!;
export const NOTE = EVIDENCE.find((e) => e.id === 'note-retention')!;

/* The choices the short path leaves the cycle's earlier stages at, so the
   whole cycle can open on the brief with the visitor's decision in it: the
   summary corrected, safety first, all three directions tried, the agent's
   review chosen, stopping when the visitor said, and the brief sent. */
export function cycleActionsFor(stops: StopWhen): CycleAction[] {
  return [
    { type: 'reset' },
    { type: 'open', evidence: NOTE.id },
    { type: 'read', call: 'correct' },
    { type: 'prioritize', priority: 'recovery' },
    { type: 'try', direction: 'undo', event: 'archived' },
    { type: 'try', direction: 'confirm', event: 'archived' },
    { type: 'try', direction: 'review', event: 'archived' },
    { type: 'choose', direction: 'review' },
    { type: 'stop', when: stops },
    { type: 'delegate' },
  ];
}

export function cycleStateFor(stops: StopWhen): CycleState {
  return cycleActionsFor(stops).reduce(reduceCycle, initialCycle());
}

/** The rule the next agent reads, as the visitor's answer writes it. */
export function ruleFor(stops: StopWhen): string {
  return outcomeOf({ ...cycleStateFor(stops), required: { ...NO_FEATURES, 'only-active': stops === 'active' } })!.guidance;
}

/* Kept for the visit, like the cycle: a reload or a trip to the cycle and
   back finds the answer where it was left. */
const KEY = 'agent-review:decide';

export function loadStops(): StopWhen | null {
  try {
    const v = sessionStorage.getItem(KEY);
    return v === 'every' || v === 'active' ? v : null;
  } catch {
    return null;
  }
}

export function saveStops(stops: StopWhen | null) {
  try {
    if (stops) sessionStorage.setItem(KEY, stops);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* it lasts until the next load */
  }
}

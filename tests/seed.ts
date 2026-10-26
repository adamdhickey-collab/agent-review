import type { Page } from '@playwright/test';

/* The design cycle opens a stage once every stage before it is decided
   (since 2026-10-26), so a test of a later stage starts from the choices
   that open it. The store reads the cycle from sessionStorage and fills in
   whatever is missing from a fresh one, so a seed names only what was
   decided. It is written once per tab: the page's own saving takes over
   after that, so a choice made in the test survives a reload, and Start
   over still starts over. */

const KEY = 'agent-review:cycle';

/** Discover and Define decided: the summary corrected, recovery first. */
export const FRAMED = { reading: 'correct', priority: 'recovery' };

/** And each direction in Explore tried, so Evaluate is open. */
export const EXPLORED = { ...FRAMED, trials: { undo: ['archived'], confirm: ['archived'], review: ['archived'] } };

export async function seedCycle(page: Page, state: object) {
  await page.addInitScript(
    ([key, s]) => {
      if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify(s));
    },
    [KEY, state] as const,
  );
}

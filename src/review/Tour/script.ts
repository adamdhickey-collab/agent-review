import type { StopWhen } from '../../data/cycle';

/* THE TOUR'S SCRIPT (2026-11-18, rebuilt the same day). The guided tour
   plays the short path (review/DecideScreen), the prototype's front door:
   one question, when should Archive stop and ask, in its three beats. It
   played the design cycle's six stages until the short path replaced them
   as the way in; a reader who watched those remembered one decision, and
   the decision came twelve beats in. Here it comes sixth.

   A beat is what the bar says, which real controls are pressed, and the
   visitor's answer once the beat is done (`stops`). The tour starts a beat
   from anywhere by setting the answer as the beats before it left it and
   drawing the short path fresh, so every beat's presses begin from the
   page as it first appears, with the routine cleanup selected. Everything a
   beat needs past that, it presses itself: choosing Add Northside, opening
   the review, clearing a box.

   A beat marked `decision` is the moment the designer decides and the
   agent doesn't. The bar labels it and gives a line of reasoning, and the
   page dims around the choice. There is one, on purpose.

   The words are for someone who has never seen the prototype, and they say
   what is simulated in the second beat and again where the research is
   quoted, because a tour that plays by itself reads as a recording of
   something that happened. */

export type Find = () => HTMLElement | null;

export type Step =
  /** Ring something and give it a moment. */
  | { show: Find }
  /** Move to a control and press it. `frame` is what the ring goes round, when that is more than the control. */
  | { press: Find; frame?: Find };

/** The short path's three beats, which are the tour's chapters. */
export const CHAPTERS = ['What went wrong', 'Decide when to pause', 'What the agent takes forward'] as const;

export interface Beat {
  chapter: 0 | 1 | 2;
  caption: string;
  /** The reasoning, shown under the caption on a decision. */
  why?: string;
  decision?: boolean;
  steps: Step[];
  /** The visitor's answer once this beat is done, when the beat answers it. */
  stops?: StopWhen;
}

/* ---------- finding the short path's controls ---------- */

const q = (selector: string, within: ParentNode = document): HTMLElement | null => within.querySelector<HTMLElement>(selector);

/** A beat of the page, by its heading's id. */
const beat = (id: 'decide-wrong' | 'decide-pause' | 'decide-forward'): HTMLElement | null => q(`[aria-labelledby="${id}"]`);
const plan = () => beat('decide-pause');
const forward = () => beat('decide-forward');

function button(scope: HTMLElement | null, label: string | RegExp): HTMLElement | null {
  if (!scope) return null;
  for (const el of scope.querySelectorAll<HTMLElement>('button, [role="radio"]')) {
    const text = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim();
    if (typeof label === 'string' ? text === label : label.test(text)) return el;
  }
  return null;
}

/** Relay's frame in a beat: what the ring goes round while Relay is being used. */
const frame = (scope: () => HTMLElement | null): Find => () => q('.cycle__product-frame', scope() ?? document);
/** A box in the open review, by the customer's name: its label, which is what a person presses. */
const keep = (scope: () => HTMLElement | null, company: string): Find => () => {
  for (const el of (scope() ?? document).querySelectorAll<HTMLElement>('.archive-flow__review .checkbox')) {
    if ((el.textContent ?? '').startsWith(company)) return el;
  }
  return null;
};
const choice = (name: string): Find => () => {
  for (const el of (plan() ?? document).querySelectorAll<HTMLElement>('.cycle__choice')) {
    if ((el.textContent ?? '').trim().startsWith(name)) return el;
  }
  return null;
};

/* ---------- the beats ---------- */

export const BEATS: readonly Beat[] = [
  {
    chapter: 0,
    caption: 'An agent built bulk archiving for Relay, a customer tool. A designer decides one thing: when it should stop and ask.',
    steps: [{ show: () => q('.decide .cycle__intro') }],
  },
  {
    chapter: 0,
    caption: 'It’s a simulation. The ticket and the research are written for it. The archive screen is a working interface.',
    steps: [{ show: () => q('.decide__head') }],
  },
  {
    chapter: 0,
    caption: 'An account manager archived Northside Trucking by mistake, along with two old accounts. Engineering says it was never lost. Nothing on screen named it first.',
    steps: [{ show: () => q('.decide__wrong') }],
  },
  {
    chapter: 1,
    caption: 'The agent’s plan reviews every batch. On a routine cleanup, the review has nobody to name.',
    steps: [{ press: () => button(plan(), 'Archive'), frame: frame(plan) }, { show: () => q('.archive-flow__review', plan() ?? document) }],
  },
  {
    chapter: 1,
    caption: 'Add Northside, and the review names it. Clear its box, and the other two are archived.',
    steps: [
      { press: () => button(plan(), 'Add Northside') },
      { press: () => button(plan(), 'Archive'), frame: frame(plan) },
      { press: keep(plan, 'Northside Trucking'), frame: () => q('.archive-flow__review', plan() ?? document) },
      { press: () => button(plan(), 'Archive 2 customers'), frame: frame(plan) },
    ],
  },
  {
    chapter: 1,
    decision: true,
    caption: 'The designer decides: review only when someone’s active.',
    why: 'In the simulated sessions, a review on every batch doubled a routine cleanup, and people stopped reading it. A review that’s rare gets read.',
    steps: [{ press: () => q('.cycle__choice-pick', choice('Only when someone’s active')() ?? document), frame: choice('Only when someone’s active') }],
    stops: 'active',
  },
  {
    chapter: 2,
    caption: 'The decision becomes a rule the next agent reads before it builds a bulk action.',
    steps: [{ show: () => q('.decide__rule') }],
  },
  {
    chapter: 2,
    caption: 'Built with that rule, a routine cleanup goes through in one press, with Undo.',
    steps: [{ press: () => button(forward(), 'Archive'), frame: frame(forward) }, { show: () => q('.archive-flow__result', forward() ?? document)?.closest<HTMLElement>('[role="toolbar"]') ?? null }],
  },
  {
    chapter: 2,
    caption: 'With Northside in the batch, it still stops, and names it.',
    steps: [{ press: () => button(forward(), 'Add Northside') }, { press: () => button(forward(), 'Archive'), frame: frame(forward) }, { show: () => q('.archive-flow__review', forward() ?? document) }],
  },
  {
    chapter: 2,
    caption: 'One question is still open. Would people notice Northside when the review appears? Nothing here was tested with people.',
    steps: [{ show: () => q('.decide__open') }],
  },
];

/** What the bar says once the last beat is done. */
export const CLOSING = {
  caption: 'One decision, made by a person, became guidance the next agent can reuse.',
  why: 'Everything the tour did is still on the page. Try another batch, or see the whole cycle behind it.',
} as const;

/** The visitor's answer before a beat: whatever the beats before it left it. */
export function stopsBefore(index: number): StopWhen | null {
  let stops: StopWhen | null = null;
  for (const b of BEATS.slice(0, index)) if (b.stops) stops = b.stops;
  return stops;
}

/** The first beat of a chapter, for the bar's chapters. */
export function firstBeatOf(chapter: number): number {
  return BEATS.findIndex((b) => b.chapter === chapter);
}

/* How long a beat holds, in milliseconds: time to find the place on the
   screen, and time to read the words at an unhurried pace. A narrated beat
   also waits for its words to be said (narrate.ts), which is longer. */
export function holdOf(beat: Pick<Beat, 'caption' | 'why'>): number {
  const words = `${beat.caption} ${beat.why ?? ''}`.trim().split(/\s+/).length;
  return 1200 + words * 260;
}

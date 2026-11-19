import { DIRECTIONS, PRIORITY, REQUIREMENT, STOP_WHEN, initialCycle, reduceCycle, stopOf, type CycleAction, type CycleState, type StageId } from '../../data/cycle';

/* THE TOUR'S SCRIPT (2026-11-18). The guided tour plays the design cycle by
   pressing the cycle's own controls, so this file is a list of beats, and a
   beat is three things: what the bar says, which real controls are pressed,
   and what those presses do to the cycle's state.

   The third is written twice on purpose. `steps` finds a control in the
   page and presses it, which is what a viewer watches. `does` is the same
   presses as the reducer's actions, which is how the tour starts a beat
   from anywhere: reset, play every earlier beat's `does`, and the page is
   where the presses would have left it. tests/tour.spec.ts plays the whole
   tour by its presses and holds the result to the same state the actions
   give, so the two cannot drift apart unnoticed.

   A beat marked `decision` is one of the moments a person decides and the
   agent doesn't. The bar gives those a label, the stage's kind of work
   (Orchestration or Judgment, since 2026-11-19), and a line of reasoning, and
   the page dims around the choice; the beats between them only narrate.

   The words are for someone who has never seen the prototype. They say
   what is simulated in the second beat and again where the simulated
   research is quoted, because a tour that plays by itself reads as a
   recording of something that happened. */

export type Find = () => HTMLElement | null;

export type Step =
  /** Ring something and give it a moment. */
  | { show: Find }
  /** Move to a control and press it. `frame` is what the ring goes round, when that is more than the control. */
  | { press: Find; frame?: Find }
  /** Press a control for as long as the page keeps offering it: Relay's own next press, however many a direction takes. */
  | { pressWhile: Find; frame?: Find };

export interface Beat {
  stage: StageId;
  caption: string;
  /** The reasoning, shown under the caption on a decision. */
  why?: string;
  decision?: boolean;
  steps: Step[];
  /** What the presses do, as the reducer's actions. */
  does: CycleAction[];
}

/* ---------- finding the cycle's controls ---------- */

const q = (selector: string): HTMLElement | null => document.querySelector<HTMLElement>(selector);

function starting(selector: string, text: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    if ((el.textContent ?? '').trim().startsWith(text)) return el;
  }
  return null;
}

/** A choice in the move, by its name: the card, and the button that picks it. */
const choice = (name: string): Find => () => starting('.cycle__move .cycle__choice', name);
const pick = (name: string): Find => () => choice(name)()?.querySelector<HTMLElement>('.cycle__choice-pick') ?? null;

/** Relay's own next press, in the working screen. */
const relayNext: Find = () => q('.cycle__product-frame [data-next]:not([disabled])');
const relay: Find = () => q('.cycle__product-frame');
const tab = (n: number): Find => () => starting('.cycle__tabs [role="tab"]', `${n}.`);

/** A finding's "Require" box: the label to point at. Pressing it presses the input inside. */
const requireBox = (requirement: string): Find => () => {
  for (const el of document.querySelectorAll<HTMLElement>('.cycle__finding .checkbox')) {
    if ((el.textContent ?? '').includes(requirement)) return el;
  }
  return null;
};

const name = (id: 'undo' | 'confirm' | 'review') => DIRECTIONS.find((d) => d.id === id)!.name;
const BUILD_ANSWER = stopOf('review').answers.find((a) => a.recommended)!;

/* ---------- the beats ---------- */

export const BEATS: readonly Beat[] = [
  {
    stage: 'discover',
    caption: 'Orchestration is setting an agent up: the evidence, the brief, and the rules it works from. Judgment is the call no rule can make. Watch a designer do both.',
    steps: [{ show: () => q('.cycle__roles') }],
    does: [],
  },
  {
    stage: 'discover',
    caption: 'It’s a scripted demo. The tickets, the research notes, and the agent’s build are simulated. The archive screens you’ll see are real, working interfaces.',
    steps: [{ show: () => q('.cycle__scenario') }],
    does: [],
  },
  {
    stage: 'discover',
    caption: 'The agent read the support tickets and wrote a summary. One line says archiving deletes customer data.',
    steps: [{ show: () => q('.cycle__reading[data-disputed]') }],
    does: [],
  },
  {
    stage: 'discover',
    caption: 'The engineering note disagrees. Relay keeps archived customers for 90 days.',
    steps: [{ press: () => q('.cycle__move .cycle__move-lead .btn') }, { show: () => q('#ev-note-retention') }],
    does: [{ type: 'open', evidence: 'note-retention' }],
  },
  {
    stage: 'discover',
    decision: true,
    caption: 'The designer corrects the summary.',
    why: 'Orchestration starts with what the agent believes. A person checks the claim before anyone plans around it.',
    steps: [{ press: pick('Correct the summary'), frame: choice('Correct the summary') }, { show: () => q('.cycle__reading[data-corrected]') }],
    does: [{ type: 'read', call: 'correct' }],
  },
  {
    stage: 'define',
    caption: 'The agent drafts the brief. Two people want opposite things: fewer presses, and a warning before an active customer is archived.',
    steps: [{ show: () => q('.cycle__brief') }],
    does: [],
  },
  {
    stage: 'define',
    decision: true,
    caption: 'The designer puts safety first.',
    why: 'The brief is orchestration too. This one priority steers every choice the agent makes after it.',
    steps: [{ press: pick(PRIORITY.recovery.name), frame: choice(PRIORITY.recovery.name) }, { show: () => q('.cycle__brief .cycle__added')?.closest<HTMLElement>('ul') ?? null }],
    does: [{ type: 'prioritize', priority: 'recovery' }],
  },
  {
    stage: 'explore',
    caption: 'The agent built three working ways to archive. The first archives all three customers at once, with no warning.',
    steps: [{ pressWhile: relayNext, frame: relay }, { show: () => q('.cycle__product-frame .archive-flow__result') ?? relay() }],
    does: [{ type: 'try', direction: 'undo', event: 'archived' }],
  },
  {
    stage: 'explore',
    caption: 'The second asks first, and names Northside Trucking, the one active customer.',
    steps: [{ press: tab(2) }, { pressWhile: relayNext, frame: relay }],
    does: [
      { type: 'explore', direction: 'confirm' },
      { type: 'try', direction: 'confirm', event: 'archived' },
    ],
  },
  {
    stage: 'explore',
    caption: 'The third opens a review, with a box to keep Northside Trucking. It takes the most steps.',
    steps: [{ press: tab(3) }, { pressWhile: relayNext, frame: relay }],
    does: [
      { type: 'explore', direction: 'review' },
      { type: 'try', direction: 'review', event: 'archived' },
    ],
  },
  {
    stage: 'explore',
    decision: true,
    caption: 'Now judgment. The designer compares the three by using them.',
    why: 'Each direction is a working screen, so its weak spot shows up in use, not in a spec.',
    steps: [{ show: () => q('.cycle__tries') }],
    does: [],
  },
  {
    stage: 'evaluate',
    caption: 'The agent recommends the review, because safety comes first. The designer agrees on the direction.',
    steps: [{ press: pick(name('review')), frame: choice(name('review')) }],
    does: [{ type: 'choose', direction: 'review' }],
  },
  {
    stage: 'evaluate',
    decision: true,
    caption: 'The designer decides when the review is needed: only when someone’s active.',
    why: 'No check can make this call. The agent would stop on every batch, and the simulated session notes say people stopped reading.',
    steps: [{ press: pick(STOP_WHEN.active.name), frame: choice(STOP_WHEN.active.name) }],
    does: [{ type: 'stop', when: 'active' }],
  },
  {
    stage: 'evaluate',
    caption: 'Two findings become requirements: a way to restore a customer, and a record of who archived each one.',
    steps: [{ press: requireBox(REQUIREMENT.restore) }, { press: requireBox(REQUIREMENT.who) }],
    does: [
      { type: 'require', feature: 'restore', on: true },
      { type: 'require', feature: 'who', on: true },
    ],
  },
  {
    stage: 'delegate',
    decision: true,
    caption: 'The designer sets the agent’s boundaries, then sends the brief.',
    why: 'Back to orchestration. The brief says what the agent does alone, what needs a person’s judgment, and what needs approval.',
    steps: [{ show: () => q('.cycle__bounds') }, { press: () => starting('.cycle__move .btn', 'Send the brief') }],
    does: [{ type: 'delegate' }],
  },
  {
    stage: 'delegate',
    caption: 'The agent builds, then stops once to ask. A new shared component needs approval, so it builds from existing parts.',
    steps: [{ press: pick(BUILD_ANSWER.name), frame: choice(BUILD_ANSWER.name) }],
    does: [{ type: 'answer', answer: BUILD_ANSWER.id }],
  },
  {
    stage: 'learn',
    caption: 'The checks pass. No check can say whether people notice what changed, and nothing here was tested with real people.',
    steps: [{ show: () => q('.cycle__main .cycle__checks') }],
    does: [],
  },
  {
    stage: 'learn',
    decision: true,
    caption: 'The designer saves the decision as a rule.',
    why: 'Today’s judgment becomes the next agent’s orchestration: it reads this rule before it builds a bulk action.',
    steps: [{ show: () => q('.cycle__rule') }, { press: () => q('.cycle__move .checkbox') }],
    does: [{ type: 'keep', on: true }],
  },
];

/** What the bar says once the last beat is done. */
export const CLOSING = {
  caption: 'Orchestration set the agent up. Judgment decided what ships. Now it’s your turn.',
  why: 'Every choice the tour made is still here. Change one and see what the later stages do with it.',
} as const;

/** The cycle's state before a beat: every earlier beat's actions, from a fresh cycle. */
export function stateBefore(index: number): CycleState {
  return actionsBefore(index).reduce(reduceCycle, initialCycle());
}

export function actionsBefore(index: number): CycleAction[] {
  return BEATS.slice(0, index).flatMap((b) => b.does);
}

/** The first beat of a stage, for the bar's chapters. */
export function firstBeatOf(stage: StageId): number {
  return BEATS.findIndex((b) => b.stage === stage);
}

/* How long a beat holds, in milliseconds: time to find the place on the
   screen, and time to read the words at an unhurried pace. The whole tour
   comes to about two minutes and a quarter, presses included. */
export function holdOf(beat: Pick<Beat, 'caption' | 'why'>): number {
  const words = `${beat.caption} ${beat.why ?? ''}`.trim().split(/\s+/).length;
  return 1200 + words * 260;
}

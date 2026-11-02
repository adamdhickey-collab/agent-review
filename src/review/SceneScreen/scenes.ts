import { initialCycle, type CycleState } from '../../data/cycle';

/* A scene for each stage of the design cycle, and two for the case study
   to open on: "batch", Relay's customers with the batch selected, and
   "three", the three directions side by side, which is the homepage card. */
export type SceneId = 'batch' | 'discover' | 'define' | 'explore' | 'three' | 'evaluate' | 'delegate' | 'learn';

export const SCENES: readonly SceneId[] = ['batch', 'discover', 'define', 'explore', 'three', 'evaluate', 'delegate', 'learn'];

export function isScene(id: string): id is SceneId {
  return (SCENES as readonly string[]).includes(id);
}

/** The case study's run through the cycle: the summary corrected, recovery
    first, all three tried, the agent's review kept with a condition (it
    stops only for a batch with an active customer; until 2026-11-02 this
    was undo, chosen against the recommendation), the agent's stop
    answered, the rule kept. Every scene reads its words from this,
    through the cycle's own functions. */
export const STORY: CycleState = {
  ...initialCycle(),
  reading: 'correct',
  priority: 'recovery',
  trials: { undo: ['archived'], confirm: ['archived'], review: ['archived'] },
  direction: 'review',
  required: { ...initialCycle().required, 'only-active': true },
  delegated: true,
  answer: 'inline',
  kept: true,
};

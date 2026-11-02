/* THE DESIGN CYCLE (2026-10-25): one feature followed from a support ticket
   to what ships and what to measure, so the designer's work is visible
   before and after the moments an agent stops for him.

   The two delegated runs (billing.ts, table.ts) show where an agent should
   stop. They made the designer look like someone who comes by to approve
   things. This scenario asks the bigger question: if an agent can build the
   interface, what does the designer spend the day doing? It answers with
   one feature on Relay's customer table, archiving customers without losing
   control of them, in six stages, and a person makes a choice in each one
   that the later stages read.

   Everything here is simulated, and the screen says so once per stage: the
   tickets, the product signals, the session notes and the agent's build
   are written to agree with each other and are played back through one pure
   reducer, so the same presses end in the same place. Nothing in it was
   researched or measured. What is real is the product: the three directions
   in Explore are working interfaces built from the system's components
   (product/customers/ArchiveFlow.tsx), and their stories run through axe
   like every other.

   The causal chain, each link read by a function below:
     Discover  the agent's summary says archiving loses data; the engineering
               note says it doesn't. Correct the summary or keep it (readingOf).
     Define    which wins when pace and safety pull apart (priority). Sets
               the success criteria and what the agent recommends later.
     Explore   three working directions. What the person tried is kept.
     Evaluate  a direction, a reason, and the findings made requirements.
     Delegate  the brief is written from all of the above (briefOf); the
               agent builds, checks, and stops once, a different stop for
               each direction (stopOf); the answer changes what is built.
     Learn     what was built, what was verified, what is unknown, and what
               to measure, each read from the choices (outcomeOf). */

export type StageId = 'discover' | 'define' | 'explore' | 'evaluate' | 'delegate' | 'learn';

export interface Stage {
  id: StageId;
  /** The stage's name, one word, as the rail shows it. */
  name: string;
  /** The question the stage's screen opens on. */
  question: string;
  /** What the designer does here, in a line. */
  designer: string;
  /** What the agent does here, in a line. */
  agent: string;
}

export const STAGES: readonly Stage[] = [
  {
    id: 'discover',
    name: 'Discover',
    question: 'Something is wrong with archiving. What, exactly?',
    designer: 'Checks the agent’s summary against the evidence.',
    agent: 'Collects the tickets, usage data, and engineering note, and writes a summary.',
  },
  {
    id: 'define',
    name: 'Define',
    question: 'What problem are we solving?',
    designer: 'Writes down the problem and picks the priority every later choice follows.',
    agent: 'Drafts the brief from the summary.',
  },
  {
    id: 'explore',
    name: 'Explore',
    question: 'Three ways to archive. Try each one.',
    designer: 'Uses each direction as a person would, and looks for where it breaks.',
    agent: 'Built all three as working screens from the design system.',
  },
  {
    id: 'evaluate',
    name: 'Evaluate',
    question: 'Which direction, and what must it do?',
    designer: 'Weighs the findings, chooses a direction, and turns findings into requirements.',
    agent: 'Ran the checks and compared the findings with the brief.',
  },
  {
    id: 'delegate',
    name: 'Delegate',
    question: 'What does the agent need from you while it builds?',
    designer: 'Sets the boundaries and answers the one question the agent can’t.',
    agent: 'Builds inside the boundaries, runs the checks, and asks before crossing one.',
  },
  {
    id: 'learn',
    name: 'Learn',
    question: 'The feature is built. What do you know, and what don’t you?',
    designer: 'Decides what to measure, what to research, and which rule to save.',
    agent: 'Lists what was verified and what wasn’t.',
  },
];

export function stageOf(id: StageId): Stage {
  return STAGES.find((s) => s.id === id) ?? STAGES[0];
}

export function stageIndex(id: StageId): number {
  return STAGES.findIndex((s) => s.id === id);
}

export function isStage(s: string): s is StageId {
  return STAGES.some((st) => st.id === s);
}

/* ---------- DISCOVER: the evidence, and the agent's readings of it ---------- */

export type EvidenceKind = 'ticket' | 'signal' | 'note' | 'request';

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  /** Who it came from, by role: nobody here is a real person. */
  from: string;
  /** The words, as they arrived. */
  says: string;
}

export const EVIDENCE_KIND: Record<EvidenceKind, string> = {
  ticket: 'Support ticket',
  signal: 'Product signal',
  note: 'Engineering note',
  request: 'Request',
};

export const EVIDENCE: readonly Evidence[] = [
  {
    id: 'ticket-okafor',
    kind: 'ticket',
    from: 'Account manager',
    says: 'I archived Birch Logistics by accident while clearing out old trials. It’s one of our biggest accounts. How do I get it back?',
  },
  {
    id: 'ticket-quarterly',
    kind: 'ticket',
    from: 'Operations lead',
    says: 'Every quarter I archive a couple of hundred churned accounts, a page at a time. Please don’t make it slower.',
  },
  {
    id: 'request-audit',
    kind: 'request',
    from: 'Administrator',
    says: 'Our auditor asked who archived Pinecrest Credit Union, and when. I couldn’t answer.',
  },
  {
    id: 'signal-tickets',
    kind: 'signal',
    from: 'Support, last quarter',
    says: '9 tickets mention archiving. 6 ask to restore an archived customer.',
  },
  {
    id: 'signal-active',
    kind: 'signal',
    from: 'Usage, last quarter',
    says: 'Most archived customers were Churned or Trial. 1 in 14 was Active when it was archived, almost always in a batch of 5 or more.',
  },
  {
    id: 'note-retention',
    kind: 'note',
    from: 'Engineering',
    says: 'Archived customers stay in the database for 90 days. There’s no screen for restoring, so support restores each customer by hand.',
  },
];

/* What a statement in the agent's summary is. The difference is the first
   thing the screen teaches: an observation is in the evidence, an
   interpretation is a reading of it, and an assumption is a claim nobody
   checked. */
export type ReadingKind = 'observation' | 'interpretation' | 'assumption';

export const READING_KIND: Record<ReadingKind, string> = {
  observation: 'Observation',
  interpretation: 'Interpretation',
  assumption: 'Assumption',
};

export interface Reading {
  id: string;
  kind: ReadingKind;
  says: string;
  /** The evidence it rests on. */
  from: string[];
}

export const READINGS: readonly Reading[] = [
  { id: 'r-back', kind: 'observation', says: 'Most archiving tickets ask to restore a customer.', from: ['signal-tickets', 'ticket-okafor'] },
  { id: 'r-support', kind: 'observation', says: 'Only support can restore a customer today. There’s no screen for restoring.', from: ['note-retention'] },
  { id: 'r-batch', kind: 'interpretation', says: 'Mistakes happen in batches: an active customer gets swept up with churned ones.', from: ['signal-active', 'ticket-okafor'] },
  { id: 'r-loss', kind: 'assumption', says: 'Archiving deletes customer data, so a mistake is permanent.', from: ['ticket-okafor'] },
];

/** The one reading the evidence contradicts, and what contradicts it. */
export const DISPUTED = { reading: 'r-loss', by: 'note-retention' } as const;

/** What the designer does with the disputed reading. */
export type ReadingCall = 'correct' | 'keep';

/* ---------- DEFINE: the brief ---------- */

/** What wins when pace and safety pull apart. */
export type Priority = 'pace' | 'recovery';

export const PRIORITY: Record<Priority, { name: string; says: string }> = {
  pace: {
    name: 'Speed comes first',
    says: 'Fewer presses for people who archive in bulk. A mistake gets fixed after it happens, not prevented.',
  },
  recovery: {
    name: 'Safety comes first',
    says: 'Relay names every active customer before archiving, even if that adds a press.',
  },
};

export interface Person {
  who: string;
  needs: string;
}

export const PEOPLE: readonly Person[] = [
  { who: 'Account manager', needs: 'Clear out old trials without worrying about the big accounts.' },
  { who: 'Operations lead', needs: 'Archive hundreds a quarter without extra steps.' },
  { who: 'Administrator', needs: 'See who archived each customer, and restore archived customers.' },
  { who: 'Relay’s product team', needs: 'Keep routine work quick.' },
  { who: 'Engineering', needs: 'One accessible pattern the design system can reuse.' },
];

export const CONSTRAINTS: readonly string[] = [
  'Archived customers are kept for 90 days. We can’t change that.',
  'Built from the design system’s components: Table, Toolbar, Button, Badge.',
  'Works with a keyboard and a screen reader.',
  'A destructive action needs a confirmation step or an Undo (rule 6).',
];

export const NOT_SOLVING: readonly string[] = ['Deleting data for good', 'Who is allowed to archive', 'Archiving from a customer’s own page'];

export const OPEN_QUESTIONS: readonly string[] = ['How often does someone archive more than a page at a time?', 'Does an administrator need to restore, or only to see who archived?'];

/* The problem statement, as the Discover call leaves it. Keeping the
   disputed reading frames the work around data loss, which the engineering
   note says does not happen; correcting it frames it around what does. */
export function problemOf(call: ReadingCall | null): string {
  if (call === 'keep') return 'Archiving deletes customer data for good, so one wrong press can’t be undone.';
  return 'Nobody can see or restore an archived customer. Cleanup feels risky, and mistakes become support tickets.';
}

export interface Criterion {
  id: string;
  says: string;
}

/* Success, as the priority sets it. One criterion holds either way, the
   administrator's; the other two are the priority's. */
export function criteriaOf(priority: Priority | null, call: ReadingCall | null): Criterion[] {
  const shared: Criterion = { id: 'c-who', says: 'An administrator can see who archived a customer, and when.' };
  const loss: Criterion[] = call === 'keep' ? [{ id: 'c-loss', says: 'No archive can lose data.' }] : [];
  if (priority === 'pace')
    return [...loss, { id: 'c-presses', says: 'Archiving a page of churned customers takes two presses.' }, { id: 'c-self', says: 'A person who archives by mistake can restore without calling support.' }, shared];
  if (priority === 'recovery')
    return [...loss, { id: 'c-named', says: 'No active customer is archived without being named first.' }, { id: 'c-restore', says: 'Any archived customer can be restored from the table for 90 days.' }, shared];
  return [...loss, shared];
}

/* ---------- EXPLORE: three directions ---------- */

export type DirectionId = 'undo' | 'confirm' | 'review';

export interface Direction {
  id: DirectionId;
  name: string;
  /** What it does, in a sentence. */
  does: string;
  /** Its real advantage, and its real cost. Neither direction is free. */
  gains: string;
  costs: string;
  /** Presses to archive a page of churned customers, counted from the working screen. */
  presses: number;
}

export const DIRECTIONS: readonly Direction[] = [
  {
    id: 'undo',
    name: 'Archive now, undo after',
    does: 'Archive acts at once. A bar says how many were archived and offers Undo until the next action.',
    gains: 'Fastest for routine cleanup. Nothing to read before the press.',
    costs: 'The Undo bar names no customer, so an active one archived by mistake is caught only if someone notices.',
    presses: 2,
  },
  {
    id: 'confirm',
    name: 'Confirm first, naming who',
    does: 'Archive asks first, and names any active customer in the selection.',
    gains: 'An active customer is named before anything happens. Closest to what ships today.',
    costs: 'People see the question every time and stop reading it.',
    presses: 3,
  },
  {
    id: 'review',
    name: 'Review batch, then archive',
    does: 'Archive opens a review of the selection, sorted into blocked, active, and routine customers.',
    gains: 'Catches blocked and active customers before the press. Suits a large batch.',
    costs: 'The most steps, and a new pattern for the design system to maintain.',
    presses: 3,
  },
];

/** What each direction showed with the batch Explore selects (three active
    customers, a trial, and Monarch Dental Group, which can't be archived),
    said once it has been tried. Read off ArchiveFlow, not written beside it:
    if a direction changes what it says, this changes with it. */
export const SHOWED: Record<DirectionId, string> = {
  undo: 'Archived four customers at once, including the three active ones, with no warning. Refused Monarch Dental Group only after the press. Undo lasted until the next action.',
  confirm: 'Named the three active customers before archiving. Offered to archive all five, and only after the press said Monarch Dental Group can’t be archived.',
  review: 'Set Monarch Dental Group aside before the press and named the three active customers, with a box to keep each one. Took the most steps.',
};

/** What a direction says once Archive is pressed and before anything leaves,
    for the two that ask: the move says it beside the screen, with the press
    that answers. Undo asks nothing, so it says nothing. */
export const ASKING: Record<DirectionId, string | null> = {
  undo: null,
  confirm: 'Relay asks before archiving and names the three active customers.',
  review: 'Relay sorts the five first: one can’t be archived, and three are active. To keep an active customer, clear its box.',
};

export function directionOf(id: DirectionId): Direction {
  return DIRECTIONS.find((d) => d.id === id) ?? DIRECTIONS[0];
}

/** What a person did in a working direction, as ArchiveFlow reports it. */
export type TrialEvent = 'archived' | 'undone' | 'restored' | 'blocked' | 'active-archived';

export type Trials = Record<DirectionId, TrialEvent[]>;

/* ---------- EVALUATE: findings that can become requirements ---------- */

export type FeatureId = 'names-active' | 'restore' | 'who' | 'blocked-first' | 'only-active';

export type Features = Record<FeatureId, boolean>;

export const NO_FEATURES: Features = { 'names-active': false, restore: false, who: false, 'blocked-first': false, 'only-active': false };

export type FindingSource = 'evidence' | 'session' | 'trying' | 'check';

export const FINDING_SOURCE: Record<FindingSource, string> = {
  evidence: 'From the evidence',
  session: 'Session notes, simulated',
  trying: 'From trying it',
  check: 'Automated check',
};

export interface Finding {
  id: string;
  source: FindingSource;
  says: string;
  /** The requirement it can become; a finding with none informs the choice but asks nothing of the build. */
  becomes?: FeatureId;
  /** The directions it is about, when it is not about all three. */
  about?: DirectionId[];
}

export const REQUIREMENT: Record<FeatureId, string> = {
  'names-active': 'Name any active customer before it’s archived.',
  restore: 'An Archived view where archived customers can be restored for 90 days.',
  who: 'The Archived view says who archived each customer, and when.',
  'blocked-first': 'Say which customers can’t be archived before the press, not after.',
  'only-active': 'Stop only for a batch with an active customer. A batch with none archives in one press.',
};

/* The condition (2026-11-02). Adam's call in the case study is the agent's
   review, kept, stopping only when the batch has an active customer: the
   review on every batch doubled the quarterly cleanup and got pressed
   through, and undo's bar names nobody. It is a requirement on a direction,
   not a fourth direction, because it changes when a direction stops, not
   what it does when it does; the three names stay, as the site quotes
   them. A direction that stops, built with it, takes this name. */
const ONLY_ACTIVE_NAME: Partial<Record<DirectionId, string>> = {
  confirm: 'Confirm only when someone’s active',
  review: 'Review only when someone’s active',
};

/** What the build is called: the direction's name, or the conditional one when the condition applies. */
export function buildNameOf(direction: DirectionId, f: Features): string {
  return (f['only-active'] && ONLY_ACTIVE_NAME[direction]) || directionOf(direction).name;
}

export const FINDINGS: readonly Finding[] = [
  { id: 'f-active', source: 'session', says: 'In 2 of 5 sessions, someone archived an active customer in a batch of churned ones and didn’t notice. The Undo bar said how many were archived, not who.', becomes: 'names-active', about: ['undo'] },
  { id: 'f-habit', source: 'session', says: 'By the third batch, people pressed through the question without reading it.', about: ['confirm'] },
  { id: 'f-bulk', source: 'session', says: 'The operations lead’s quarterly cleanup took twice as long with the review step, and not one of those batches had an active customer.', becomes: 'only-active', about: ['review'] },
  { id: 'f-back', source: 'evidence', says: '6 of 9 archiving tickets ask to restore a customer.', becomes: 'restore' },
  { id: 'f-audit', source: 'evidence', says: 'An auditor asked who archived a customer. Nobody could say.', becomes: 'who' },
  { id: 'f-blocked', source: 'trying', says: 'Monarch Dental Group can’t be archived: it has an open invoice. Two directions only say so after the press.', becomes: 'blocked-first', about: ['undo', 'confirm'] },
  { id: 'f-axe', source: 'check', says: 'All three pass the accessibility checks and work with a keyboard. No check can say whether people notice what changed.' },
];

/** What each direction already does, before any requirement is added.
    Undo never stops, so a batch with no active customer is one press already. */
export const BUILT_IN: Record<DirectionId, Partial<Features>> = {
  undo: { 'only-active': true },
  confirm: { 'names-active': true },
  review: { 'names-active': true, 'blocked-first': true },
};

/** The direction the agent recommends, as the priority sets it: it reads the brief, not the screens. */
export function recommendedFor(priority: Priority | null): DirectionId {
  return priority === 'recovery' ? 'review' : 'undo';
}

/* ---------- DELEGATE: the brief, the build, and the one stop ---------- */

export type StopKind = 'judgment' | 'approval';

export interface StopAnswer {
  id: string;
  name: string;
  /** What it means beyond this change. */
  means: string;
  recommended?: boolean;
}

export interface Stop {
  kind: StopKind;
  question: string;
  /** Why the agent can't settle it from the brief and the checks. */
  why: string;
  answers: StopAnswer[];
}

/* One stop for each direction, of the two kinds the runs teach: judgment,
   where the brief doesn't say what the product means, and approval, where
   the fix reaches past the delegation. */
export function stopOf(direction: DirectionId): Stop {
  switch (direction) {
    case 'undo':
      return {
        kind: 'approval',
        question: 'The Undo bar is a new pattern. Keep the bar on this screen, or propose it for the design system?',
        why: 'The agent can’t add a new pattern to the design system (rule 12). The design systems lead decides.',
        answers: [
          { id: 'local', name: 'Keep the bar on this screen', means: 'The agent can do this alone. Other screens don’t get the Undo bar yet.', recommended: true },
          { id: 'system', name: 'Propose the bar for the design system', means: 'The agent drafts a component and a story. The design systems lead decides.' },
        ],
      };
    case 'confirm':
      return {
        kind: 'judgment',
        question: 'Who counts as an active customer for the warning?',
        why: 'The brief says “active.” The table has an Active status and a Last active date. Either reading passes every check.',
        answers: [
          { id: 'status', name: 'Status is Active', means: 'Warns about 6 of the 12. Matches the Active badge people already see.', recommended: true },
          { id: 'recent', name: 'Active in the last week', means: 'Warns about 9 of the 12, trials included. Catches more, but warns more often.' },
        ],
      };
    case 'review':
      return {
        kind: 'approval',
        question: 'The review step needs a panel. Build the panel from existing parts, or add a Panel component to the design system?',
        why: 'A new shared component needs a written reason and the design systems lead’s approval (rule 10).',
        answers: [
          { id: 'inline', name: 'Build from existing parts', means: 'The agent can do this alone, with the Toolbar and Table.', recommended: true },
          { id: 'panel', name: 'Propose a Panel', means: 'The agent drafts a Panel with stories. The design systems lead decides, and until then the screen uses existing parts.' },
        ],
      };
  }
}

/** The agent's boundaries for this delegation, in three groups, as the runs write them. */
export const BOUNDARIES = {
  own: ['Change the customer table and its stories', 'Add an Archived view to the customers screen', 'Use any design system component'],
  judgment: ['Any question the brief doesn’t answer'],
  approval: ['A change to a shared component in src/components', 'A new interaction pattern (rule 12)'],
} as const;

export interface Brief {
  title: string;
  problem: string;
  direction: Direction;
  priority: Priority | null;
  requirements: { id: FeatureId; says: string; builtIn: boolean }[];
}

/** The features a build has: what its direction does anyway, and what the designer required. */
export function featuresOf(direction: DirectionId, required: Features): Features {
  const builtIn = BUILT_IN[direction];
  return {
    'names-active': required['names-active'] || !!builtIn['names-active'],
    restore: required.restore,
    who: required.who && required.restore,
    'blocked-first': required['blocked-first'] || !!builtIn['blocked-first'],
    'only-active': required['only-active'] || !!builtIn['only-active'],
  };
}

/* What a build checks and what it can't. Each requirement is held by a
   story the agent writes for it, and the one thing the checks can't say
   (whether a person notices) stays open. */
export interface Verification {
  says: string;
  /** passed, or inconclusive when no check can answer it. */
  state: 'passed' | 'changed' | 'inconclusive';
  how: string;
}

export interface Build {
  /** The changes the agent made on its own. */
  changes: string[];
  verified: Verification[];
}

export function buildOf(state: CycleState): Build | null {
  if (!state.direction) return null;
  const f = featuresOf(state.direction, state.required);
  const changes = [
    `CustomerTable: ${buildNameOf(state.direction, f).toLowerCase()}`,
    ...(f['only-active'] && !BUILT_IN[state.direction]['only-active'] ? ['A batch with no active customer archives at once'] : []),
    ...(f['names-active'] && !BUILT_IN[state.direction]['names-active'] ? ['The bulk bar names active customers before the press'] : []),
    ...(f['blocked-first'] && !BUILT_IN[state.direction]['blocked-first'] ? ['Blocked customers are named before the press'] : []),
    ...(f.restore ? ['An Archived view with Restore'] : []),
    ...(f.who ? ['Who archived and when, on each archived row'] : []),
    'Stories for every new state, and a test for each requirement',
  ];
  const verified: Verification[] = [
    { says: 'Every story renders, and axe finds nothing', state: 'passed', how: 'npm run test:stories' },
    { says: 'Every value is a token', state: 'passed', how: 'npm run lint:tokens' },
    { says: 'No toolbar overflows at 768px', state: 'passed', how: 'tests/visual.spec.ts' },
    { says: 'The customers screen looks different, as intended', state: 'changed', how: 'Visual baselines' },
    ...(Object.keys(REQUIREMENT) as FeatureId[])
      .filter((id) => f[id])
      .map((id) => ({ says: REQUIREMENT[id], state: 'passed' as const, how: 'A story asserts it' })),
    { says: 'Whether people notice what changed', state: 'inconclusive', how: 'No check can answer this' },
  ];
  return { changes, verified };
}

export function briefOf(state: CycleState): Brief | null {
  if (!state.direction) return null;
  const f = featuresOf(state.direction, state.required);
  const builtIn = BUILT_IN[state.direction];
  return {
    title: 'Archiving customers without losing control',
    problem: problemOf(state.reading),
    direction: directionOf(state.direction),
    priority: state.priority,
    requirements: (Object.keys(REQUIREMENT) as FeatureId[]).filter((id) => f[id]).map((id) => ({ id, says: REQUIREMENT[id], builtIn: !!builtIn[id] && !state.required[id] })),
  };
}

/* ---------- LEARN: what's known, what isn't, what to measure ---------- */

export interface Measure {
  what: string;
  /** Which way it should move, as the priority reads it. */
  target: string;
}

export interface Outcome {
  unknowns: string[];
  measures: Measure[];
  research: string[];
  nextTime: string[];
  /** The guidance the decision could leave for the next agent. */
  guidance: string;
}

export function outcomeOf(state: CycleState): Outcome | null {
  if (!state.direction) return null;
  const f = featuresOf(state.direction, state.required);
  const unknowns: string[] = [];
  if (state.reading === 'keep') unknowns.push('The brief assumed data loss, but the engineering note says archived customers are kept 90 days. Part of the build solves a problem nobody has.');
  if (!f['names-active']) unknowns.push('Nothing stops an active customer being archived in a batch. The Undo bar is the only protection.');
  if (!f.restore) unknowns.push('Restoring is still a support ticket.');
  if (f.restore && !f.who) unknowns.push('The auditor’s question, who archived a customer, still has no answer on screen.');
  /* What the direction stops with, for the lines that ask whether it's read. */
  const step = state.direction === 'confirm' ? 'question' : 'review';
  const conditional = state.direction !== 'undo' && f['only-active'];
  if (conditional) unknowns.push(`Whether people read the ${step} when it does appear, or press straight through it.`);
  else if (state.direction === 'confirm') unknowns.push('Whether people read the question by the third batch. The session notes say they don’t.');
  else if (state.direction === 'review') unknowns.push('Whether the operations lead tolerates the review for a couple of hundred rows a quarter.');
  unknowns.push('Whether any of this holds with real people. Nothing here was tested with anyone.');

  const pace = state.priority !== 'recovery';
  const measures: Measure[] = [
    { what: 'Tickets asking to restore a customer', target: 'Fewer than the 6 of 9 last quarter' },
    { what: 'Active customers archived', target: pace ? 'No higher than 1 in 14' : 'Down from 1 in 14' },
    { what: 'Restores within a week of an archive', target: f.restore ? 'Counted, to see how often mistakes happen' : 'Not measurable: there’s no Restore' },
    { what: 'Time to archive a page of churned customers', target: pace || conditional ? 'No slower than today' : 'Accept a few seconds more' },
    ...(conditional
      ? [
          { what: `How often the ${step} appears`, target: 'Only for batches with an active customer' },
          { what: `${step === 'review' ? 'Reviews' : 'Questions'} pressed straight through`, target: `Few: a ${step} that’s rare should get read` },
        ]
      : []),
  ];

  const research = ['Watch five operations leads do a real quarterly cleanup.', 'Ask two administrators what an auditor actually needs to see.'];
  if (state.direction === 'undo') research.push('Check whether people notice the Undo bar after archiving from the bottom of a long list.');

  const nextTime: string[] = [];
  if (state.direction === 'undo') nextTime.push('Try naming active customers in the bar before the press, if the measure moves the wrong way.');
  if (state.direction === 'confirm' && !conditional) nextTime.push('Ask only when the batch holds an active customer, so the question means something.');
  if (state.direction === 'review' && !conditional) nextTime.push('Skip the review when the batch is all churned, to give the operations lead back their speed.');
  if (conditional) nextTime.push(`Put the condition in the brief. The agent read the brief, not the session notes, so it recommended a ${step} on every batch.`);
  if (state.reading === 'keep') nextTime.push('Check the summary against the engineering note before writing the brief.');

  const before = conditional && f['names-active'] ? 'stops only when the batch holds a record at risk, and names those records' : f['names-active'] ? 'names the records at risk before the press' : null;
  const guidance = before && f.restore
    ? `A bulk action that removes records ${before}, and offers Restore after.`
    : f.restore
      ? 'A bulk action that removes records offers Restore after.'
      : before
        ? `A bulk action that removes records ${before}.`
        : 'A bulk action that removes records names what was removed, and offers Undo until the next action.';

  return { unknowns, measures, research, nextTime, guidance };
}

/* ---------- THE STATE, AND THE ONE REDUCER THAT MOVES IT ---------- */

export interface CycleState {
  /** Evidence the person has opened, in the order they opened it. */
  opened: string[];
  reading: ReadingCall | null;
  priority: Priority | null;
  /** The direction shown in Explore. */
  exploring: DirectionId;
  trials: Trials;
  direction: DirectionId | null;
  /** The designer's reason for the direction, once they write one; the agent's draft until then. */
  reason: string | null;
  required: Features;
  /** Whether the brief has been handed to the agent. */
  delegated: boolean;
  /** The answer to the agent's one stop. */
  answer: string | null;
  /** Whether the guidance was kept for the next agent. */
  kept: boolean;
}

export function initialCycle(): CycleState {
  return {
    opened: [],
    reading: null,
    priority: null,
    exploring: 'undo',
    trials: { undo: [], confirm: [], review: [] },
    direction: null,
    reason: null,
    required: NO_FEATURES,
    delegated: false,
    answer: null,
    kept: false,
  };
}

export type CycleAction =
  | { type: 'open'; evidence: string }
  | { type: 'read'; call: ReadingCall }
  | { type: 'prioritize'; priority: Priority }
  | { type: 'explore'; direction: DirectionId }
  | { type: 'try'; direction: DirectionId; event: TrialEvent }
  | { type: 'choose'; direction: DirectionId }
  | { type: 'reason'; text: string }
  | { type: 'require'; feature: FeatureId; on: boolean }
  | { type: 'delegate' }
  | { type: 'answer'; answer: string }
  | { type: 'keep'; on: boolean }
  | { type: 'reset' };

/* A choice upstream clears what was built on it downstream, so the screen
   never shows a build the person's current choices wouldn't produce: a new
   direction un-sends the brief, and a new brief clears the agent's answer. */
export function reduceCycle(s: CycleState, a: CycleAction): CycleState {
  switch (a.type) {
    case 'open':
      return s.opened.includes(a.evidence) ? s : { ...s, opened: [...s.opened, a.evidence] };
    case 'read':
      return s.reading === a.call ? s : { ...s, reading: a.call, delegated: false, answer: null };
    case 'prioritize':
      return s.priority === a.priority ? s : { ...s, priority: a.priority, delegated: false, answer: null };
    case 'explore':
      return s.exploring === a.direction ? s : { ...s, exploring: a.direction };
    case 'try':
      return { ...s, trials: { ...s.trials, [a.direction]: [...s.trials[a.direction], a.event] } };
    case 'choose':
      return s.direction === a.direction ? s : { ...s, direction: a.direction, reason: null, delegated: false, answer: null, kept: false };
    case 'reason':
      return { ...s, reason: a.text };
    case 'require':
      return s.required[a.feature] === a.on ? s : { ...s, required: { ...s.required, [a.feature]: a.on }, delegated: false, answer: null, kept: false };
    case 'delegate':
      return s.direction ? { ...s, delegated: true } : s;
    case 'answer':
      return s.delegated ? { ...s, answer: a.answer } : s;
    case 'keep':
      return { ...s, kept: a.on };
    case 'reset':
      return initialCycle();
  }
}

/** The agent's draft reason for a direction, until the person writes their own. */
export function draftReason(direction: DirectionId, priority: Priority | null): string {
  const d = directionOf(direction);
  const p = priority ? PRIORITY[priority].name.toLowerCase() : 'it fits the brief';
  return `Because ${p}. The trade-off: ${d.costs.charAt(0).toLowerCase()}${d.costs.slice(1)}`;
}

/** Whether a stage has had its decision, for the rail. */
export function decided(s: CycleState, stage: StageId): boolean {
  switch (stage) {
    case 'discover':
      return s.reading !== null;
    case 'define':
      return s.priority !== null;
    case 'explore':
      return DIRECTIONS.every((d) => s.trials[d.id].length > 0);
    case 'evaluate':
      return s.direction !== null;
    case 'delegate':
      return s.answer !== null;
    case 'learn':
      return s.kept;
  }
}

/** Which rows the build names as active, by the confirm direction's answer. */
/** The first stage whose move is not made yet, or STAGES.length when all
    six are. The cycle is a script, not a sandbox (since 2026-10-26): a stage
    opens once every stage before it is decided, so each one meets the
    choices it reads, and nobody arrives at Delegate to be sent back. */
export function firstOpen(s: CycleState): number {
  const i = STAGES.findIndex((st) => !decided(s, st.id));
  return i === -1 ? STAGES.length : i;
}

/** Whether a stage can be opened yet: every stage before it is decided. */
export function reachable(s: CycleState, stage: StageId): boolean {
  return stageIndex(stage) <= firstOpen(s);
}

export function activeRule(direction: DirectionId, answer: string | null): 'status' | 'recent' {
  return direction === 'confirm' && answer === 'recent' ? 'recent' : 'status';
}

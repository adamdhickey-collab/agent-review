import type { Boundary, Check, DelegationState, Option, Question, Reach, Work, Words } from './delegation';

/* The second delegated run: Claude Code asked to fix a cramped customer
   table, which finds that the fix that fits is in the shared Table every
   screen draws. SIMULATED THROUGHOUT, like the billing run: nothing here
   was run. Relay is made up, and of its forty screens only the customer
   list exists in this repository; the other thirty-nine, which of them have
   a visual baseline and which hold the table in a panel of fixed height,
   the run, its times, its commits and the checks' figures are written to be
   internally consistent and played back the same way every time. What is
   real is the mechanism the decision turns on: the shared Table pads every
   cell by --table-pad-y, which is --space-2 (src/components/Table/Table.css),
   so the fix that fits is one line in a file every table reads, and rule 9
   of skills/ui-quality/SKILL.md is about exactly that file.

   The billing run's decision is missing intent: the agent can make either
   change and cannot tell which one the product means. This one is a
   permission boundary: the agent knows exactly what to do, the checks it
   can run pass, and the change is not its to make. So the card says what it
   was asked, what it proposes, who else the change reaches, what has been
   checked and what hasn't, and offers three answers that end differently:
   keep the fix on the screen asked about (within its authority), approve
   the shared change once (past it, for this change only), or have the
   agent gather more evidence first (nothing decided; it asks again with
   what it found). Only the first can become a rule, scoped to the customer
   screens, and the second says why it can't: a standing permission to
   change a shared component is its owner's to give.

   The arithmetic: the request names three fixes. Two are made on the
   customer screen on the agent's own authority; the third is the question. */

const dana = { name: 'Dana Whitfield', role: 'Product design' };
const priya = { name: 'Priya Raman', role: 'Design systems' };
const AREA = 'src/product/customers/';
const LOCAL = `${AREA}CustomerTable.css`;
const SHARED = 'src/components/Table/Table.css';

export const TABLE_WORDS: Words = {
  unit: ['fix', 'fixes'],
  done: 'are merged',
  routine: ['routine fix', 'routine fixes'],
  line: 'declaration',
};

export const tableBoundaries: Boundary[] = [
  { n: 1, group: 'own', text: 'Change the customer screen’s own files, in src/product/customers/.' },
  { n: 2, group: 'own', text: 'Run the checks, and fix a check its own change broke.' },
  { n: 3, group: 'own', text: 'Merge when every check passes and no screen but the customer list moves.' },
  { n: 4, group: 'asks', text: 'When a fix would change what a column shows, not only how it fits.' },
  { n: 5, group: 'outside', text: 'Changing a shared component or the token layer, which other screens read.' },
];

/* The forty screens that draw the shared Table, by area: which have a
   visual baseline (12), and which hold the table in a panel of fixed
   height (5), known from their CSS rather than from looking. */
const SCREENS: Reach['areas'] = [
  {
    area: 'Customers',
    screens: [{ name: 'Customer list', baseline: true, asked: true }, { name: 'Contacts', baseline: true }, { name: 'Activity' }, { name: 'Segments' }],
  },
  {
    area: 'Billing',
    screens: [
      { name: 'Invoices', baseline: true },
      { name: 'Line items', fixed: true },
      { name: 'Payment history', baseline: true },
      { name: 'Billing activity' },
      { name: 'Plans', baseline: true },
      { name: 'Usage by seat' },
      { name: 'Credit notes' },
      { name: 'Tax rates' },
    ],
  },
  {
    area: 'Reports',
    screens: [
      { name: 'Revenue', baseline: true },
      { name: 'Churn' },
      { name: 'Cohorts' },
      { name: 'Top accounts', fixed: true },
      { name: 'Exports' },
      { name: 'Scheduled reports' },
      { name: 'Forecast' },
      { name: 'Seat utilization', baseline: true },
      { name: 'Collections' },
    ],
  },
  {
    area: 'Settings',
    screens: [
      { name: 'Team members', baseline: true, fixed: true },
      { name: 'Roles' },
      { name: 'API keys', baseline: true },
      { name: 'Webhooks' },
      { name: 'Audit log', fixed: true },
      { name: 'Integrations' },
      { name: 'Notifications' },
      { name: 'Domains' },
    ],
  },
  {
    area: 'Support',
    screens: [{ name: 'Tickets', baseline: true }, { name: 'Ticket history' }, { name: 'Macros' }, { name: 'Escalations', baseline: true }, { name: 'SLAs' }, { name: 'Satisfaction' }],
  },
  {
    area: 'Admin',
    screens: [{ name: 'Accounts', baseline: true }, { name: 'Feature flags' }, { name: 'Data retention', fixed: true }, { name: 'Imports' }, { name: 'Sandbox' }],
  },
];

const FIXED = SCREENS.flatMap((a) => a.screens.filter((s) => s.fixed).map((s) => s.name));
const fixedList = `${FIXED.slice(0, -1).join(', ')} and ${FIXED[FIXED.length - 1]}`;

/* The checks on a fix that moves the customer list and nothing else, which
   is what boundary 3 lets the agent merge on its own. */
function localChecks(stories: number, moved: string): Check[] {
  return [
    { name: 'Token lint', state: 'passed', label: 'Passed', established: 'Every value in the change is a token or a keyword.' },
    { name: 'Visual baselines', state: 'passed', label: 'Only the customer list moved', established: `The customer list’s 2 frames moved: ${moved}. None of the other 11 screens with a baseline moved.` },
    { name: 'Stories with axe', state: 'passed', label: `${stories} of ${stories} passed`, established: 'Every customer table story renders, and axe found no violation.' },
  ];
}

/* ------------------------------------------------------------------------
   What it did on its own
   ------------------------------------------------------------------------ */

const UNDO = 'Reverting adds a commit to main that undoes it, and the agent won’t redo it.';

const toolbarRoutine: Work = {
  id: 'customers-toolbar',
  file: LOCAL,
  screen: 'Customer list',
  title: 'The toolbar wraps under the title at 768',
  status: 'made',
  lines: [{ selector: '.customers__toolbar', property: 'flex-wrap', before: 'nowrap', after: 'wrap' }],
  basis: { kind: 'boundary', boundaries: [1, 3] },
  reason: 'At 768 the search field squeezed the title onto two lines. Letting the toolbar wrap gives the title its line back.',
  checks: localChecks(12, 'the toolbar sits under the title at 768'),
  commit: '3e8a1c4',
  frames: 2,
  stories: 12,
  undo: UNDO,
  history: [
    { at: '13:55', who: 'agent', text: 'Let the toolbar wrap, in CustomerTable.css.' },
    { at: '13:56', who: 'agent', text: 'Ran the checks: the token lint passed, only the customer list’s 2 frames moved, 12 of 12 stories passed.' },
    { at: '13:56', who: 'agent', text: 'Merged to main as 3e8a1c4.' },
  ],
};

const emailRoutine: Work = {
  id: 'customers-email',
  file: LOCAL,
  screen: 'Customer list',
  title: 'Whole email addresses at 768',
  status: 'made',
  lines: [{ selector: '.customers__email', property: 'max-inline-size', before: '12rem', after: 'none' }],
  basis: { kind: 'boundary', boundaries: [1, 3] },
  reason: 'Addresses were cut off at 12rem. Without the cap, the column takes the room an address needs.',
  checks: localChecks(12, 'whole addresses at 768'),
  commit: 'b40f9d2',
  frames: 2,
  stories: 12,
  undo: UNDO,
  history: [
    { at: '13:58', who: 'agent', text: 'Took the cap off the email column, in CustomerTable.css.' },
    { at: '13:59', who: 'agent', text: 'Ran the checks: the token lint passed, only the customer list’s 2 frames moved, 12 of 12 stories passed.' },
    { at: '13:59', who: 'agent', text: 'Merged to main as b40f9d2.' },
  ],
};

/* ------------------------------------------------------------------------
   Where it stopped
   ------------------------------------------------------------------------ */

const LOCAL_RULE = {
  text: 'On the customer screens, when a fix would change a shared component, make it on the screen instead, and tell the component’s owner.',
  scope: 'The customer screens',
  excludes: 'Other screens, a bug in a shared component itself, and any change a component’s owner asks for.',
  why: 'A shared component is its owner’s to change. A fix on the screen answers the request without deciding for 39 others.',
};

/* Keep it to the screen asked about: within the agent's own boundaries, so
   the person is answering, not granting. */
const keepLocal: Option = {
  id: 'local',
  title: 'This screen only',
  label: 'Fix this screen only',
  recommended: true,
  effect: 'It sets --table-pad-y to --space-3 on the customer table alone, in CustomerTable.css, and leaves the shared Table as it is.',
  outcome: 'Only the customer list moves. The other 39 keep their rows, and the Table’s owner gets a note.',
  file: LOCAL,
  lines: [{ selector: '.customers .table', property: '--table-pad-y', before: 'var(--space-2)' }],
  after: ['var(--space-3)'],
  record: 'Rows 8px taller, on the customer table only',
  then: {
    checks: localChecks(12, 'rows 8px taller'),
    unchecked: 'Whether the customer table should differ from the other 39 screens. It does now, by one line, until the shared table’s owner decides.',
    open: 'The other 39 screens keep their tighter rows. Priya Raman, who owns the shared Table, has the agent’s note.',
    history: [
      'Ran the checks: the token lint passed, only the customer list’s 2 frames moved, 12 of 12 stories passed.',
      'Left Priya Raman a note: the customer table now sets its own --table-pad-y, and the shared Table may want the same change.',
    ],
  },
  rule: LOCAL_RULE,
};

const APPROVE_NOTE =
  'This approves one change. Letting an agent change the shared Table without asking is a standing permission only its owner, Priya Raman (Design systems), can give, and this doesn’t ask her.';

/* Approve the shared change, once: past boundary 5, for this change only.
   What follows says exactly what was and wasn't looked at. */
function approve(seen: boolean): Option {
  return {
    id: 'shared',
    grants: true,
    title: 'All 40 screens',
    label: 'Approve, this once',
    effect: seen
      ? 'It sets --table-pad-y to --space-3 in the shared Table. All 40 screens get rows 8px taller, and 5 cut off their last row until their panels are fixed.'
      : 'It sets --table-pad-y to --space-3 in the shared Table. All 40 screens get rows 8px taller.',
    outcome: seen
      ? 'All 40 get taller rows, and 5 cut off a row. Those 5 are listed as unresolved.'
      : 'All 40 get taller rows. The 28 nobody has looked at are listed as unresolved.',
    after: ['var(--space-3)'],
    record: 'Rows 8px taller in the shared Table, on all 40 screens',
    screen: 'Shared Table',
    then: {
      checks: [
        { name: 'Token lint', state: 'passed', label: 'Passed', established: 'The change names a token, and the token exists.' },
        {
          name: 'Visual baselines',
          state: 'changed',
          label: '12 of 12 baselines moved',
          established: 'Every screen with a baseline moved by the row height and nothing else. Re-recorded, with your approval.',
        },
        { name: 'Stories with axe', state: 'passed', label: '9 of 9 passed', established: 'Every Table story renders, and axe found no violation.' },
      ],
      unchecked: seen
        ? `Whether the 5 panels that now cut off a row (${fixedList}) should grow or scroll. That is each screen’s decision.`
        : 'How the 28 screens without a baseline look with taller rows, including 5 that hold the table in a panel of fixed height.',
      open: seen
        ? `5 screens cut off their last row in a panel of fixed height: ${fixedList}.`
        : '28 screens draw the taller rows and have no visual baseline. Nobody has looked at them.',
      history: ['Ran the checks: the token lint passed, 12 of 12 baselines moved by the row height only, 9 of 9 Table stories passed.', 'Re-recorded the 12 baselines, as you approved.'],
    },
    note: APPROVE_NOTE,
  };
}

const COMMON = {
  kind: 'scope' as const,
  ask: 'The fix is in a table 40 screens share. Change it for all of them?',
  asked: 'Fix the cramped customer table, on the customer screen.',
  proposes: 'Pad every table row by --space-3 instead of --space-2, in the shared Table: rows 8px taller.',
  found:
    'The customer table’s rows are 32px because the shared Table pads every cell by --table-pad-y, which is --space-2. Making it --space-3 gives 40px rows, here and on every screen that draws a table.',
  gap: 'The agent knows how to make the change, and the checks it could run pass. But the Table belongs to the design system, and this delegation covers the customer screen.',
  verdict: 'So this isn’t a technical problem. It’s a permission decision.',
  paused: [5],
  pattern: 'shared' as const,
  edge: 'the fix is in a shared component',
};

/* After the agent has rendered the forty: the same question, with what was
   found, and without the answer that asked for it. */
const seenQuestion: Question = {
  ...COMMON,
  recommendation: 'Five screens would cut off a row, and the request was the customer screen. Fix it here, and let the Table’s owner decide about the rest.',
  reach: {
    component: 'Table',
    owner: priya,
    areas: SCREENS,
    checked: [
      { state: 'passed', text: 'Token lint: the change names a token.' },
      { state: 'passed', text: 'Axe: 9 of 9 Table stories passed.' },
      { state: 'changed', text: 'Visual baselines: all 12 screens that have one moved, by the row height only.' },
      { state: 'passed', text: 'All 40 screens rendered before and after, at 1280 and 768: 35 only get taller rows.' },
      { state: 'failed', text: `On 5, a panel of fixed height now cuts off the last row: ${fixedList}.` },
    ],
    unknown: ['Whether those 5 panels should grow or scroll. That depends on each screen, not on the table.', 'How the 40 look on a phone. It rendered at 1280 and 768 only.'],
  },
  options: [keepLocal, approve(true)],
};

const firstQuestion: Question = {
  ...COMMON,
  recommendation: 'The request was the customer screen, and 28 of the 40 screens haven’t been looked at. Fix it here, and let the Table’s owner decide about the rest.',
  reach: {
    component: 'Table',
    owner: priya,
    areas: SCREENS,
    checked: [
      { state: 'passed', text: 'Token lint: the change names a token.' },
      { state: 'passed', text: 'Axe: 9 of 9 Table stories passed.' },
      { state: 'changed', text: 'Visual baselines: 12 of the 40 screens have one, and all 12 moved, by the row height only.' },
    ],
    unknown: [
      '28 screens have no visual baseline. Nobody has looked at them with taller rows.',
      '5 hold the table in a panel of fixed height, from their CSS, not from looking. There, a taller row may push the last one out of view.',
    ],
  },
  options: [
    keepLocal,
    approve(false),
    {
      id: 'evidence',
      title: 'More evidence first',
      label: 'Show me the 40 screens',
      effect: 'It renders all 40 screens before and after the change, at 1280 and 768, and asks again with what it finds. Nothing changes in the code.',
      outcome: 'Nothing changes yet. It renders all 40 screens and asks again with what it finds.',
      after: [],
      asks: seenQuestion,
      then: {
        history: ['Rendered all 40 screens before and after the change, at 1280 and 768.', 'Compared them: 35 only get taller rows. On 5, a panel of fixed height now cuts off the last row.'],
      },
    },
  ],
};

const sharedRows: Work = {
  id: 'table-rows',
  file: SHARED,
  screen: 'Customer list',
  title: 'Rows 8px taller, in the shared Table',
  status: 'asking',
  lines: [{ selector: '.table', property: '--table-pad-y', before: 'var(--space-2)' }],
  question: firstQuestion,
  frames: 2,
  stories: 9,
  undo: UNDO,
  history: [
    { at: '14:02', who: 'agent', text: 'The rows are tight because the shared Table pads every cell by --space-2. The fix that fits is --space-3, in src/components/Table/Table.css.' },
    { at: '14:04', who: 'agent', text: 'Tried it: the token lint passed, 9 of 9 Table stories passed, and all 12 screens with a baseline moved, by the row height only.' },
    { at: '14:05', who: 'agent', text: 'Stopped: 40 screens draw the shared Table, and changing it is outside this delegation (boundary 5).' },
  ],
};

export function initialTableRun(): DelegationState {
  return {
    brief: {
      id: 'shared-table',
      title: 'Fix the cramped customer table',
      request:
        'Support says the customer table feels cramped: the rows are tight, email addresses are cut off at 768, and the toolbar squeezes the title. Fix it on the customer screen. Merge what moves only that screen, and ask me about anything wider.',
      by: dana,
      agent: { name: 'Claude Code', run: 'run_01K6P9' },
      repo: 'relay/web',
      area: AREA,
      delegatedAt: '2026-10-01T13:52:00-05:00',
      lastActive: '14:05',
      literals: 3,
      words: TABLE_WORDS,
    },
    boundaries: tableBoundaries,
    work: [sharedRows, emailRoutine, toolbarRoutine],
    rules: [],
    clock: 0,
  };
}

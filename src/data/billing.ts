import { cleanChecks, type Boundary, type DelegationState, type Option, type Pattern, type Question, type Twin, type Work } from './delegation';

/* The delegated run the product opens on: Claude Code moving Relay's billing
   screens onto the token layer. SIMULATED THROUGHOUT. Unlike rv-2041 and
   rv-2042 in scenario.ts, which are transcribed from real runs, nothing here
   was run: the billing screens, the run, its times, its commits and the
   checks' figures are written to be internally consistent and are played
   back the same way every time. The tokens are real (src/tokens/tokens.css),
   and so are the two facts the scenario turns on: --color-danger and
   --color-diff-remove-ink are both #b42318, and --color-success and
   --color-diff-add-ink are both #1f7a3f, so a swap to either name moves no
   pixel and every check passes whichever is chosen.

   The arithmetic, which the stories assert: the lint reported 36 literals.
   Seven changes the agent made on its own hold 26 of them; two questions
   hold 3; four changes waiting on the first question hold the other 7. */

const dana = { name: 'Dana Whitfield', role: 'Product design' };
const AREA = 'src/product/billing/';
const file = (name: string) => `${AREA}${name}`;

export const boundaries: Boundary[] = [
  { n: 1, group: 'own', text: 'Replace a literal with the token of the same value, on the billing screens.' },
  { n: 2, group: 'own', text: 'Where two tokens share a value, choose by what the element is, and say why.' },
  { n: 3, group: 'own', text: 'Run the checks, and fix a check its own change broke.' },
  { n: 4, group: 'own', text: 'Merge to main when the token lint passes and no frame moves a pixel.' },
  { n: 5, group: 'asks', text: 'When the evidence for what a value means conflicts.' },
  { n: 6, group: 'asks', text: 'When no token has the value, so a swap would move pixels.' },
  { n: 7, group: 'outside', text: 'Changing a shared component or the token layer, which every screen reads.' },
];

/* ------------------------------------------------------------------------
   What it did on its own
   ------------------------------------------------------------------------ */

const activityRoutine: Work = {
  id: 'activity-routine',
  file: file('BillingActivity.css'),
  screen: 'Billing activity',
  title: 'Three values in the billing activity onto tokens',
  status: 'made',
  lines: [
    { selector: '.activity__entry', property: 'padding-block', before: '12px', after: 'var(--space-3)' },
    { selector: '.activity__entry', property: 'font-size', before: '0.75rem', after: 'var(--text-sm)' },
    { selector: '.activity__time', property: 'color', before: '#6a6a76', after: 'var(--color-text-muted)' },
  ],
  basis: { kind: 'boundary', boundaries: [1, 4] },
  reason: 'Each value is exactly one token’s value.',
  checks: cleanChecks(2, 2),
  commit: 'e1f62d9',
  frames: 2,
  stories: 2,
  history: [
    { at: '13:07', who: 'agent', text: 'Replaced 3 values with their tokens.' },
    { at: '13:08', who: 'agent', text: 'Ran the checks: the token lint passed, 0 of 2 frames moved, 2 of 2 stories passed.' },
    { at: '13:08', who: 'agent', text: 'Merged to main as e1f62d9.' },
  ],
};

const invoiceRoutine: Work = {
  id: 'invoice-routine',
  file: file('InvoiceDetail.css'),
  screen: 'Invoice detail',
  title: 'Six values in the invoice detail onto tokens',
  status: 'made',
  lines: [
    { selector: '.invoice', property: 'padding', before: '16px', after: 'var(--space-4)' },
    { selector: '.invoice__lines', property: 'gap', before: '8px', after: 'var(--space-2)' },
    { selector: '.invoice__meta', property: 'font-size', before: '0.75rem', after: 'var(--text-sm)' },
    { selector: '.invoice__meta', property: 'color', before: '#6a6a76', after: 'var(--color-text-muted)' },
    { selector: '.invoice__line', property: 'border-bottom-color', before: '#e4e4e8', after: 'var(--color-border)' },
    { selector: '.invoice', property: 'border-radius', before: '6px', after: 'var(--radius-md)' },
  ],
  basis: { kind: 'boundary', boundaries: [1, 4] },
  reason: 'Each value is exactly one token’s value.',
  checks: cleanChecks(4, 4),
  commit: '7c1e2a4',
  frames: 4,
  stories: 4,
  history: [
    { at: '13:12', who: 'agent', text: 'Replaced 6 values with their tokens.' },
    { at: '13:13', who: 'agent', text: 'Ran the checks: the token lint passed, 0 of 4 frames moved, 4 of 4 stories passed.' },
    { at: '13:14', who: 'agent', text: 'Merged to main as 7c1e2a4.' },
  ],
};

const paymentRoutine: Work = {
  id: 'payment-routine',
  file: file('PaymentHistory.css'),
  screen: 'Payment history',
  title: 'Four values in the payment history onto tokens',
  status: 'made',
  lines: [
    { selector: '.payments__cell', property: 'padding-block', before: '8px', after: 'var(--space-2)' },
    { selector: '.payments__cell', property: 'padding-inline', before: '12px', after: 'var(--space-3)' },
    { selector: '.payments__head', property: 'background', before: '#f2f2f4', after: 'var(--color-surface-sunken)' },
    { selector: '.payments__head', property: 'font-weight', before: '600', after: 'var(--weight-semibold)' },
  ],
  basis: { kind: 'boundary', boundaries: [1, 4] },
  reason: 'Each value is exactly one token’s value.',
  checks: cleanChecks(2, 3),
  commit: '1d9b5f0',
  frames: 2,
  stories: 3,
  history: [
    { at: '13:16', who: 'agent', text: 'Replaced 4 values with their tokens.' },
    { at: '13:16', who: 'agent', text: 'Ran the checks: the token lint passed, 0 of 2 frames moved, 3 of 3 stories passed.' },
    { at: '13:17', who: 'agent', text: 'Merged to main as 1d9b5f0.' },
  ],
};

/* The agent's own judgment, made visible: two tokens are this red, and it
   chose one by what the element says. The checks pass either way, which is
   exactly why the record says what they could not establish. */
const paymentFailed: Work = {
  id: 'payment-failed',
  file: file('PaymentHistory.css'),
  screen: 'Payment history',
  title: 'The failed-payment red is --color-danger',
  status: 'made',
  lines: [{ selector: '.payments__status--failed', property: 'color', before: '#b42318', after: 'var(--color-danger)' }],
  basis: { kind: 'boundary', boundaries: [2, 4] },
  reason:
    'Two tokens are #b42318: --color-danger and --color-diff-remove-ink. This element is the status “Payment failed”, and tokens.css says danger is a failure, so it chose --color-danger.',
  checks: cleanChecks(2, 3),
  unchecked: 'Which of the two names is right. Both draw the same red, so no check can tell them apart; the agent chose by what the element says.',
  commit: '5a0c3e7',
  frames: 2,
  stories: 3,
  history: [
    { at: '13:17', who: 'agent', text: 'Two tokens share #b42318. Chose --color-danger: the element says “Payment failed” (boundary 2).' },
    { at: '13:18', who: 'agent', text: 'Ran the checks: the token lint passed, 0 of 2 frames moved, 3 of 3 stories passed.' },
    { at: '13:18', who: 'agent', text: 'Merged to main as 5a0c3e7.' },
  ],
};

/* A technical problem the agent caused, found and fixed inside its own
   boundaries: it named a token that does not exist. The lint said so, and
   so did the visual check, because an unknown custom property falls back
   to the inherited color. */
const planRoutine: Work = {
  id: 'plan-routine',
  file: file('PlanCard.css'),
  screen: 'Plan card',
  title: 'Four values in the plan card onto tokens, after a wrong token name',
  status: 'made',
  lines: [
    { selector: '.plan', property: 'padding', before: '20px', after: 'var(--space-5)' },
    { selector: '.plan', property: 'border-radius', before: '6px', after: 'var(--radius-md)' },
    { selector: '.plan__name', property: 'font-size', before: '1rem', after: 'var(--text-lg)' },
    { selector: '.plan__caption', property: 'color', before: '#6a6a76', after: 'var(--color-text-muted)' },
  ],
  basis: { kind: 'boundary', boundaries: [1, 3, 4] },
  reason: 'Each value is exactly one token’s value. Its first try named a token that doesn’t exist; the checks caught it, and it corrected the name.',
  checks: [
    {
      name: 'Token lint',
      state: 'passed',
      label: 'Passed',
      established: 'These lines name tokens now, and every token they name exists.',
      earlier: { state: 'failed', label: '--color-text-subtle is not a token (PlanCard.css:31)' },
    },
    {
      name: 'Visual baselines',
      state: 'passed',
      label: '0 of 2 frames moved',
      established: 'Nothing on the screen moved, at 1280 and at 768.',
      earlier: { state: 'failed', label: '2 of 2 frames moved, 1,184 pixels: the plan caption in the body ink' },
    },
    { name: 'Stories with axe', state: 'passed', label: '2 of 2 passed', established: 'Every story of the screen renders, and axe found no violation.' },
  ],
  commit: '9e4f1b2',
  frames: 2,
  stories: 2,
  history: [
    { at: '13:20', who: 'agent', text: 'Replaced 4 values with their tokens.' },
    { at: '13:21', who: 'agent', text: 'Ran the checks. The token lint failed: --color-text-subtle is not a token. The visual check failed: 2 of 2 frames moved, with the plan caption drawn in the body ink.' },
    { at: '13:22', who: 'agent', text: 'Looked the value up in tokens.ts: #6a6a76 is --color-text-muted. Corrected line 31.' },
    { at: '13:23', who: 'agent', text: 'Ran the checks again: the token lint passed, 0 of 2 frames moved, 2 of 2 stories passed.' },
    { at: '13:23', who: 'agent', text: 'Merged to main as 9e4f1b2.' },
  ],
};

/* A check that could not answer. axe reports contrast as incomplete when it
   cannot tell what is behind the text, which is the case where a label
   crosses the meter's fill. It did the same on main, and a change that
   moved no pixel cannot have changed it, so the agent merged under boundary
   4 and said what is still unknown rather than calling it verified. */
const meterRoutine: Work = {
  id: 'meter-routine',
  file: file('UsageMeter.css'),
  screen: 'Usage meter',
  title: 'Three values in the usage meter onto tokens',
  status: 'made',
  lines: [
    { selector: '.meter', property: 'gap', before: '4px', after: 'var(--space-1)' },
    { selector: '.meter__label', property: 'font-size', before: '0.75rem', after: 'var(--text-sm)' },
    { selector: '.meter__label', property: 'color', before: '#4a4a55', after: 'var(--color-text-secondary)' },
  ],
  basis: { kind: 'boundary', boundaries: [1, 4] },
  reason: 'Each value is exactly one token’s value.',
  checks: [
    { name: 'Token lint', state: 'passed', label: 'Passed', established: 'These lines name tokens now, and every token they name exists.' },
    { name: 'Visual baselines', state: 'passed', label: '0 of 2 frames moved', established: 'The seat count renders exactly as it did before.' },
    {
      name: 'Stories with axe',
      state: 'inconclusive',
      label: 'Inconclusive on 1 of 3',
      established: 'The stories render, and axe found no violation it could measure. On the Full story it couldn’t tell what is behind “47 of 50 seats”, which crosses the meter’s fill. It said the same on main.',
    },
  ],
  unchecked: 'Whether “47 of 50 seats” clears 4.5:1 where it crosses the fill. Nothing in this change could have altered it, and nothing has measured it.',
  commit: '2b7d8c1',
  frames: 2,
  stories: 3,
  history: [
    { at: '13:26', who: 'agent', text: 'Replaced 3 values with their tokens.' },
    { at: '13:27', who: 'agent', text: 'Ran the checks: the token lint passed, 0 of 2 frames moved. The axe check was inconclusive on 1 of 3 stories: it can’t tell what is behind the seat count. Same result on main.' },
    { at: '13:28', who: 'agent', text: 'Merged to main as 2b7d8c1. An inconclusive check doesn’t stop a change that moved no pixel; it’s listed as unresolved instead.' },
  ],
};

const settingsRoutine: Work = {
  id: 'settings-routine',
  file: file('BillingSettings.css'),
  screen: 'Billing settings',
  title: 'Five values in billing settings onto tokens',
  status: 'made',
  lines: [
    { selector: '.settings__group', property: 'margin-bottom', before: '24px', after: 'var(--space-6)' },
    { selector: '.settings__field', property: 'font-size', before: '0.8125rem', after: 'var(--text-md)' },
    { selector: '.settings__hint', property: 'color', before: '#4a4a55', after: 'var(--color-text-secondary)' },
    { selector: '.settings__input', property: 'border-color', before: '#8c8c96', after: 'var(--color-border-control)' },
    { selector: '.settings__input', property: 'border-radius', before: '3px', after: 'var(--radius-sm)' },
  ],
  basis: { kind: 'boundary', boundaries: [1, 4] },
  reason: 'Each value is exactly one token’s value.',
  checks: cleanChecks(2, 2),
  commit: 'c83a0f5',
  frames: 2,
  stories: 2,
  history: [
    { at: '13:31', who: 'agent', text: 'Replaced 5 values with their tokens.' },
    { at: '13:32', who: 'agent', text: 'Ran the checks: the token lint passed, 0 of 2 frames moved, 2 of 2 stories passed.' },
    { at: '13:33', who: 'agent', text: 'Merged to main as c83a0f5.' },
  ],
};

/* ------------------------------------------------------------------------
   Where it stopped
   ------------------------------------------------------------------------ */

/* The answers to "what does this red mean". The same two for every
   struck-through value, so a rule can choose one for all of them. */
function struck(pattern: Pattern): Option[] {
  if (pattern === 'removed') {
    return [
      { id: 'diff', label: 'Use the diff remove ink', after: ['var(--color-diff-remove-ink)'], effect: 'The struck value takes --color-diff-remove-ink.', recommended: true },
      { id: 'danger', label: 'Use danger', after: ['var(--color-danger)'], effect: 'The struck value takes --color-danger.' },
    ];
  }
  return [
    {
      id: 'diff',
      label: 'Use the diff pair',
      after: ['var(--color-diff-remove-ink)', 'var(--color-diff-add-ink)'],
      effect: 'The old value takes --color-diff-remove-ink and the new one --color-diff-add-ink.',
      recommended: true,
    },
    { id: 'danger', label: 'Use danger and success', after: ['var(--color-danger)', 'var(--color-success)'], effect: 'The old value takes --color-danger and the new one --color-success.' },
  ];
}

const EVIDENCE_TOKENS = 'tokens.css says the diff pair is for “a line added and a line removed”.';

/* The red every struck-through value shares, where its meaning was never in
   doubt: the status “Payment failed”, which the agent gave --color-danger on
   its own (paymentFailed, above). A question about what a struck value means
   shows it beside the value, so the person sees one red with two meanings
   before reading the name of a token. */
const FAILED: Twin = {
  text: 'Payment failed',
  means: 'A failure',
  screen: 'Payment history',
  token: '--color-danger',
  role: 'danger',
};

/* Every struck-through value was tried with both names before it was held or
   asked about: the two names are one red, so the checks come back the same
   with each, which is the whole reason it cannot choose. */
function struckQuestion(pattern: Pattern, subject: string, ask: string, found: string, recommendation: string, frames: number, stories: number): Question {
  return {
    kind: 'intent',
    ask,
    found,
    gap: 'Nothing failed. The checks can prove the interface is stable, but they can’t tell us whether these two reds mean the same thing. That matters the next time the danger style changes.',
    means: pattern === 'replaced' ? 'A replaced value' : 'A removed value',
    later: `If both reds share the danger token, both change. If ${subject} has its own ${pattern === 'replaced' ? 'replacement' : 'removal'} token, only the actual failure changes.`,
    evidence:
      pattern === 'replaced'
        ? [
            { for: 'A replaced value', says: `The old value is struck through beside the one that replaced it, and ${EVIDENCE_TOKENS}` },
            { for: 'A failure', says: 'It is the red of “Payment failed” in the payment history, which the agent made --color-danger under boundary 2.' },
          ]
        : [
            { for: 'A removed value', says: `The line is struck through and nothing took its place, and ${EVIDENCE_TOKENS}` },
            { for: 'A failure', says: 'It is the red of “Payment failed”, which is --color-danger.' },
          ],
    recommendation,
    paused: [5],
    options: struck(pattern),
    pattern,
    twin: FAILED,
    tried: cleanChecks(frames, stories),
  };
}

const activityRed: Work = {
  id: 'activity-red',
  file: file('BillingActivity.css'),
  screen: 'Billing activity',
  title: 'The plan change in the billing activity takes the diff pair',
  status: 'asking',
  sample: { label: 'Plan', old: 'Starter', replacement: 'Growth' },
  lines: [
    { selector: '.activity__old', property: 'color', before: '#b42318' },
    { selector: '.activity__new', property: 'color', before: '#1f7a3f' },
  ],
  question: struckQuestion(
    'replaced',
    'the plan change',
    'Is the red in a plan change a failure, or a value that was replaced?',
    'A plan change shows the old plan in red with a line through it, and the new plan in green.',
    'A plan change isn’t a failure; it shows the value that was replaced. If danger’s red is ever made louder, a past plan change shouldn’t follow it.',
    2,
    2,
  ),
  frames: 2,
  stories: 2,
  history: [
    { at: '13:09', who: 'agent', text: 'Tried both names in turn. With each, the token lint passed, 0 of 2 frames moved and 2 of 2 stories passed.' },
    { at: '13:09', who: 'agent', text: 'Asked: two tokens are this red, and the evidence for which one it means conflicts (boundary 5).' },
  ],
};

/* Held behind the first question, because the same answer may settle them:
   three are the same case on other screens, and one is close but not the
   same, a line struck through with nothing beside it. */
function held(
  w: Pick<Work, 'id' | 'file' | 'screen' | 'title' | 'sample' | 'lines' | 'frames' | 'stories'>,
  pattern: Pattern,
  subject: string,
  ask: string,
  found: string,
  at: string,
  recommendation: string,
): Work {
  return {
    ...w,
    status: 'waiting',
    waitsOn: 'activity-red',
    question: struckQuestion(pattern, subject, ask, found, recommendation, w.frames, w.stories),
    history: [
      { at, who: 'agent', text: `Tried both names in turn. With each, the token lint passed, 0 of ${w.frames} frames moved and ${w.stories} of ${w.stories} stories passed.` },
      { at, who: 'agent', text: 'Held: the same two tokens as the billing activity’s question. The answer to that one may settle it.' },
    ],
  };
}

const invoiceAmount = held(
  {
    id: 'invoice-amount',
    file: file('InvoiceDetail.css'),
    screen: 'Invoice detail',
    title: 'The changed amount on an invoice takes the diff pair',
    sample: { label: 'Amount', old: '$1,200.00', replacement: '$1,450.00' },
    lines: [
      { selector: '.invoice__amount-old', property: 'color', before: '#b42318' },
      { selector: '.invoice__amount-new', property: 'color', before: '#1f7a3f' },
    ],
    frames: 4,
    stories: 4,
  },
  'replaced',
  'the changed amount',
  'Is the red in a changed amount a failure, or a value that was replaced?',
  'An edited invoice shows the old amount in red with a line through it, and the new amount in green.',
  '13:12',
  'An edited amount isn’t a failure; it is the same case as the plan change.',
);

const invoiceRemoved = held(
  {
    id: 'invoice-removed',
    file: file('InvoiceDetail.css'),
    screen: 'Invoice detail',
    title: 'The removed line item on an invoice takes the diff remove ink',
    sample: { label: 'Onboarding fee', old: '$200.00' },
    lines: [{ selector: '.invoice__line--removed', property: 'color', before: '#b42318' }],
    frames: 4,
    stories: 4,
  },
  'removed',
  'the removed line item',
  'Is the red on a removed line item a failure, or a value that was removed?',
  'An edited invoice shows a removed line item in red with a line through it. Nothing replaced it.',
  '13:12',
  'A line taken off an invoice is what the diff’s remove ink is for, and removing a fee isn’t a failure.',
);

const planSeats = held(
  {
    id: 'plan-seats',
    file: file('PlanCard.css'),
    screen: 'Plan card',
    title: 'The changed seat count on the plan card takes the diff pair',
    sample: { label: 'Seats', old: '50', replacement: '45' },
    lines: [
      { selector: '.plan__seats-old', property: 'color', before: '#b42318' },
      { selector: '.plan__seats-new', property: 'color', before: '#1f7a3f' },
    ],
    frames: 2,
    stories: 2,
  },
  'replaced',
  'the changed seat count',
  'Is the red in a changed seat count a failure, or a value that was replaced?',
  'After a seat change, the plan card shows the old count in red with a line through it, and the new one in green.',
  '13:20',
  'A seat change isn’t a failure; it is the same case as the plan change.',
);

const settingsEmail = held(
  {
    id: 'settings-email',
    file: file('BillingSettings.css'),
    screen: 'Billing settings',
    title: 'The changed billing email takes the diff pair',
    sample: { label: 'Billing email', old: 'ap@northwind.example', replacement: 'billing@northwind.example' },
    lines: [
      { selector: '.settings__email-old', property: 'color', before: '#b42318' },
      { selector: '.settings__email-new', property: 'color', before: '#1f7a3f' },
    ],
    frames: 2,
    stories: 2,
  },
  'replaced',
  'the changed billing email',
  'Is the red in a changed billing email a failure, or a value that was replaced?',
  'The settings history shows the old billing email in red with a line through it, and the new one in green.',
  '13:31',
  'A changed email isn’t a failure; it is the same case as the plan change.',
);

/* Outside the delegation: the agent knows exactly what to do, and may not.
   The fix is a new token, and the token layer is shared by every screen. */
const meterRadius: Work = {
  id: 'meter-radius',
  file: file('UsageMeter.css'),
  screen: 'Usage meter',
  title: 'The meter’s round ends use a new token, --radius-full',
  status: 'asking',
  lines: [{ selector: '.meter__track', property: 'border-radius', before: '999px' }],
  question: {
    kind: 'scope',
    ask: 'Add a token for a fully round corner?',
    found: 'The meter’s track has round ends, written as 999px. No token has that value. The fix is clear: add --radius-full: 999px to tokens.css and tokens.ts, and use it here. Nothing would move.',
    gap: 'A token belongs to the system, not to this screen: every screen, and every agent after this one, will reach for it. The token layer is outside this delegation.',
    recommendation: 'A fully round end is a shape Relay draws and has no name for, and the lint will report this line until it has one.',
    paused: [6, 7],
    options: [
      {
        id: 'add',
        label: 'Add --radius-full, this once',
        after: ['var(--radius-full)'],
        effect: 'It adds --radius-full: 999px to tokens.css and tokens.ts, uses it here, runs the checks, and merges.',
        recommended: true,
        adds: [
          { file: 'src/tokens/tokens.css', text: '--radius-full: 999px;' },
          { file: 'src/tokens/tokens.ts', text: "'--radius-full'," },
        ],
      },
      { id: 'leave', label: 'Leave it as written', after: ['999px'], effect: 'The line stays as it is, and the lint keeps reporting it.', leaves: true },
    ],
    note: 'Allowing this once doesn’t widen the delegation. The next token it needs, it will ask about.',
  },
  frames: 2,
  stories: 3,
  history: [{ at: '13:26', who: 'agent', text: 'Stopped: no token is 999px (boundary 6), and adding one is outside this delegation (boundary 7).' }],
};

export function initialDelegation(): DelegationState {
  return {
    brief: {
      title: 'Bring the billing screens onto the token layer',
      request:
        'The token lint reports 36 literals in src/product/billing/, the screens that came over from the old billing app. Move them onto the token layer. Merge what doesn’t move a pixel, and ask me about the rest.',
      by: dana,
      agent: { name: 'Claude Code', run: 'run_01K6M4' },
      repo: 'relay/web',
      area: AREA,
      delegatedAt: '2026-10-01T13:04:00-05:00',
      lastActive: '13:34',
      literals: 36,
    },
    boundaries,
    work: [
      activityRed,
      meterRadius,
      settingsRoutine,
      meterRoutine,
      planRoutine,
      paymentFailed,
      paymentRoutine,
      invoiceRoutine,
      activityRoutine,
      invoiceAmount,
      invoiceRemoved,
      planSeats,
      settingsEmail,
    ],
    rules: [],
    clock: 0,
  };
}

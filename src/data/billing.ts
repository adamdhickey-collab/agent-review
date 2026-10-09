import { cleanChecks, RULE_EXCLUDES, type Addition, type Boundary, type Check, type DelegationState, type Gathered, type Option, type Pattern, type Question, type RuleDraft, type Twin, type Work } from './delegation';

/* The delegated run the product opens on: Claude Code moving Relay's billing
   screens onto the token layer. SIMULATED THROUGHOUT. Unlike rv-2041 and
   rv-2042 in scenario.ts, which are transcribed from real runs, nothing here
   was run: the billing screens, the run, its times, its commits and the
   checks' figures are written to be internally consistent and are played
   back the same way every time. The tokens are real (src/tokens/tokens.css),
   and so are the two facts the scenario turns on: --color-danger and
   --color-diff-remove-ink are both #b42318, and --color-success and
   --color-diff-add-ink are both #1f7a3f, so a swap to either name moves no
   pixel and every check passes whichever is chosen. That is why the agent
   cannot settle the red by its checks; what it proposes once it has
   stopped (THE TRADE-OFF, below) is a visible change either way. What
   people who use the billing screens rely on is scenario context the agent
   says it cannot know; nothing here claims research or usage data.

   The arithmetic, which the stories assert: the lint reported 36 literals.
   Seven changes the agent made on its own hold 26 of them; two questions
   hold 3; four changes waiting on the first question hold the other 7. */

/** The two cases a struck-through value can be; the shared-table run has the third. */
type Struck = Exclude<Pattern, 'shared'>;

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

/* THE TRADE-OFF (2026-10-09). Until today the answers to "what does this red
   mean" were two token names that drew the same pixels, one recommended,
   and nothing a person could weigh: the right answer was obvious, so the
   stop proved nothing about judgment. Now the agent finds the same thing
   (one red, a failure's and a replaced value's) and proposes two fixes that
   are both defensible and both cost something:

   - Separate the meanings. Failures keep the red. A replaced or removed
     value turns neutral, with an icon and a label that say what happened.
     Red means one thing, and a familiar signal changes.
   - Keep the red for now. Both stay red, and the value gains the same icon
     and label, so it reads differently from a failure without changing
     color. Nothing changes under anyone's habits, and the design system
     carries a written exception until a neutral style has been tested.

   The agent recommends the first and says what it can't determine: whether
   the people who use these screens rely on the red to catch a change when
   it matters. That is scenario context the agent cannot check, so it is a
   question, never a finding, and nothing here claims research. Asked for
   evidence, it gathers what a repository can tell (where the red is used,
   what each fix would change, what depends on it) and says plainly what it
   can't, with a way to find out that nobody has run.

   Either direction is real work: a mapping, a label, a task left open, and
   a decision record with the person's reason. Neither is an error state. */

/** Each case of a struck value, in the words its card and its record use. */
const STRUCK_MEANS: Record<Struck, { means: string; says: string; noun: string; label: string }> = {
  replaced: { means: 'Replaced value', says: 'Red means this value was replaced.', noun: 'Replacement', label: 'Replaced' },
  removed: { means: 'Removed value', says: 'Red means this value was removed.', noun: 'Removal', label: 'Removed' },
};

/** Where a struck value is, and what a person watching that screen would be noticing: "a plan change". */
interface Case {
  pattern: Struck;
  file: string;
  screen: string;
  noticing: string;
  frames: number;
  stories: number;
}

/* What the agent gathers when a person asks for evidence. The same for every
   struck value, because it is the same red. Counted from the scenario: the
   five struck values are on four screens whose frames and stories add to
   ten and ten. */
const GATHERED: Gathered = {
  uses: [
    { what: 'The failure red, --color-danger', places: '1 place: “Payment failed” in the payment history.' },
    {
      what: 'The same red, hard-coded as #b42318',
      places:
        '5 places on 4 screens: the old plan in billing activity, the old amount and a removed line item in the invoice detail, the old seat count on the plan card, and the old billing email in billing settings.',
    },
  ],
  changes: [
    { direction: 'Separate the meanings', text: 'All 5 turn neutral and gain a label. 10 visual baselines move.' },
    { direction: 'Keep the red for now', text: 'All 5 gain a label and stay red. 10 visual baselines move, by the label only.' },
  ],
  depends: ['Nothing outside the billing screens uses #b42318 as a literal.', '10 stories cover the five values, and every one would be re-run.'],
  unverified: [
    'Whether anyone relies on the red to spot a change. There is no usage data or research about it in the repository.',
    'Whether a plan change ever needs someone to act on it quickly.',
  ],
  validation:
    'Show both styles to five people who use billing activity, in a feed of 20 rows. Ask them to find every plan change, and note any they take for a failure.',
};

const markup = (c: Case) => c.file.replace(/\.css$/, '.tsx');
const EXCEPTIONS = 'docs/design-system/exceptions.md';

/* The checks, run with each direction in place in turn. Both change what the
   value looks like, on purpose, so the visual check says it moved rather
   than calling that a pass; the lint and axe pass with either. */
function tradeoffChecks(c: Case): Check[] {
  return [
    { name: 'Token lint', state: 'passed', label: 'Passed with both', established: 'Either direction names tokens, and every token it names exists.' },
    { name: 'Stories with axe', state: 'passed', label: `${c.stories} of ${c.stories} passed with both`, established: 'The neutral ink, the red and the label each clear 4.5:1.' },
    {
      name: 'Visual baselines',
      state: 'changed',
      label: `${c.frames} of ${c.frames} frames moved with both`,
      established: 'Only this value moves, as each direction intends. Nothing else on the screen does.',
    },
  ];
}

/* The two directions, and asking for evidence first. */
function directions(c: Case, gathered: boolean): Option[] {
  const m = STRUCK_MEANS[c.pattern];
  const replaced = c.pattern === 'replaced';
  const label: Addition = { file: markup(c), header: 'a label', text: `<Badge icon="swap">${m.label}</Badge>` };
  const ran = (what: string) =>
    `Ran the checks: the token lint passed, ${c.frames} of ${c.frames} frames moved (${what}, as you decided, re-recorded), ${c.stories} of ${c.stories} stories passed.`;
  const checks = (moved: string): Check[] => [
    { name: 'Token lint', state: 'passed', label: 'Passed', established: 'These lines name tokens now, and every token they name exists.' },
    { name: 'Visual baselines', state: 'changed', label: `${c.frames} of ${c.frames} frames moved`, established: `${moved} Re-recorded, as you decided.` },
    { name: 'Stories with axe', state: 'passed', label: `${c.stories} of ${c.stories} passed`, established: 'Every story renders, and axe found no violation. The label and its ink clear 4.5:1.' },
  ];

  const separate: Option = {
    id: 'separate',
    title: 'Separate the meanings',
    label: 'Separate the meanings',
    recommended: true,
    outcome: `Failures stay red. The ${m.label.toLowerCase()} value turns neutral, with an icon and a “${m.label}” label.`,
    effect: replaced
      ? `Failures keep --color-danger. The struck value takes --color-text-muted, the new one --color-text, and a “${m.label}” label goes before them.`
      : `Failures keep --color-danger. The struck value takes --color-text-muted, and a “${m.label}” label goes before it.`,
    after: replaced ? ['var(--color-text-muted)', 'var(--color-text)'] : ['var(--color-text-muted)'],
    adds: [label],
    benefits: ['Red means one thing: a failure.', `A ${replaced ? 'change' : 'removal'} no longer looks like something went wrong.`, 'A clear rule the design system can keep.'],
    risks: ['Changes a signal people may rely on.', `A ${c.noticing} may be missed at first.`, 'Needs checking with the people who use it.'],
    plan: [
      'Keep --color-danger for failures only.',
      `Map the ${m.label.toLowerCase()} value to a neutral style: --color-text-muted, struck through.`,
      `Add a “${m.label}” label and icon, so it says what happened in words.`,
      `Open a task to check the new style with people who use the ${c.screen.toLowerCase()} screen.`,
      'Record your decision and your reason.',
    ],
    done: [
      'Kept --color-danger for failures only.',
      `Mapped the ${m.label.toLowerCase()} value to a neutral style: --color-text-muted, struck through.`,
      `Added a “${m.label}” label and icon.`,
      `Opened a task: check the new style with people who use the ${c.screen.toLowerCase()} screen.`,
      'Recorded your decision and your reason.',
    ],
    decision: {
      tradeoff: 'One meaning for red, over a signal people already know.',
      risk: `People who look for red may miss a ${c.noticing} until they learn the new style.`,
      followUp: `Check the neutral style with people who use the ${c.screen.toLowerCase()} screen, before it reaches more screens.`,
      reason: `Red should mean something went wrong. A ${c.noticing} is routine, and the label says what it is.`,
    },
    then: {
      checks: checks(`Only the ${m.label.toLowerCase()} value moved: neutral now, with its label.`),
      unchecked: `Whether people who use the ${c.screen.toLowerCase()} screen still notice a ${c.noticing} in its neutral style. No check can tell; the follow-up asks them.`,
      history: [
        'Kept --color-danger for failures only.',
        `Mapped the struck value to the neutral style: --color-text-muted${replaced ? ', and --color-text for the new one' : ''}.`,
        `Added the “${m.label}” label and its icon.`,
        ran('the value, now neutral'),
        `Opened a follow-up: check the neutral style with people who use the ${c.screen.toLowerCase()} screen.`,
        'Recorded your decision and your reason.',
      ],
      ruled: [`Mapped the struck value to the neutral style, and added the “${m.label}” label.`, ran('the value, now neutral')],
    },
    rule: KEEP_APART,
  };

  const keep: Option = {
    id: 'keep',
    title: 'Keep the red for now',
    label: 'Keep the red for now',
    outcome: `Both stay red. The ${m.label.toLowerCase()} value gains the same icon and “${m.label}” label, so it doesn’t read as a failure.`,
    effect: replaced
      ? `The struck value takes --color-danger and the new one --color-success, as they draw today, a “${m.label}” label goes before them, and the exception is written down.`
      : `The struck value takes --color-danger, as it draws today, a “${m.label}” label goes before it, and the exception is written down.`,
    after: replaced ? ['var(--color-danger)', 'var(--color-success)'] : ['var(--color-danger)'],
    adds: [label, { file: EXCEPTIONS, header: 'an exception', text: `- Billing: a ${m.label.toLowerCase()} value may stay red, with a “${m.label}” label, until a neutral style is tested.` }],
    benefits: ['Keeps the signal people know.', 'No sudden change in the middle of someone’s work.', 'The label says what happened without relying on color.'],
    risks: ['Red still means two things.', 'Needs a written exception to the design system.', 'The real fix is postponed, not made.'],
    plan: [
      'Keep the red for now, on --color-danger, as it draws today.',
      `Add a “${m.label}” label and icon, so it doesn’t read as a failure.`,
      'Write the exception into the design system’s list of exceptions.',
      'Open a task to review the exception once a neutral style is tested.',
      'Record your decision and your reason.',
    ],
    done: [
      'Kept the red for now, on --color-danger, as it draws today.',
      `Added a “${m.label}” label and icon.`,
      'Wrote the exception into the design system’s list of exceptions.',
      'Opened a task: review the exception once a neutral style is tested.',
      'Recorded your decision and your reason.',
    ],
    decision: {
      tradeoff: 'A familiar signal now, over one meaning for red.',
      risk: `Red still means two things, so a ${c.noticing} can still be read as a failure.`,
      followUp: `Review this exception once a neutral style has been tested with people who use the ${c.screen.toLowerCase()} screen.`,
      reason: 'Familiarity matters more right now. Keep the red until a neutral style has been tested with the people who use it.',
    },
    then: {
      checks: checks(`Only the label moved in; the ${m.label.toLowerCase()} value is the red it was.`),
      unchecked: `Whether the label is enough to tell a ${c.noticing} from a failure at a glance. No check can tell; the review task asks.`,
      history: [
        'Kept the struck value on --color-danger, as it draws today.',
        `Added the “${m.label}” label and its icon.`,
        `Wrote the exception into ${EXCEPTIONS}.`,
        ran('the label'),
        'Opened a follow-up: review the exception once a neutral style is tested.',
        'Recorded your decision and your reason.',
      ],
      ruled: [`Kept the struck value red, and added the “${m.label}” label, under the exception you wrote.`, ran('the label')],
    },
    rule: KEEP_RED,
  };

  if (gathered) return [separate, keep];
  return [
    separate,
    keep,
    {
      id: 'evidence',
      title: 'Request evidence',
      label: 'Request evidence',
      effect: 'It looks up where this red is used, what each direction would change and what it can’t verify, and asks again. Nothing changes in the code.',
      after: [],
      asks: struckQuestion(c, true),
      then: {
        history: [
          'Searched the billing screens for #b42318 and --color-danger, and listed what each direction would change.',
          'Looked for usage data or research about the red. Found none in the repository.',
        ],
        notice: 'Nothing decided yet. The evidence doesn’t settle it: nothing in the repository says whether people rely on the red. It’s asking again, with what it found.',
      },
    },
  ];
}

/* What either direction becomes if a person keeps it: where it applies, what
   it leaves out, and why, so the rule can be read, and revoked, by someone
   who wasn't there. Its why is the person's reason once they decide
   (delegation.ts); these are what it says when a story makes one without. */
const KEEP_APART: RuleDraft = {
  scope: 'Struck-through values on the billing screens',
  excludes: RULE_EXCLUDES,
  why: 'Red should mean something went wrong, and a struck value is a change, not a failure.',
};
const KEEP_RED: RuleDraft = {
  scope: 'Struck-through values on the billing screens',
  excludes: RULE_EXCLUDES,
  why: 'People may depend on the red today. Keep it, labelled, until a neutral style has been tested.',
};

/* The red every struck value shares, where its meaning was never in doubt:
   the status “Payment failed”, which the agent gave --color-danger on its
   own (paymentFailed, above). */
const FAILED: Twin = {
  text: 'Payment failed',
  means: 'Failure',
  screen: 'Payment history',
  says: 'Red means something went wrong.',
  token: '--color-danger',
  role: 'danger',
};

/* Every struck value asks the same question, because it is the same red,
   and every one was tried with both directions in place before it asked. */
function struckQuestion(c: Case, gathered = false): Question {
  const m = STRUCK_MEANS[c.pattern];
  return {
    kind: 'intent',
    ask: 'Separate the two meanings of red, or keep the familiar signal?',
    found: FOUND[c.pattern],
    gap: `The checks pass either way. Which trade-off is acceptable depends on how people use the ${c.screen.toLowerCase()}, which no check can see.`,
    means: m.means,
    says: m.says,
    noun: m.noun,
    evidence: [
      { for: `A ${m.label.toLowerCase()} value`, says: `It is struck through${c.pattern === 'replaced' ? ' beside the value that replaced it' : ', and nothing took its place'}. Nothing failed.` },
      { for: 'A failure', says: 'It is the exact red of “Payment failed”, which the design system names --color-danger, for a failure.' },
      { for: 'A familiar signal', says: 'It came over from the old billing app with these screens, as a literal. That is all the repository says about who looks for it.' },
    ],
    recommendation: `The same red stands for a failure and a ${m.label.toLowerCase()} value. Separating them would make red mean one thing across the billing screens.`,
    unknown: `Whether people who use the ${c.screen.toLowerCase()} screen rely on the red to notice a ${c.noticing} during time-sensitive work. That could change this recommendation.`,
    inferred: 'The red came over from the old billing app, so the people who use these screens may be used to it.',
    gathered: gathered ? GATHERED : undefined,
    paused: [5],
    options: directions(c, gathered),
    pattern: c.pattern,
    twin: FAILED,
    tried: tradeoffChecks(c),
  };
}

const FOUND: Record<Struck, string> = {
  replaced: 'The lint reported this red as a literal, #b42318. Two tokens have that value: --color-danger, which the design system keeps for a failure, and --color-diff-remove-ink. Here it marks a value that was replaced, so either name would say something the other doesn’t.',
  removed: 'The lint reported this red as a literal, #b42318. Two tokens have that value: --color-danger, which the design system keeps for a failure, and --color-diff-remove-ink. Here it marks a line that was removed, so either name would say something the other doesn’t.',
};

const ACTIVITY: Case = { pattern: 'replaced', file: file('BillingActivity.css'), screen: 'Billing activity', noticing: 'plan change', frames: 2, stories: 2 };

const activityRed: Work = {
  id: 'activity-red',
  file: ACTIVITY.file,
  screen: ACTIVITY.screen,
  title: 'The plan change in the billing activity, and what its red means',
  status: 'asking',
  sample: { label: 'Plan', old: 'Starter', replacement: 'Growth' },
  lines: [
    { selector: '.activity__old', property: 'color', before: '#b42318' },
    { selector: '.activity__new', property: 'color', before: '#1f7a3f' },
  ],
  question: struckQuestion(ACTIVITY),
  frames: 2,
  stories: 2,
  history: [
    { at: '13:09', who: 'agent', text: 'Two tokens are this red. Tried both, and a neutral style with a label: the lint and axe pass with each. Only the plan change moves.' },
    { at: '13:09', who: 'agent', text: 'Asked: the red means a failure elsewhere, and here a plan that was replaced (boundary 5).' },
  ],
};

/* Held behind the first question, because the same decision may settle
   them: three are the same case on other screens, and one is close but not
   the same, a line struck through with nothing beside it. */
function held(
  w: Pick<Work, 'id' | 'file' | 'screen' | 'title' | 'sample' | 'lines' | 'frames' | 'stories'>,
  c: Pick<Case, 'pattern' | 'noticing'>,
  at: string,
): Work {
  return {
    ...w,
    status: 'waiting',
    waitsOn: 'activity-red',
    question: struckQuestion({ ...c, file: w.file, screen: w.screen, frames: w.frames, stories: w.stories }),
    history: [
      { at, who: 'agent', text: 'Tried both directions: the lint and axe pass with each. Only this value moves.' },
      { at, who: 'agent', text: 'Held: the same red as the billing activity’s question. The decision there may settle it.' },
    ],
  };
}

const invoiceAmount = held(
  {
    id: 'invoice-amount',
    file: file('InvoiceDetail.css'),
    screen: 'Invoice detail',
    title: 'The changed amount on an invoice, and what its red means',
    sample: { label: 'Amount', old: '$1,200.00', replacement: '$1,450.00' },
    lines: [
      { selector: '.invoice__amount-old', property: 'color', before: '#b42318' },
      { selector: '.invoice__amount-new', property: 'color', before: '#1f7a3f' },
    ],
    frames: 4,
    stories: 4,
  },
  { pattern: 'replaced', noticing: 'changed amount' },
  '13:12',
);

const invoiceRemoved = held(
  {
    id: 'invoice-removed',
    file: file('InvoiceDetail.css'),
    screen: 'Invoice detail',
    title: 'The removed line item on an invoice, and what its red means',
    sample: { label: 'Onboarding fee', old: '$200.00' },
    lines: [{ selector: '.invoice__line--removed', property: 'color', before: '#b42318' }],
    frames: 4,
    stories: 4,
  },
  { pattern: 'removed', noticing: 'removed line item' },
  '13:12',
);

const planSeats = held(
  {
    id: 'plan-seats',
    file: file('PlanCard.css'),
    screen: 'Plan card',
    title: 'The changed seat count on the plan card, and what its red means',
    sample: { label: 'Seats', old: '50', replacement: '45' },
    lines: [
      { selector: '.plan__seats-old', property: 'color', before: '#b42318' },
      { selector: '.plan__seats-new', property: 'color', before: '#1f7a3f' },
    ],
    frames: 2,
    stories: 2,
  },
  { pattern: 'replaced', noticing: 'seat change' },
  '13:20',
);

const settingsEmail = held(
  {
    id: 'settings-email',
    file: file('BillingSettings.css'),
    screen: 'Billing settings',
    title: 'The changed billing email, and what its red means',
    sample: { label: 'Billing email', old: 'ap@northwind.example', replacement: 'billing@northwind.example' },
    lines: [
      { selector: '.settings__email-old', property: 'color', before: '#b42318' },
      { selector: '.settings__email-new', property: 'color', before: '#1f7a3f' },
    ],
    frames: 2,
    stories: 2,
  },
  { pattern: 'replaced', noticing: 'changed email' },
  '13:31',
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
        grants: true,
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
    edge: 'it needs a new token',
  },
  frames: 2,
  stories: 3,
  history: [{ at: '13:26', who: 'agent', text: 'Stopped: no token is 999px (boundary 6), and adding one is outside this delegation (boundary 7).' }],
};

export function initialDelegation(): DelegationState {
  return {
    brief: {
      id: 'billing',
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
    decisions: [],
    clock: 0,
  };
}

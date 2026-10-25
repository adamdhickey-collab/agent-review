import { cleanChecks, type Boundary, type Check, type DelegationState, type Gathered, type Line, type Option, type Pattern, type Question, type RuleDraft, type Sketch, type Twin, type Work } from './delegation';

/* The delegated run the product opens on: Claude Code moving Relay's billing
   screens onto the design system, the values onto tokens and the controls
   onto the system's components. SIMULATED THROUGHOUT. Unlike rv-2041 and
   rv-2042 in scenario.ts, which are transcribed from real runs, nothing here
   was run: the billing screens, the run, its times, its commits and the
   checks' figures are written to be internally consistent and are played
   back the same way every time. The tokens are real (src/tokens/tokens.css),
   and so is the Button the question turns on (src/components/Button), with
   its four variants and none that draws an action as small grey text. That
   is why the agent cannot finish the job on "Cancel subscription" by its
   checks: every value on it is exactly a token's, so the lint, axe and the
   visual check pass whichever direction is chosen, and what decides it is
   whether cancelling should be easy to find, which the agent says it
   cannot know. Nothing here claims research or usage data.

   The arithmetic, which the stories assert: the lint reported 36 literals.
   Seven changes the agent made on its own hold 26 of them; two questions
   hold 4; three changes waiting on the first question hold the other 6. */

/** The two cases an action built by hand can be; the shared-table run has the third. */
type ByHand = Exclude<Pattern, 'shared'>;

const alex = { name: 'Alex Whitfield', role: 'Product design' };
const AREA = 'src/product/billing/';
const file = (name: string) => `${AREA}${name}`;

export const boundaries: Boundary[] = [
  { n: 1, group: 'own', text: 'Replace a literal with the token of the same value, and a control built by hand with the component that draws it the same way, on the billing screens.' },
  { n: 2, group: 'own', text: 'Where two tokens share a value, choose by what the element is, and say why.' },
  { n: 3, group: 'own', text: 'Run the checks, and fix a check its own change broke.' },
  { n: 4, group: 'own', text: 'Merge to main when the token lint passes and no frame moves a pixel.' },
  { n: 5, group: 'asks', text: 'When it’s unclear what an element is for, or the evidence for what it means conflicts.' },
  { n: 6, group: 'asks', text: 'When no token or component draws it as it is.' },
  { n: 7, group: 'outside', text: 'Changing the token layer, or how a shared component draws, which every screen reads.' },
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

/* THE TRADE-OFF (2026-10-21). Until today the judgment in this run was one
   red with two meanings, a failure's and a replaced plan's: a real
   question, and a small one, whose person's reason (support scans the feed
   for red) was a fact anyone near support could have supplied. Two rounds of
   cold reads that day preferred this: an action built by hand, small and
   grey, where every other action on the screen is the system's Button, and
   the action is "Cancel subscription".

   Every value on it is exactly a token's, so the lint has nothing to say,
   and the job says nothing should look different. The system's rule 1 says
   an action is a Button, and a Button would make cancelling as easy to find
   as changing the plan. So the agent proposes the faithful fix and says
   what it can't determine:

   - Add a quiet variant. The Button gains a fifth variant that draws the
     grey text exactly, with a story, the other four untouched, which is what
     rule 9 allows for a local need. Nothing moves, and the job keeps its
     promise. Any later agent can now make any action this quiet.
   - Make it a Button in its own change. The link stays as built, its values
     on tokens, under an exception with an end date, and a separate change
     owned by product design makes it a Button. Nothing moves in this change.
     Cancel stays hard to find until that one ships.

   The agent recommends the first, because the job asked for nothing
   visible, and says it can't tell whether cancel is quiet on purpose or who
   decides how easy it is to find. That is scenario context the agent cannot
   check, so it is a question, never a finding. Asked for evidence, it
   gathers what a repository can tell (every action built by hand on these
   screens, what each direction would change, the old app's history) and
   says plainly what it can't.

   Either direction is real work: a variant and its story, or an exception,
   a follow-up and a decision record with the person's reason. Neither is an
   error state. */

/** Where an action built by hand is, and the words its card and record use for it. */
interface Case {
  pattern: ByHand;
  file: string;
  screen: string;
  /** The words it shows: "Cancel subscription". */
  action: string;
  /** What it does when pressed, as a clause: "ends the subscription". */
  does: string;
  /** What a person does with it, as a verb: "cancel". */
  verb: string;
  /** What growth would count before and after: "cancellations". */
  measure: string;
  /** An action on the same screen the system's Button draws: "Change plan". */
  beside: string;
  /** Whether it has space above and below it of its own, a third literal. */
  padded?: boolean;
  frames: number;
  stories: number;
}

const markup = (c: Pick<Case, 'file'>) => c.file.replace(/\.css$/, '.tsx');
const EXCEPTIONS = 'docs/design-system/exceptions.md';
const DUE = 'Oct 15';

/* An action built by hand is the same three declarations wherever it is:
   the grey, the small size, and the space above and below it. Each is
   exactly a token's value, which is why the lint can't settle it. */
const AFTER: Record<string, string> = { color: 'var(--color-text-muted)', 'font-size': 'var(--text-sm)', 'padding-block': 'var(--space-1)' };
const byHand = (selector: string, padded = false): Line[] => [
  { selector, property: 'color', before: '#6a6a76' },
  { selector, property: 'font-size', before: '0.75rem' },
  ...(padded ? [{ selector, property: 'padding-block', before: '4px' }] : []),
];

/* What the agent gathers when a person asks for evidence: every action built
   by hand on the billing screens, counted from the scenario (two on the
   billing settings, two on the plan card), and what a repository can't say. */
const GATHERED: Gathered = {
  uses: [
    {
      what: 'Actions built by hand, small and gray',
      places: '4 places on 2 screens: “Cancel subscription” and “Remove card” in billing settings, and “Downgrade plan” and “Remove seats” on the plan card.',
    },
    { what: 'Actions drawn as the system’s Button', places: 'Every other action on both screens, from “Change plan” to “Add seats”.' },
  ],
  changes: [
    { direction: 'Add a quiet variant', text: 'All 4 become quiet Buttons, and the Button gains a fifth variant every screen can use. 0 visual baselines move.' },
    { direction: 'Make it a Button in its own change', text: 'This change moves 0 baselines. Each action’s own change moves the frames of its screen: 4, on 2 screens.' },
  ],
  depends: ['Nothing outside the billing screens draws an action this way.', 'A fifth Button variant would be there for every screen, and every agent, to use.'],
  unverified: [
    'Why cancel was made quiet. The old billing app’s history has the style in one commit, with no reason given.',
    'How many people look for cancel and give up. There is no usage data in the repository.',
  ],
  validation: 'Ask whoever owns cancelling why it is quiet, and count how many people open billing settings and then write to support about cancelling.',
};

/* The checks, run with each direction in place in turn. Neither moves a
   pixel in this change: a quiet Button draws exactly what the link drew,
   and the other direction leaves the link as it is. */
function tradeoffChecks(c: Case): Check[] {
  return [
    { name: 'Token lint', state: 'passed', label: 'Passed with both', established: 'Either direction names tokens, and every token it names exists.' },
    { name: 'Stories with axe', state: 'passed', label: `${c.stories} of ${c.stories} passed with both`, established: 'The gray clears 4.5:1 (it measures 5.3:1), as a link or as a quiet Button.' },
    { name: 'Visual baselines', state: 'passed', label: `0 of ${c.frames} frames moved with both`, established: 'Neither direction moves a pixel in this change.' },
  ];
}

/* The two directions, and asking for evidence first. */
function directions(c: Case, gathered: boolean): Option[] {
  const after = (lines: Line[]) => lines.map((l) => AFTER[l.property]);
  const lines = linesOf(c);
  const ran = `Ran the checks: the token lint passed, 0 of ${c.frames} frames moved, ${c.stories} of ${c.stories} stories passed.`;

  const quiet: Option = {
    id: 'quiet',
    title: 'Add a quiet variant',
    label: 'Add a quiet variant',
    recommended: true,
    outcome: `The Button gains a quiet variant that matches the gray text. “${c.action}” becomes a Button, and looks exactly as it does now.`,
    effect: `It adds a quiet variant to the Button, with a story, leaves the other four as they are, and makes “${c.action}” a quiet Button on its tokens. Nothing moves.`,
    after: after(lines),
    draws: { as: 'quiet' },
    adds: [
      { file: 'src/components/Button/Button.tsx', header: 'a new variant', text: "export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'quiet';" },
      { file: markup(c), header: 'the markup', text: `<Button variant="quiet">${c.action}</Button>` },
    ],
    benefits: ['Nothing visible changes, as the job asked.', 'Every action on the billing screens is the system’s.', 'Rule 9 allows it: a new variant, with a story, and the others untouched.'],
    risks: ['Any later agent can make any action this quiet.', `“${c.action}” stays hard to find, now as a supported style.`, 'Nobody decides how easy it should be to find.'],
    plan: [
      'Add a quiet variant to the Button, with a story, and leave the other four as they are.',
      `Make “${c.action}” a quiet Button, so it looks exactly as it does now.`,
      'Move its values onto tokens.',
      'Record your decision and your reason.',
    ],
    done: [
      'Added a quiet variant to the Button, with a story; the other four are as they were.',
      `Made “${c.action}” a quiet Button; it looks exactly as it did.`,
      'Moved its values onto tokens.',
      'Recorded your decision and your reason.',
    ],
    decision: {
      tradeoff: 'A job that changes nothing visible, over a system with no way to make an action hard to find.',
      risk: `Any later agent can make an action this quiet, and “${c.action}” stays hard to find.`,
      followUp: `Decide with whoever owns it how easy “${c.action}” should be to find.`,
      reason: 'The job was to change nothing visible. A quiet variant keeps that promise, and rule 9 allows it.',
    },
    then: {
      history: ['Added a quiet variant to the Button, with its story; the other four are as they were.', `Made “${c.action}” a quiet Button on its tokens.`, ran, 'Recorded your decision and your reason.'],
      ruled: [`Made “${c.action}” a quiet Button on its tokens, under your rule.`, ran],
    },
    rule: QUIET,
  };

  const own: Option = {
    id: 'own-change',
    title: 'Make it a Button in its own change',
    label: 'Make it a Button in its own change',
    outcome: `“${c.action}” stays as built in this change, under an exception that ends on ${DUE}. A separate change makes it a Button, owned by product design.`,
    effect: `It moves the link’s values onto tokens, leaves it as built under an exception that ends on ${DUE}, and opens the change that makes it a Button. Nothing moves in this change.`,
    after: after(lines),
    draws: { as: 'button', note: 'As its own change will draw it' },
    adds: [{ file: EXCEPTIONS, header: 'an exception', text: `- Billing: “${c.action}” stays a link built by hand until ${DUE}, when its own change makes it a Button. No quiet variant.` }],
    benefits: ['No action gets a supported way to be hard to find.', `How easy it is to ${c.verb} becomes a decision someone owns.`, 'This job still changes nothing visible.'],
    risks: [`“${c.action}” stays hard to find until its own change ships, on ${DUE}.`, 'One action stays outside the system for two weeks.', `Its own change may change how many people ${c.verb}.`],
    plan: [
      'Move the link’s values onto tokens, and leave it as built.',
      `Write the exception down, ending ${DUE}.`,
      `Open a follow-up to make “${c.action}” a Button, owned by product design, due ${DUE}.`,
      `Ask growth to count ${c.measure} before and after, to learn from. The change ships either way.`,
      'Record your decision and your reason.',
    ],
    done: [
      'Moved the link’s values onto tokens, and left it as built.',
      `Wrote the exception down, ending ${DUE}.`,
      `Opened a follow-up to make “${c.action}” a Button, owned by product design, due ${DUE}.`,
      `Asked growth to count ${c.measure} before and after. The change ships either way.`,
      'Recorded your decision and your reason.',
    ],
    decision: {
      tradeoff: 'A system with no way to make an action hard to find, over finishing every control in this job.',
      risk: `“${c.action}” stays hard to find until its own change ships, on ${DUE}.`,
      followUp: `Make “${c.action}” a Button in its own change, by ${DUE}. Product design owns it; growth counts ${c.measure} before and after, and it ships either way.`,
      reason: `How easy it is to ${c.verb} is a product decision, so it gets its own change. A quiet variant would let any agent make any action this hard to find.`,
    },
    then: {
      unchecked: `Whether making “${c.action}” a Button changes how many people ${c.verb}. No check can tell; growth counts it in its own change.`,
      open: `Make “${c.action}” a Button, by ${DUE}.`,
      history: [
        'Moved the link’s values onto tokens, and left it as built.',
        `Wrote the exception into ${EXCEPTIONS}, ending ${DUE}.`,
        ran,
        `Opened a follow-up: make “${c.action}” a Button, owned by product design, due ${DUE}. Growth counts ${c.measure} before and after; it ships either way.`,
        'Recorded your decision and your reason.',
      ],
      ruled: [`Moved the link’s values onto tokens and left it as built, under your rule: an exception ending ${DUE}, and its own change to make it a Button.`, ran],
    },
    rule: OWN_CHANGE,
  };

  if (gathered) return [quiet, own];
  return [
    quiet,
    own,
    {
      id: 'evidence',
      title: 'Request evidence',
      label: 'Request evidence',
      effect: 'It looks up every action built by hand on the billing screens, what each direction would change and what it can’t verify, and asks again. Nothing changes in the code.',
      after: [],
      asks: actionQuestion(c, true),
      then: {
        history: [
          'Searched the billing screens for actions built by hand, and listed what each direction would change.',
          'Looked for a reason in the old billing app’s history, and for usage data. Found neither in the repository.',
        ],
        notice: 'Nothing decided yet. The evidence doesn’t settle it: nothing in the repository says why the action is quiet. It’s asking again, with what it found.',
      },
    },
  ];
}

/* What either direction becomes if a person keeps it: where it applies, what
   it leaves out, and why, so the rule can be read, and revoked, by someone
   who wasn't there. Its why is the person's reason once they decide
   (delegation.ts); these are what it says when a story makes one without. */
const EXCLUDES = 'Actions that add or change something, links that go somewhere, shared components, and every screen outside billing.';
const SCOPE = 'Actions built by hand that end or reduce a subscription, on the billing screens';
const QUIET: RuleDraft = {
  where: 'On the billing screens',
  does: 'is a quiet Button, drawn as it looks today.',
  scope: SCOPE,
  excludes: EXCLUDES,
  why: 'The job was to change nothing visible, and a quiet variant keeps that promise.',
};
const OWN_CHANGE: RuleDraft = {
  where: 'On the billing screens',
  does: 'never gets a quiet variant: it stays as built, under an exception with an end date, until its own change makes it a Button.',
  scope: SCOPE,
  excludes: EXCLUDES,
  why: 'How easy it is to leave is a product decision. A quiet variant would let any agent make any action this hard to find.',
};

/* The screens as the preview draws them (delegation.ts, WHAT THE PREVIEW
   DRAWS). Northwind Traders is one of Relay's customers, made up with the
   run, and the rows agree with the run's own figures: Growth, 45 seats at
   $30 a seat, renewing on Nov 1, paid with a Visa ending 4242. The actions
   the system already draws are its Button; the one each change asks about
   is not in these rows: the row marked `focus` is where the preview puts
   the change's own sample, drawn with the change's own declarations. */
const NORTHWIND = 'Northwind Traders';

const SKETCHES = {
  settings: {
    kind: 'rows',
    title: 'Billing settings',
    subtitle: NORTHWIND,
    rows: [
      { label: 'Plan', value: 'Growth', meta: '45 seats · renews Nov 1', action: 'Change plan' },
      { label: 'Payment method', value: 'Visa ending 4242', action: 'Update card' },
      { label: 'Invoices', meta: 'Sent to billing@northwind.example', action: 'Download invoices' },
      { label: 'Subscription', meta: 'Cancelling ends it on Nov 1', focus: true },
    ],
  },
  settingsCard: {
    kind: 'rows',
    title: 'Billing settings',
    subtitle: NORTHWIND,
    rows: [
      { label: 'Plan', value: 'Growth', meta: '45 seats · renews Nov 1', action: 'Change plan' },
      { label: 'Payment method', value: 'Visa ending 4242', action: 'Update card' },
      { label: 'Saved card', meta: 'Removing it leaves no card on file', focus: true },
      { label: 'Invoices', meta: 'Sent to billing@northwind.example', action: 'Download invoices' },
    ],
  },
  planDowngrade: {
    kind: 'rows',
    title: 'Plan',
    subtitle: 'Growth · billed monthly',
    rows: [
      { label: 'Growth', value: '$30 per seat', action: 'Upgrade plan', focus: true },
      { label: 'Seats', value: '45', action: 'Add seats' },
      { label: 'Renews', value: 'Nov 1' },
    ],
  },
  planSeats: {
    kind: 'rows',
    title: 'Plan',
    subtitle: 'Growth · billed monthly',
    rows: [
      { label: 'Growth', value: '$30 per seat', action: 'Upgrade plan' },
      { label: 'Seats', value: '45', action: 'Add seats', focus: true },
      { label: 'Renews', value: 'Nov 1' },
    ],
  },
  /* The seat count the meter routine's axe result is about, "47 of 50 seats". */
  meter: { kind: 'meter', title: 'Usage', subtitle: 'Growth plan · October', label: 'Seats', used: 47, of: 50, unit: 'seats' },
} satisfies Record<string, Sketch>;

/* The action beside it that the system's Button already draws, whose
   meaning was never in question: the preview marks it beside the one asked
   about, so a person sees the two side by side before reading a line. */
const besideOf = (c: Case): Twin => ({
  text: c.beside,
  means: 'System Button',
  tag: 'The system’s Button',
  screen: c.screen,
  says: `Every other action on the ${c.screen.toLowerCase()} is the system’s Button.`,
  token: '<Button variant="secondary">',
});

/* The class each line is written against: the screen's block and the action's words, `.settings__cancel-subscription`. */
const selectorOf = (c: Case) =>
  `.${c.file.split('/').pop()!.replace(/\.css$/, '').replace(/^Billing|Card$/g, '').toLowerCase()}__${c.action.toLowerCase().replace(/\s+/g, '-')}`;
const linesOf = (c: Case) => byHand(selectorOf(c), c.padded);

/* Every action built by hand asks the same question, because it is the same
   style, and every one was tried with both directions in place before it asked. */
function actionQuestion(c: Case, gathered = false): Question {
  const n = linesOf(c).length;
  return {
    kind: 'intent',
    ask: `Keep “${c.action}” looking as it does, or make it a Button on purpose?`,
    found: `The lint reported ${n} literals on “${c.action}”, and each is exactly a token’s value. But it is a link built by hand, small and gray, where every other action on the ${c.screen.toLowerCase()} is the system’s Button, and rule 1 of the agent’s skill says an action is a Button. As a Button it would be as easy to find as “${c.beside}”, in a job meant to change nothing visible. Kept as it looks, it needs a variant the Button doesn’t have.`,
    gap: `The checks pass either way, and neither direction moves a pixel in this change. Whether “${c.action}” should be easy to find is a product decision, which no check can see.`,
    means: 'Hand-built action',
    says: 'Small gray text, built by hand. The system would make it a Button.',
    evidence: [
      { for: 'Quiet on purpose', says: 'It is styled to be less visible than every other action on the screen, which looks deliberate.' },
      { for: 'Left over', says: 'It came over from the old billing app as it was. Its history has one commit, and no reason.' },
      { for: 'An action', says: `It ${c.does} when pressed, and rule 1 says an action is the system’s Button, not a raw element.` },
    ],
    recommendation:
      'The job is to change nothing visible, and rule 9 allows a new variant with a story that leaves the others as they are. Ghost, the nearest, is a full-height control in darker ink, so it would still change what people see.',
    unknown: `Whether “${c.action}” is quiet on purpose, and who decides how easy it is to find. That could change this recommendation.`,
    inferred: 'It came over from the old billing app with these screens, so it may be quiet for a reason nobody wrote down.',
    origin: 'A link built by hand, from the old billing app',
    start: 'Compare the two actions',
    triedSays: 'All 3 checks pass with either direction, and neither moves a pixel.',
    gathered: gathered ? GATHERED : undefined,
    paused: [5, 6],
    options: directions(c, gathered),
    pattern: c.pattern,
    twin: besideOf(c),
    tried: tradeoffChecks(c),
  };
}

const CANCEL: Case = {
  pattern: 'exit',
  file: file('BillingSettings.css'),
  screen: 'Billing settings',
  action: 'Cancel subscription',
  does: 'ends the subscription',
  verb: 'cancel',
  measure: 'cancellations',
  beside: 'Change plan',
  padded: true,
  frames: 2,
  stories: 2,
};

const cancelAction: Work = {
  id: 'cancel-action',
  file: CANCEL.file,
  screen: CANCEL.screen,
  title: '“Cancel subscription” in billing settings, and whether it stays quiet',
  status: 'asking',
  sample: { action: CANCEL.action },
  sketch: SKETCHES.settings,
  lines: linesOf(CANCEL),
  question: actionQuestion(CANCEL),
  frames: CANCEL.frames,
  stories: CANCEL.stories,
  history: [
    { at: '13:34', who: 'agent', text: 'Its 3 values are each a token’s, but the link is built by hand, and no component draws it this way. Tried both directions: the lint, axe and the visual check pass with each, and nothing moves.' },
    { at: '13:34', who: 'agent', text: 'Asked: the system makes an action a Button, and this one is quiet (boundaries 5 and 6).' },
  ],
};

/* Held behind the first question, because the same decision may settle
   them: two are the same case on the plan card, an action that ends or
   reduces the subscription, and one is close but not the same, an action
   that removes something the customer set up. */
function held(c: Case, sketch: Sketch, at: string): Work {
  return {
    id: `${c.action.toLowerCase().replace(/\s+/g, '-')}`,
    file: c.file,
    screen: c.screen,
    title: `“${c.action}” on the ${c.screen.toLowerCase()}, and whether it stays quiet`,
    status: 'waiting',
    waitsOn: 'cancel-action',
    sample: { action: c.action },
    sketch,
    lines: linesOf(c),
    question: actionQuestion(c),
    frames: c.frames,
    stories: c.stories,
    history: [
      { at, who: 'agent', text: 'Tried both directions: the lint, axe and the visual check pass with each. Nothing moves.' },
      { at, who: 'agent', text: 'Held: the same question as “Cancel subscription”. The decision there may settle it.' },
    ],
  };
}

const PLAN = { file: file('PlanCard.css'), screen: 'Plan card', frames: 2, stories: 2 };

const downgradePlan = held(
  { ...PLAN, pattern: 'exit', action: 'Downgrade plan', does: 'moves the customer to a smaller plan', verb: 'downgrade', measure: 'downgrades', beside: 'Upgrade plan' },
  SKETCHES.planDowngrade,
  '13:20',
);

const removeSeats = held(
  { ...PLAN, pattern: 'exit', action: 'Remove seats', does: 'reduces the seats the customer pays for', verb: 'remove seats', measure: 'seat removals', beside: 'Add seats' },
  SKETCHES.planSeats,
  '13:20',
);

const removeCard = held(
  { ...CANCEL, padded: false, pattern: 'removal', action: 'Remove card', does: 'removes the saved card', verb: 'remove a card', measure: 'card removals', beside: 'Update card' },
  SKETCHES.settingsCard,
  '13:34',
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
  sketch: SKETCHES.meter,
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

/* The reason Alex gives for her decision, in her words, as the stories and
   the case study play it: the agent's draft, with the one thing the agent
   could not know written in front of it. Simulated context, like the rest of
   the run; nothing here claims a real retention test. */
export const DANAS_REASON =
  'The gray link is from a retention test last year that ended without a decision, and nobody turned it off. How easy it is to cancel is a product decision, so it gets its own change. A quiet Button would let any agent make any action this hard to find.';

export function initialDelegation(): DelegationState {
  return {
    brief: {
      id: 'billing',
      title: 'Bring the billing screens onto the design system',
      request:
        'The token lint reports 36 literals in src/product/billing/, the screens that came over from the old billing app, and some of their controls are built by hand. Move the values onto tokens and the controls onto the system’s components. Nothing should look different: merge what doesn’t move a pixel, and ask me about the rest.',
      by: alex,
      agent: { name: 'Claude Code', run: 'run_01K6M4' },
      repo: 'relay/web',
      area: AREA,
      delegatedAt: '2026-10-01T13:04:00-05:00',
      lastActive: '13:34',
      literals: 36,
    },
    boundaries,
    work: [
      cancelAction,
      meterRadius,
      settingsRoutine,
      meterRoutine,
      planRoutine,
      paymentFailed,
      paymentRoutine,
      invoiceRoutine,
      activityRoutine,
      downgradePlan,
      removeSeats,
      removeCard,
    ],
    rules: [],
    decisions: [],
    clock: 0,
  };
}

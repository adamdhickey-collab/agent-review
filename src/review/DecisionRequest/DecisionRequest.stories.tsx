import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { initialTableRun } from '../../data/table';
import { find, play, waitingOn, whyAsking, type DelegationState, type Work } from '../../data/delegation';
import type { DecisionRequestProps, RulePreview } from './DecisionRequest';
import { DecisionRequest } from './DecisionRequest';

const start = initialDelegation();
const withRule = play(start, { type: 'answer', id: 'activity-red', option: 'diff', makeRule: true });

function props(s: DelegationState, id: string, preview: RulePreview): DecisionRequestProps {
  const w = find(s, id) as Work;
  return {
    work: w,
    why: w.waitsOn ? whyAsking(s, w) : undefined,
    boundaries: s.boundaries.filter((b) => w.question!.paused.includes(b.n)),
    waiting: waitingOn(s, id),
    preview: () => preview,
    onAnswer: fn(),
  };
}

const makeRule: RulePreview = {
  offer: 'make',
  text: 'On the billing screens, a value struck through beside the one that replaced it takes --color-diff-remove-ink, and the new value takes --color-diff-add-ink.',
  settles: waitingOn(start, 'activity-red').filter((w) => w.question?.pattern === 'replaced'),
};

const meta = {
  title: 'Review/DecisionRequest',
  component: DecisionRequest,
  args: props(start, 'activity-red', makeRule),
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'A change the agent stopped on, asking for one decision, and saying which kind as its status: Needs judgment or Needs approval. The answers are the body of the card, each a card with its button. Needs judgment: the agent can make the change and cannot tell which is meant, so the card says what no check can settle and each answer shows the element as it would render if --color-danger changed later, which is the whole difference between them. Needs approval: the agent knows what to do and may not, so the card shows the line it would change and what each answer does, and, for a fix in a shared component, who else it reaches and what has and hasn’t been checked. Both cite the boundary that stopped them on one line, and fold what was found, the code, the evidence and the reason for the recommendation. Answering is the system’s inline confirmation: the answers become "apply this?", Escape cancels, focus goes to Apply. That second step is where an intent answer can become a rule, never by default: the box starts unchecked, and checking it shows the rule in words, what it does not cover, and what it would settle at once. A scope decision offers no rule; allowing a step once is not moving the boundary.',
      },
    },
  },
} satisfies Meta<typeof DecisionRequest>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WhatAValueMeans: Story = {
  parameters: {
    docs: { description: { story: 'The first question of the billing run: two tokens draw the same red, and the evidence points both ways. The card asks the decision itself: “These two reds look the same. Should they mean the same thing?” Under it, the two reds as tiles, each headed by its meaning: “Replaced value”, the old plan struck through with an arrow to the new one, and “Failure”, “Payment failed”, which the agent made --color-danger on its own. Each says what its red means in a sentence, and names its one token under that, quietly. Then one line, “All 3 automated checks passed, with either token.”, with the three results and what each established one press away, and the line that says why that stops the agent, louder than the sentence explaining it: “So this isn’t a testing problem. It’s a meaning decision.” The answers sit under “Should these meanings stay separate?” and “Imagine the danger style becomes stronger later.” Each card is headed by its choice in words (keep the meanings separate, or keep them linked), says what it does without a token’s name, and shows both elements as they would render with a stronger danger, each beside what happens to it; “Only the failure gets louder” and “Both get louder” come last, as the summary. The recommended card carries the badge. The four changes held behind it are counted in the head and listed under the evidence.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('4 changes wait on this')).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { name: 'These two reds look the same. Should they mean the same thing?' })).toBeInTheDocument();
    const pair = canvas.getByRole('list', { name: 'The two reds' });
    const tiles = within(pair).getAllByRole('listitem');
    await expect(tiles).toHaveLength(2);
    await expect(tiles[0]).toHaveTextContent(/^Replaced value/);
    await expect(tiles[0]).toHaveTextContent('Red means this value was replaced.');
    await expect(tiles[0]).toHaveTextContent(/--color-diff-remove-ink$/);
    await expect(tiles[0]).not.toHaveTextContent('--color-danger');
    await expect(tiles[1]).toHaveTextContent(/^Failure/);
    await expect(tiles[1]).toHaveTextContent('Payment failed');
    await expect(tiles[1]).toHaveTextContent('Red means something went wrong.');
    await expect(tiles[1]).toHaveTextContent(/--color-danger$/);
    await expect(canvas.getByText('Needs judgment')).toBeInTheDocument();
    const tried = canvas.getByText('All 3 automated checks passed, with either token.').closest('details')!;
    await expect(tried).not.toHaveAttribute('open');
    await userEvent.click(canvas.getByText('All 3 automated checks passed, with either token.'));
    await expect(tried).toHaveAttribute('open');
    const checks = within(tried).getByRole('list', { name: 'The checks, with either token in place' });
    await expect(within(checks).getAllByRole('listitem')).toHaveLength(3);
    await expect(checks).toHaveTextContent('Visual baselines: 0 of 2 frames moved');
    await expect(checks).toHaveTextContent('Nothing on the screen moved, at 1280 and at 768.');
    await expect(canvas.queryByText(/Can become a rule for/)).toBeNull();
    await expect(canvas.getByText('So this isn’t a testing problem. It’s a meaning decision.')).toBeVisible();
    await expect(canvas.getByText(/^The interface can be stable and accessible either way\./)).toHaveTextContent('whether “replaced” and “failed” should share the same meaning');
    const answers = canvas.getByRole('group', { name: 'Should these meanings stay separate?' });
    await expect(answers).toHaveTextContent('Imagine the danger style becomes stronger later.');
    const cards = answers.querySelectorAll<HTMLElement>('.ask__choice');
    await expect(cards).toHaveLength(2);
    await expect(cards[0]).toHaveTextContent(/^Keep the meanings separate\s*Recommended/);
    await expect(cards[0]).toHaveTextContent('Replacement and failure use different semantic tokens.');
    await expect(cards[0]).toHaveTextContent(/Failure changes.*Replacement stays the same.*Only the failure gets louder/);
    await expect(cards[0].querySelectorAll('.ask__sample--loud')).toHaveLength(1);
    await expect(cards[1]).toHaveTextContent(/^Keep the meanings linked/);
    await expect(cards[1]).toHaveTextContent('Both meanings continue using the danger token.');
    await expect(cards[1]).toHaveTextContent(/Failure changes.*Replacement changes too.*Both get louder/);
    await expect(cards[1].querySelectorAll('.ask__sample--loud')).toHaveLength(2);
    await expect(canvas.getByText(/4 changes are held until you answer/)).not.toBeVisible();
  },
};

export const Choosing: Story = {
  args: { initialChoice: 'diff' },
  parameters: {
    docs: { description: { story: 'An answer chosen. The answers have become the question, focus is on Apply, and the rule box is unchecked: this answer applies to this change only until the person says otherwise. Checking it shows the rule as it will read, the three changes it would settle now, and that a matching case will not ask again. Cancel and Apply sit in a bar at the confirmation’s foot with what Apply will do beside them, and the bar stays at the bottom of the window while the confirmation runs past it. Apply is the confirmation’s one accent. Escape cancels and puts focus back on the answer.' } },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Apply' })).toHaveFocus();
    await expect(canvas.getByText('This answer applies to this change only.')).toBeInTheDocument();
    const bar = canvasElement.querySelector('.ask__bar') as HTMLElement;
    await expect(getComputedStyle(bar).position).toBe('sticky');
    await expect(within(bar).getByRole('button', { name: 'Apply' })).toBeInTheDocument();
    await expect(bar.querySelector('.ask__bar-what')).toHaveTextContent(/^Use the diff pair$/);
    await userEvent.click(canvas.getByText('Also use this answer for similar cases'));
    await expect(bar.querySelector('.ask__bar-what')).toHaveTextContent('Use the diff pair, kept as a rule');
    await expect(canvas.getByText('The rule, as it will read')).toBeInTheDocument();
    await expect(canvas.getByText(/It settles now:/).closest('p')).toHaveTextContent('3 changes that match');
    await expect(canvas.getByText(/Next time:/).closest('p')).toHaveTextContent('a case that matches doesn’t ask you');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await expect(args.onAnswer).toHaveBeenCalledWith('diff', true);
  },
};

export const CancelWithEscape: Story = {
  args: { initialChoice: 'danger' },
  parameters: {
    docs: { description: { story: 'Escape is Cancel. The answers come back, and focus goes to the one that was chosen.' } },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('button', { name: 'Use danger and success' })).toHaveFocus();
    await expect(args.onAnswer).not.toHaveBeenCalled();
  },
};

export const OutsideTheDelegation: Story = {
  args: props(start, 'meter-radius', { offer: 'none', settles: [] }),
  parameters: {
    docs: { description: { story: 'The agent knows the fix (a new token, nothing moves) and the token layer is outside its delegation. It cites both boundaries, recommends allowing it, and offers no rule: allowing this once is not the same as letting it add tokens.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Needs approval')).toBeInTheDocument();
    await expect(canvas.getByText('Allowed once. The boundary stays where it is.')).toBeInTheDocument();
    await expect(canvas.getByText(/^Needs your approval: Changing a shared component/)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Add --radius-full, this once' }));
    await expect(canvas.queryByRole('checkbox')).toBeNull();
    await expect(canvas.getByText(/doesn’t widen the delegation/)).toBeInTheDocument();
  },
};

export const OutsideYourRule: Story = {
  args: props(withRule, 'invoice-removed', {
    offer: 'widen',
    text: 'On the billing screens, a value struck through takes --color-diff-remove-ink, whether or not a new value stands beside it; a new value beside it takes --color-diff-add-ink.',
    settles: [],
  }),
  parameters: {
    docs: { description: { story: 'After a rule was made. This case is close to it and outside it, and the card says so before anything else, in the reason it paused. Answering can add the case to the rule rather than make a second one.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Close to your rule, but outside it/)).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'The two reds' })).toHaveTextContent(/^Removed value.*Red means this value was removed\./);
    await expect(canvas.getByRole('group', { name: 'Should these meanings stay separate?' })).toHaveTextContent(/Removal stays the same.*Removal changes too/);
    await userEvent.click(canvas.getByRole('button', { name: 'Use the diff remove ink' }));
    await expect(canvas.getByText('Add this case to your rule')).toBeInTheDocument();
  },
};

export const AnsweredOnceElsewhere: Story = {
  args: props(play(start, { type: 'answer', id: 'activity-red', option: 'diff', makeRule: false }), 'plan-seats', makeRule),
  parameters: {
    docs: { description: { story: 'The first question answered once, without a rule. This change was waiting on it, and asks anyway, saying why: a one-time answer does not carry over.' } },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/A one-time answer doesn’t carry over/)).toBeInTheDocument();
  },
};

/* The shared-table run's question: a permission boundary about a fix that
   reaches past the screen asked about. */
const table = initialTableRun();
const tableSeen = play(table, { type: 'answer', id: 'table-rows', option: 'evidence', makeRule: false });
const keepLocal: RulePreview = {
  offer: 'make',
  text: 'On the customer screens, when a fix would change a shared component, make it on the screen instead, and tell the component’s owner.',
  excludes: 'Other screens, a bug in a shared component itself, and any change a component’s owner asks for.',
  scope: 'The customer screens',
  fixed: true,
  settles: [],
};

export const SharedComponent: Story = {
  args: { ...props(table, 'table-rows', keepLocal), preview: (o: string) => (o === 'local' ? keepLocal : { offer: 'none', settles: [] }) },
  parameters: {
    docs: {
      description: {
        story:
          'A permission boundary: the agent knows the fix, the checks it could run pass, and the fix is in the shared Table forty screens draw. The card says what it was asked and what it proposes, shows the change, who else it reaches (the screens by area, every one under a fold, and the owner), what has been checked beside what has not, and that this is a permission decision rather than a technical one. Three answers, each saying what happens after: keep it to the screen asked about, approve the shared change once, or have the agent gather more evidence first.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Needs approval')).toBeInTheDocument();
    await expect(canvas.getByText('Asked')).toBeInTheDocument();
    await expect(canvas.getByText('Proposes')).toBeInTheDocument();
    await expect(canvas.getByRole('group', { name: 'Who else it reaches' })).toHaveTextContent(/40 screens draw the shared Table, which Priya Raman \(Design systems\) owns\./);
    await expect(canvas.getByRole('list', { name: 'Screens by area' }).children).toHaveLength(6);
    const known = canvas.getByRole('list', { name: 'What is known' });
    await expect(known).toHaveTextContent(/Checked.*12 of the 40 screens have one/);
    await expect(known).toHaveTextContent(/Not checked.*28 screens have no visual baseline/);
    await expect(canvas.getByText('So this isn’t a technical problem. It’s a permission decision.')).toBeInTheDocument();
    for (const name of ['Fix this screen only', 'Approve, this once', 'Show me the 40 screens']) await expect(canvas.getByRole('button', { name })).toBeInTheDocument();
    /* Gathering evidence decides nothing, so it asks no second question. */
    await userEvent.click(canvas.getByRole('button', { name: 'Show me the 40 screens' }));
    await expect(args.onAnswer).toHaveBeenCalledWith('evidence', false);
    await expect(canvas.queryByRole('button', { name: 'Apply' })).toBeNull();
  },
};

export const SharedComponentApproveOnce: Story = {
  args: { ...props(table, 'table-rows', { offer: 'none', settles: [] }), initialChoice: 'shared' },
  parameters: {
    docs: {
      description: {
        story:
          'Approving the shared change is a step past the boundary, for this change only, so it offers no rule. The confirmation says whose permission a standing one would need: the component’s owner, who this does not ask.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Apply' })).toHaveFocus();
    await expect(canvas.queryByRole('checkbox')).toBeNull();
    await expect(canvas.getByText(/only its owner, Priya Raman \(Design systems\), can give/)).toBeInTheDocument();
  },
};

export const SharedComponentKeepLocal: Story = {
  args: { ...props(table, 'table-rows', keepLocal), initialChoice: 'local' },
  parameters: {
    docs: {
      description: {
        story:
          'Keeping the fix on the screen asked about is within the agent’s authority, so it is an answer, and it can be kept for similar cases: a rule scoped to the customer screens, in its own words, which can be revoked but not widened.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Also use this answer for similar cases'));
    await expect(canvas.getByText(/On the customer screens, when a fix would change a shared component/)).toBeInTheDocument();
    await expect(canvas.getByText(/You can revoke it under the boundaries/)).toBeInTheDocument();
  },
};

export const SharedComponentAfterEvidence: Story = {
  args: props(tableSeen, 'table-rows', keepLocal),
  parameters: {
    docs: {
      description: {
        story:
          'After the agent gathered the evidence it was asked for: the same question, with what it found. All forty rendered, five cut off their last row, and what is still not known. Two answers now; the one that asked for more is gone.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('list', { name: 'What is known' })).toHaveTextContent(/On 5, a panel of fixed height now cuts off the last row/);
    await expect(canvas.queryByRole('button', { name: 'Show me the 40 screens' })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Approve, this once' })).toBeInTheDocument();
  },
};

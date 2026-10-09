import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { initialTableRun } from '../../data/table';
import { find, play, waitingOn, whyAsking, type DelegationState, type Work } from '../../data/delegation';
import type { DecisionRequestProps, RulePreview } from './DecisionRequest';
import { DecisionRequest } from './DecisionRequest';

const start = initialDelegation();
const withRule = play(start, { type: 'answer', id: 'activity-red', option: 'separate', makeRule: true });

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
  text: 'On the billing screens, a value replaced by another is neutral and struck through, with a label that says what happened. Red is for failures.',
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
          'A change the agent stopped on, asking for one decision, and saying which kind as its status: Needs judgment or Needs approval. Needs judgment, in the billing run, is a trade-off: the agent found one red with two meanings and proposes two defensible directions, recommends one, and says what it can’t determine that could change that. Each direction is a card of the same shape (what it does, how it looks, three benefits, three risks); choosing one marks it and opens what the agent will do, the person’s reason and the rule box under the cards, with the other still there to switch to. Needs approval: the agent knows what to do and may not, so the card shows the line it would change and what each answer does, and, for a fix in a shared component, who else it reaches and what has and hasn’t been checked; choosing an answer turns the answers into its confirmation. Both cite the boundary that stopped them on one line, and fold what was found, the code and the evidence. A rule is never made by default: the box starts unchecked, and checking it shows the rule in words, what it does not cover, and what it would settle at once. A scope decision offers no rule; allowing a step once is not moving the boundary.',
      },
    },
  },
} satisfies Meta<typeof DecisionRequest>;

export default meta;
type Story = StoryObj<typeof meta>;

const choose = (title: string) => ({ name: new RegExp(`^Choose\\s+${title}$`) });
const chosen = (title: string) => ({ name: new RegExp(`^Chosen\\s+${title}$`) });

export const TradeOff: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The first question of the billing run, as a trade-off. The two reds as tiles, each headed by its meaning and its screen: the replaced plan, hard-coded from the old billing app, and “Payment failed”, which the agent made --color-danger on its own. The checks, folded: lint and accessibility pass with either direction, and only this value moves. Then the agent’s read: it recommends separating the meanings, and says what it can’t determine (whether people rely on the red to notice a plan change) and what it inferred rather than checked, beside a way to ask for evidence. Then the two directions, two cards of one shape, each with how it would look and three benefits and three risks; “Recommended” is a quiet label, and both buttons are the same.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('4 changes wait on this')).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { name: 'Separate the two meanings of red, or keep the familiar signal?' })).toBeInTheDocument();
    const tiles = within(canvas.getByRole('list', { name: 'The two reds' })).getAllByRole('listitem');
    await expect(tiles).toHaveLength(2);
    await expect(tiles[0]).toHaveTextContent(/^Replaced value · Billing activity/);
    await expect(tiles[0]).toHaveTextContent('Red means this value was replaced.');
    await expect(tiles[0]).toHaveTextContent(/Hard-coded #b42318, from the old billing app$/);
    await expect(tiles[1]).toHaveTextContent(/^Failure · Payment history/);
    await expect(tiles[1]).toHaveTextContent(/--color-danger$/);
    const tried = canvas.getByText('Lint and accessibility pass with either direction. Only this value moves.').closest('details')!;
    await expect(tried).not.toHaveAttribute('open');
    await userEvent.click(canvas.getByText('Lint and accessibility pass with either direction. Only this value moves.'));
    const checks = within(tried).getByRole('list', { name: 'The checks, with each direction in place' });
    await expect(checks).toHaveTextContent('Visual baselines: 2 of 2 frames moved with both');
    const read = canvas.getByRole('list', { name: 'The agent’s read' });
    await expect(read).toHaveTextContent(/^Recommended\s*Separate the meanings/);
    await expect(read).toHaveTextContent(/What I can’t determine\s*Whether people who use the billing activity screen rely on the red/);
    await expect(read).toHaveTextContent('That could change this recommendation.');
    await expect(read).toHaveTextContent(/Inferred, not checked:/);
    const answers = canvas.getByRole('group', { name: 'Which trade-off is acceptable?' });
    const cards = answers.querySelectorAll<HTMLElement>('.ask__choice');
    await expect(cards).toHaveLength(2);
    await expect(cards[0]).toHaveTextContent(/^Separate the meanings\s*Recommended/);
    await expect(cards[1]).toHaveTextContent(/^Keep the red for now/);
    for (const card of cards) {
      await expect(within(card).getByRole('list', { name: 'Benefits' }).children).toHaveLength(3);
      await expect(within(card).getByRole('list', { name: 'Risks' }).children).toHaveLength(3);
      await expect(within(card).getByRole('button', { name: /^Choose/ })).toHaveAttribute('aria-pressed', 'false');
      await expect(within(card).getByRole('button', { name: /^Choose/ })).toHaveClass('btn--secondary');
    }
    await expect(cards[0].querySelector('[data-look]')).toHaveAttribute('data-look', 'neutral');
    await expect(cards[1].querySelector('[data-look]')).toHaveAttribute('data-look', 'red');
    await expect(canvas.queryByRole('button', { name: 'Apply' })).toBeNull();
    await expect(canvas.getByText(/4 changes are held until you decide/)).not.toBeVisible();
  },
};

export const Choosing: Story = {
  args: { initialChoice: 'keep' },
  parameters: {
    docs: {
      description: {
        story:
          'The other direction chosen: keep the red for now. Its card is marked and its button pressed; the recommended card is still there. Under them, what the agent will do if it is applied, in order, the person’s reason, starting as the agent’s draft, and the rule box, unchecked. Choosing the other direction switches the plan and keeps what was typed for each, and clears the rule box. Apply is the one accent, and passes the reason with the answer.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('If you apply “Keep the red for now”, the agent will:')).toHaveFocus();
    await expect(canvas.getByRole('button', chosen('Keep the red for now'))).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', choose('Separate the meanings'))).toHaveAttribute('aria-pressed', 'false');
    const plan = canvasElement.querySelector('.ask__plan') as HTMLElement;
    await expect(plan.children).toHaveLength(5);
    await expect(plan).toHaveTextContent('Write the exception into the design system’s list of exceptions.');
    const reason = canvas.getByRole('textbox', { name: 'Your reason' });
    await expect(reason).toHaveValue('Familiarity matters more right now. Keep the red until a neutral style has been tested with the people who use it.');
    await userEvent.clear(reason);
    await userEvent.type(reason, 'Support watches for red during renewals.');
    await userEvent.click(canvas.getByText('Use this decision for similar cases'));
    await expect(canvas.getByText('The rule, as it will read')).toBeInTheDocument();
    /* Switch: the plan is the other direction's, the box is cleared, nothing typed is lost. */
    await userEvent.click(canvas.getByRole('button', choose('Separate the meanings')));
    await expect(canvas.getByText('If you apply “Separate the meanings”, the agent will:')).toHaveFocus();
    await expect(canvas.getByRole('checkbox', { name: 'Use this decision for similar cases' })).not.toBeChecked();
    await expect(canvas.getByRole('textbox', { name: 'Your reason' })).toHaveValue('Red should mean something went wrong. A plan change is routine, and the label says what it is.');
    await userEvent.click(canvas.getByRole('button', choose('Keep the red for now')));
    await expect(canvas.getByRole('textbox', { name: 'Your reason' })).toHaveValue('Support watches for red during renewals.');
    const bar = canvasElement.querySelector('.ask__bar') as HTMLElement;
    await expect(getComputedStyle(bar).position).toBe('sticky');
    await expect(bar.querySelector('.ask__bar-what')).toHaveTextContent(/^Keep the red for now$/);
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await expect(args.onAnswer).toHaveBeenCalledWith('keep', false, 'Support watches for red during renewals.');
  },
};

export const ChoosingTheRecommended: Story = {
  args: { initialChoice: 'separate' },
  parameters: {
    docs: { description: { story: 'The recommended direction chosen and kept as a rule: the rule as it will read, the three waiting changes it settles now, and that the next matching case follows it and names this decision. The draft reason is passed as it stands.' } },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('.ask__plan')).toHaveTextContent('Open a task to check the new style with people who use the billing activity screen.');
    await userEvent.click(canvas.getByText('Use this decision for similar cases'));
    await expect(canvas.getByText(/It settles now:/).closest('p')).toHaveTextContent('3 changes that match');
    await expect(canvas.getByText(/Next time:/).closest('p')).toHaveTextContent('its record names the decision the rule came from');
    await expect(canvasElement.querySelector('.ask__bar-what')).toHaveTextContent('Separate the meanings, kept as a rule');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await expect(args.onAnswer).toHaveBeenCalledWith('separate', true, 'Red should mean something went wrong. A plan change is routine, and the label says what it is.');
  },
};

export const CancelWithEscape: Story = {
  args: { initialChoice: 'keep' },
  parameters: {
    docs: { description: { story: 'Escape is Cancel. The plan closes, neither card is chosen, and focus goes back to the one that was.' } },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('button', choose('Keep the red for now'))).toHaveFocus();
    await expect(canvas.queryByText(/If you apply/)).toBeNull();
    await expect(args.onAnswer).not.toHaveBeenCalled();
  },
};

export const RequestEvidence: Story = {
  parameters: {
    docs: { description: { story: 'Asking for evidence decides nothing, so it needs no second step: the answer goes straight to the run, which gathers it and asks again.' } },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Request evidence' }));
    await expect(args.onAnswer).toHaveBeenCalledWith('evidence', false);
  },
};

export const AfterEvidence: Story = {
  args: props(play(start, { type: 'answer', id: 'activity-red', option: 'evidence', makeRule: false }), 'activity-red', makeRule),
  parameters: {
    docs: {
      description: {
        story:
          'After the agent gathered the evidence it was asked for: where this red is used, what each direction would change, what depends on it, what it could not verify (nobody’s usage, because the repository has none), and a way to find out, marked proposed and not run. The two directions are unchanged, and the way to ask for more is gone.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const found = canvas.getByRole('region', { name: 'What the agent found when you asked' });
    await expect(found).toHaveTextContent(/5 places on 4 screens/);
    await expect(found).toHaveTextContent(/There is no usage data or research about it in the repository\./);
    await expect(found).toHaveTextContent(/Proposed, not run\./);
    await expect(canvas.queryByRole('button', { name: 'Request evidence' })).toBeNull();
    await expect(canvas.getByRole('button', choose('Keep the red for now'))).toBeInTheDocument();
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
    text: 'On the billing screens, a value replaced or removed is neutral and struck through, with a label that says what happened. Red is for failures.',
    settles: [],
  }),
  parameters: {
    docs: { description: { story: 'After a rule was made. This case is close to it and outside it, and the card says so before anything else, in the reason it paused. Deciding it the same way can add the case to the rule rather than make a second one.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Close to your rule, but outside it/)).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'The two reds' })).toHaveTextContent(/^Removed value · Invoice detail.*Red means this value was removed\./);
    await userEvent.click(canvas.getByRole('button', choose('Separate the meanings')));
    await expect(canvas.getByText('Add this case to your rule')).toBeInTheDocument();
  },
};

export const AnsweredOnceElsewhere: Story = {
  args: props(play(start, { type: 'answer', id: 'activity-red', option: 'separate', makeRule: false }), 'plan-seats', makeRule),
  parameters: {
    docs: { description: { story: 'The first question decided once, without a rule. This change was waiting on it, and asks anyway, saying why: a one-time decision does not carry over.' } },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/A one-time decision doesn’t carry over/)).toBeInTheDocument();
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

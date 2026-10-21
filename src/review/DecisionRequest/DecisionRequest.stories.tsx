import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { initialTableRun } from '../../data/table';
import { find, play, waitingOn, whyAsking, type DelegationState, type Work } from '../../data/delegation';
import type { DecisionRequestProps, RulePreview } from './DecisionRequest';
import { DecisionRequest } from './DecisionRequest';

const start = initialDelegation();
const withRule = play(start, { type: 'answer', id: 'cancel-action', option: 'quiet', makeRule: true });

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
  text: 'On the billing screens, an action that ends or reduces a subscription never gets a quiet variant: it stays as built, under an exception with an end date, until its own change makes it a Button.',
  settles: waitingOn(start, 'cancel-action').filter((w) => w.question?.pattern === 'exit'),
};

const DRAFT_OWN = 'How easy it is to cancel is a product decision, so it gets its own change. A quiet variant would let any agent make any action this hard to find.';
const DRAFT_QUIET = 'The job was to change nothing visible. A quiet variant keeps that promise, and rule 9 allows it.';

const meta = {
  title: 'Review/DecisionRequest',
  component: DecisionRequest,
  args: props(start, 'cancel-action', makeRule),
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The inspector of the delegated work’s workspace (Preview Studio): a change the agent stopped on, asking for one decision, and saying which kind as its status: Needs judgment or Needs approval. What the agent read and found is beside the preview, not here (Review/DecisionRead). Needs judgment, in the billing run, is a trade-off: the agent found an action built by hand to be quiet, “Cancel subscription”, where every other action is the system’s Button, and proposes two defensible directions. Each direction is a card of the same shape (what it does, its main risk, its three benefits and three risks folded, and Select and preview), and the checks, folded to one line with the sentence that keeps them apart from the decision, come after the directions; selecting one marks it, shows it in the screen’s preview as proposed, and opens what the agent will do, the person’s reason and the rule box under the cards, with the other still there to switch to. Needs approval: the agent knows what to do and may not, so the card shows the line it would change and what each answer does, and, for a fix in a shared component, who else it reaches and what has and hasn’t been checked; choosing an answer turns the answers into its confirmation. Both cite the boundary that stopped them on one line, and fold what was found, the code and the evidence. A rule is never made by default: the box starts unchecked, and checking it shows the rule in words, what it does not cover, and what it would settle at once. A scope decision offers no rule; allowing a step once is not moving the boundary.',
      },
    },
  },
} satisfies Meta<typeof DecisionRequest>;

export default meta;
type Story = StoryObj<typeof meta>;

const choose = (title: string) => ({ name: new RegExp(`^Select and preview\\s+${title}$`) });
const chosen = (title: string) => ({ name: new RegExp(`^Selected\\s+${title}$`) });

const QUIET = 'Add a quiet variant';
const OWN = 'Make it a Button in its own change';

export const TradeOff: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The first question of the billing run, as a trade-off, as the inspector holds it. Its kind, where it is and the three changes held behind it; the question; the checks, folded (all three pass with either direction, and neither moves a pixel), and under them that passing is not evidence either trade-off works for the people who use the screen. Then the two directions, two cards of one shape, each with its main risk in view and its three benefits and three risks folded under it; “Recommended” is a small badge, and both buttons are the same. Neither is selected.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('3 changes wait on this')).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { name: 'Keep “Cancel subscription” looking as it does, or make it a Button on purpose?' })).toBeInTheDocument();
    const said = 'All 3 checks pass with either direction, and neither moves a pixel.';
    const tried = canvas.getByText(said).closest('details')!;
    await expect(tried).not.toHaveAttribute('open');
    await userEvent.click(canvas.getByText(said));
    const checks = within(tried).getByRole('list', { name: 'The checks, with each direction in place' });
    await expect(checks).toHaveTextContent('Visual baselines: 0 of 2 frames moved with both');
    /* The checks are not the decision. */
    await expect(canvas.getByText(/Passing doesn’t mean either trade-off works for the people who use this screen\./)).toBeInTheDocument();
    const answers = canvas.getByRole('group', { name: 'Which trade-off is acceptable?' });
    const cards = within(answers).getAllByRole('listitem').filter((li) => li.classList.contains('ask__choice'));
    await expect(cards).toHaveLength(2);
    await expect(cards[0]).toHaveTextContent(/^Add a quiet variant\s*Recommended/);
    await expect(cards[1]).toHaveTextContent(/^Make it a Button in its own change/);
    /* The main risk is in view before anything is chosen; the whole case
       for and against is folded under it, one press away. */
    await expect(cards[0]).toHaveTextContent('Main risk: Any later agent can make any action this quiet.');
    await expect(cards[1]).toHaveTextContent('Main risk: “Cancel subscription” stays hard to find until its own change ships, on Oct 15.');
    for (const card of cards) {
      const more = within(card).getByText('3 benefits and 3 risks').closest('details')!;
      await expect(more).not.toHaveAttribute('open');
      await userEvent.click(within(card).getByText('3 benefits and 3 risks'));
      await expect(more).toHaveAttribute('open');
      await expect(within(card).getByRole('list', { name: 'Benefits' }).children).toHaveLength(3);
      await expect(within(card).getByRole('list', { name: 'Risks' }).children).toHaveLength(3);
      await expect(within(card).getByRole('button', { name: /^Select and preview/ })).toHaveAttribute('aria-pressed', 'false');
      await expect(within(card).getByRole('button', { name: /^Select and preview/ })).toHaveClass('btn--secondary');
    }
    await expect(canvas.queryByRole('button', { name: 'Apply' })).toBeNull();
    /* What the agent read is the preview's side of the workspace now. */
    await expect(canvas.queryByRole('list', { name: 'What each marked element is' })).toBeNull();
    await expect(canvas.queryByRole('list', { name: 'The agent’s read' })).toBeNull();
  },
};

export const Choosing: Story = {
  args: { initialChoice: 'own-change' },
  parameters: {
    docs: {
      description: {
        story:
          'The other direction chosen: make it a Button in its own change. Its card is marked and its button pressed; the recommended card is still there. Under them, what the agent will do if it is applied, in order, the person’s reason, starting as the agent’s draft, and the rule box, unchecked. Choosing the other direction switches the plan and keeps what was typed for each, and clears the rule box. Apply is the one accent, and passes the reason with the answer.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(`If you apply “${OWN}”, the agent will:`)).toHaveFocus();
    await expect(canvas.getByRole('button', chosen(OWN))).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', choose(QUIET))).toHaveAttribute('aria-pressed', 'false');
    const plan = canvasElement.querySelector('.ask__plan') as HTMLElement;
    await expect(plan.children).toHaveLength(5);
    await expect(plan).toHaveTextContent('Write the exception down, ending Oct 15.');
    await expect(plan).toHaveTextContent('The change ships either way.');
    const reason = canvas.getByRole('textbox', { name: 'Your reason' });
    await expect(reason).toHaveValue(DRAFT_OWN);
    await userEvent.clear(reason);
    await userEvent.type(reason, 'The grey link is a retention test nobody turned off.');
    await userEvent.click(canvas.getByText('Use this decision for similar cases'));
    await expect(canvas.getByText('The rule, as it will read')).toBeInTheDocument();
    /* Switch: the plan is the other direction's, the box is cleared, nothing typed is lost. */
    await userEvent.click(canvas.getByRole('button', choose(QUIET)));
    await expect(canvas.getByText(`If you apply “${QUIET}”, the agent will:`)).toHaveFocus();
    await expect(canvas.getByRole('checkbox', { name: 'Use this decision for similar cases' })).not.toBeChecked();
    await expect(canvas.getByRole('textbox', { name: 'Your reason' })).toHaveValue(DRAFT_QUIET);
    await userEvent.click(canvas.getByRole('button', choose(OWN)));
    await expect(canvas.getByRole('textbox', { name: 'Your reason' })).toHaveValue('The grey link is a retention test nobody turned off.');
    const bar = canvasElement.querySelector('.ask__bar') as HTMLElement;
    await expect(getComputedStyle(bar).position).toBe('sticky');
    await expect(bar.querySelector('.ask__bar-what')).toHaveTextContent(new RegExp(`^${OWN}$`));
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await expect(args.onAnswer).toHaveBeenCalledWith('own-change', false, 'The grey link is a retention test nobody turned off.');
  },
};

export const ChoosingTheRecommended: Story = {
  args: { initialChoice: 'quiet' },
  parameters: {
    docs: { description: { story: 'The recommended direction chosen and kept as a rule: the rule as it will read, the two waiting changes it settles now, and that the next matching case follows it and names this decision. The draft reason is passed as it stands.' } },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('.ask__plan')).toHaveTextContent('Add a quiet variant to the Button, with a story, and leave the other four as they are.');
    await userEvent.click(canvas.getByText('Use this decision for similar cases'));
    await expect(canvas.getByText(/It settles now:/).closest('p')).toHaveTextContent('2 changes that match, on the plan card');
    await expect(canvas.getByText(/Next time:/).closest('p')).toHaveTextContent('its record names the decision the rule came from');
    await expect(canvasElement.querySelector('.ask__bar-what')).toHaveTextContent('Add a quiet variant, kept as a rule');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await expect(args.onAnswer).toHaveBeenCalledWith('quiet', true, DRAFT_QUIET);
  },
};

export const CancelWithEscape: Story = {
  args: { initialChoice: 'own-change' },
  parameters: {
    docs: { description: { story: 'Escape is Cancel. The plan closes, neither card is chosen, and focus goes back to the one that was.' } },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('button', choose(OWN))).toHaveFocus();
    await expect(canvas.queryByText(/If you apply/)).toBeNull();
    await expect(args.onAnswer).not.toHaveBeenCalled();
  },
};

export const AfterEvidence: Story = {
  args: props(play(start, { type: 'answer', id: 'cancel-action', option: 'evidence', makeRule: false }), 'cancel-action', makeRule),
  parameters: {
    docs: {
      description: {
        story:
          'After the agent gathered the evidence it was asked for (shown beside the preview, Review/DecisionRead), the question is the same and so are the two directions; nothing was decided.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', choose(OWN))).toBeInTheDocument();
    await expect(canvas.getByRole('button', choose(QUIET))).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Request evidence' })).toBeNull();
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
    await expect(canvas.getByText(/^Needs your approval: Changing the token layer/)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Add --radius-full, this once' }));
    await expect(canvas.queryByRole('checkbox')).toBeNull();
    await expect(canvas.getByText(/doesn’t widen the delegation/)).toBeInTheDocument();
  },
};

export const OutsideYourRule: Story = {
  args: props(withRule, 'remove-card', {
    offer: 'widen',
    text: 'On the billing screens, an action that ends or reduces a subscription, or an action that removes something the customer set up is a quiet Button, drawn as it looks today.',
    settles: [],
  }),
  parameters: {
    docs: { description: { story: 'After a rule was made. Removing a card is close to it and outside it, and the card says so before anything else, in the reason it paused. Deciding it the same way can add the case to the rule rather than make a second one.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Close to your rule, but outside it/)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', choose(QUIET)));
    await expect(canvas.getByText('Add this case to your rule')).toBeInTheDocument();
  },
};

export const AnsweredOnceElsewhere: Story = {
  args: props(play(start, { type: 'answer', id: 'cancel-action', option: 'own-change', makeRule: false }), 'remove-seats', makeRule),
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
          'A permission boundary: the agent knows the fix, the checks it could run pass, and the fix is in the shared Table forty screens draw. The inspector says that this is a permission decision rather than a technical one, and whose component it is; the case for it (what was asked and proposed, the change, who else it reaches, what has been checked beside what has not) is beside the preview (Review/DecisionRead). Three answers, each saying what happens after: keep it to the screen asked about, approve the shared change once, or have the agent gather more evidence first.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Needs approval')).toBeInTheDocument();
    await expect(canvas.getByText('So this isn’t a technical problem. It’s a permission decision.')).toBeInTheDocument();
    await expect(canvas.getByText(/The shared Table is Priya Raman’s to change \(Design systems\)\./)).toBeInTheDocument();
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
          'After the agent gathered the evidence it was asked for (beside the preview, Review/DecisionRead): the same question, and two answers now; the one that asked for more is gone.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: 'Show me the 40 screens' })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Approve, this once' })).toBeInTheDocument();
  },
};

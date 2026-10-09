import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { play, type DelegationState } from '../../data/delegation';
import { DecisionRecord, type DecisionRecordProps } from './DecisionRecord';

/* Each record is the one the reducer writes for a sequence of presses, so a
   story can never show a record the app cannot make. */
const start = initialDelegation();
const separated = play(start, { type: 'answer', id: 'activity-red', option: 'separate', makeRule: true });
const keptRed = play(start, { type: 'answer', id: 'activity-red', option: 'keep', makeRule: true, reason: 'Support scans this feed for red during renewal week.' });
const once = play(start, { type: 'answer', id: 'activity-red', option: 'separate', makeRule: false, reason: '' });
const revoked = play(separated, { type: 'revoke-rule', id: 'rule-1' });

function props(s: DelegationState): DecisionRecordProps {
  const d = s.decisions[0];
  return { decision: d, work: s.work.find((w) => w.id === d.from), rule: d.rule ? s.rules.find((r) => r.id === d.rule) : undefined, all: s.work, onSeeRule: fn() };
}

const meta = {
  title: 'Review/DecisionRecord',
  component: DecisionRecord,
  args: props(separated),
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'What a decision on a trade-off left behind, where the card that asked for it was: the direction and when; what the agent did, as a checklist; and the six things a reader asks of a decision they were not there for: the reason (the person’s words, or the agent’s draft kept as written, and it says which), the trade-off accepted, the risk that remains, the follow-up it opened, and whether it became reusable guidance. A decision is a record and nothing reads it on its own: a later change follows it only through a rule the person made from it, and the record says so.',
      },
    },
  },
} satisfies Meta<typeof DecisionRecord>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Separated: Story = {
  parameters: { docs: { description: { story: 'The recommended direction, kept as a rule, with the agent’s draft reason kept as written. The rule settled three waiting changes at once, and the checklist says so.' } } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Separate the meanings' })).toBeInTheDocument();
    const did = canvas.getByRole('list', { name: 'What the agent did' });
    await expect(did.children).toHaveLength(6);
    await expect(did).toHaveTextContent(/Applied it to the 3 changes your rule covers, on the invoice detail, plan card and billing settings\./);
    await expect(canvas.getByText('The agent’s draft, kept as written')).toBeInTheDocument();
    await expect(canvas.getByText('Open')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'See the rule' }));
    await expect(args.onSeeRule).toHaveBeenCalled();
  },
};

export const KeptRedInYourWords: Story = {
  args: props(keptRed),
  parameters: { docs: { description: { story: 'The other direction, kept as a rule, with a reason the person wrote. The checklist is that direction’s own: the exception written down and a review opened.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Keep the red for now' })).toBeInTheDocument();
    await expect(canvas.getByText('In your words')).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'What the agent did' })).toHaveTextContent(/Wrote the exception into the design system’s list of exceptions\./);
  },
};

export const OnceWithoutAReason: Story = {
  args: props(once),
  parameters: { docs: { description: { story: 'Decided for this change only, with the reason cleared. The record says none was given rather than putting the draft back, and that the next matching case asks again.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('None given.')).toBeInTheDocument();
    await expect(canvas.getByText(/Not kept for similar cases/)).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'See the rule' })).toBeNull();
  },
};

export const RuleRevoked: Story = {
  args: props(revoked),
  parameters: { docs: { description: { story: 'The rule made from the decision, since revoked. The decision stays a record; the guidance says it no longer applies.' } } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/since revoked\. A matching case asks you again\./)).toBeInTheDocument();
  },
};

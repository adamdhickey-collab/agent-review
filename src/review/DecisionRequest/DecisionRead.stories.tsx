import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { initialTableRun } from '../../data/table';
import { find, play, waitingOn, type DelegationState, type Work } from '../../data/delegation';
import { DecisionRead, type DecisionReadProps } from './DecisionRequest';

/* What the agent read and found, as the workspace sets it under the preview
   (Preview Studio): the half of a decision that is evidence, read beside the
   picture it is about. Each story is a point of a run, reached through the
   same reducer the app uses. */

const start = initialDelegation();
const table = initialTableRun();

function props(s: DelegationState, id: string): DecisionReadProps {
  const w = find(s, id) as Work;
  return { work: w, waiting: waitingOn(s, id), onAnswer: fn() };
}

const meta = {
  title: 'Review/DecisionRead',
  component: DecisionRead,
  args: props(start, 'activity-red'),
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The agent’s read of a decision, under the preview of the screen it changes: what it recommends and what it can’t determine, side by side, with a way to ask it for evidence; what it found when asked; for a fix in a shared component, the change, who else it reaches, and what has been checked beside what hasn’t; and, folded, what it found, the code and the evidence for each reading. The decision itself is the inspector’s (Review/DecisionRequest).',
      },
    },
  },
} satisfies Meta<typeof DecisionRead>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TradeOff: Story = {
  parameters: {
    docs: { description: { story: 'The billing run’s first question. It recommends separating the meanings, and says what it can’t determine (whether people rely on the red to notice a plan change) and what it inferred rather than checked. The four changes held behind the decision are named in the fold.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const read = canvas.getByRole('list', { name: 'The agent’s read' });
    await expect(read).toHaveTextContent(/^Recommended\s*Separate the meanings/);
    await expect(read).toHaveTextContent(/What I can’t determine\s*Whether people who use the billing activity screen rely on the red/);
    await expect(read).toHaveTextContent('That could change this recommendation.');
    await expect(read).toHaveTextContent(/Inferred, not checked:/);
    await expect(canvas.getByText(/4 changes are held until you decide/)).not.toBeVisible();
    await userEvent.click(canvas.getByText('The evidence and the code'));
    await expect(canvas.getByText(/4 changes are held until you decide/)).toBeVisible();
  },
};

export const RequestEvidence: Story = {
  parameters: {
    docs: { description: { story: 'Asking for evidence decides nothing, so it needs no second step: the answer goes straight to the run, which gathers it and asks again.' } },
  },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Request evidence' }));
    await expect(args.onAnswer).toHaveBeenCalledWith('evidence', false);
  },
};

export const AfterEvidence: Story = {
  args: props(play(start, { type: 'answer', id: 'activity-red', option: 'evidence', makeRule: false }), 'activity-red'),
  parameters: {
    docs: {
      description: {
        story:
          'After the agent gathered the evidence it was asked for: where this red is used, what each direction would change, what depends on it, what it could not verify (nobody’s usage, because the repository has none), and a way to find out, marked proposed and not run. The way to ask for more is gone.',
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
  },
};

export const OutsideTheDelegation: Story = {
  args: props(start, 'meter-radius'),
  parameters: {
    docs: { description: { story: 'A permission question with nothing to weigh: the recommendation, and what is outside what the agent may do, with the one line it would change. Nothing is folded, because nothing is left.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const read = canvas.getByRole('list', { name: 'The agent’s read' });
    await expect(read).toHaveTextContent(/Recommended\s*Add --radius-full, this once/);
    await expect(read).toHaveTextContent(/Outside what it may do/);
    await expect(read).toHaveTextContent('.meter__track { border-radius: 999px; }');
    await expect(canvasElement.querySelector('details')).toBeNull();
  },
};

export const SharedComponent: Story = {
  args: props(table, 'table-rows'),
  parameters: {
    docs: {
      description: {
        story:
          'The case for a permission decision about the shared Table: the recommendation, what was asked and what is proposed, the change itself, who else it reaches (the screens by area, every one under a fold, and the owner), and what has been checked beside what has not, which is where screens with a visual baseline part from the 28 without one.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('list', { name: 'The agent’s read' })).toHaveTextContent(/Recommended\s*This screen only/);
    await expect(canvas.getByText('Asked')).toBeInTheDocument();
    await expect(canvas.getByText('Proposes')).toBeInTheDocument();
    await expect(canvas.getByRole('group', { name: 'Who else it reaches' })).toHaveTextContent(/40 screens draw the shared Table, which Priya Raman \(Design systems\) owns\./);
    await expect(canvas.getByRole('list', { name: 'Screens by area' }).children).toHaveLength(6);
    const known = canvas.getByRole('list', { name: 'What is known' });
    await expect(known).toHaveTextContent(/Checked.*12 of the 40 screens have one/);
    await expect(known).toHaveTextContent(/Not checked.*28 screens have no visual baseline/);
  },
};

export const SharedComponentAfterEvidence: Story = {
  args: props(play(table, { type: 'answer', id: 'table-rows', option: 'evidence', makeRule: false }), 'table-rows'),
  parameters: {
    docs: { description: { story: 'After the agent rendered all forty: five cut off their last row, and what is still not known.' } },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('list', { name: 'What is known' })).toHaveTextContent(/On 5, a panel of fixed height now cuts off the last row/);
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  parameters: {
    docs: { description: { story: 'The read in the dark theme; axe holds every ink to its ground.' } },
  },
  play: async ({ canvasElement }) => {
    await expect(getComputedStyle(canvasElement.ownerDocument.documentElement).colorScheme).toBe('dark');
  },
};

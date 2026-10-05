import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { ReactNode } from 'react';
import { StoreProvider } from '../../app/store';
import { initialDelegation } from '../../data/billing';
import { account, play, type DelegationState } from '../../data/delegation';
import { DelegationScreen } from './DelegationScreen';

/* Each story opens the screen on a point in the loop, reached by playing
   actions through the same reducer the app uses, so a story can never show
   a state the app cannot reach. TheWholeLoop presses through it instead,
   from the start to the quiet state, and asserts each state change. */

const start = initialDelegation();
const withRule = play(start, { type: 'answer', id: 'activity-red', option: 'diff', makeRule: true });
const answeredOnce = play(start, { type: 'answer', id: 'activity-red', option: 'diff', makeRule: false });
const quiet = play(
  withRule,
  { type: 'answer', id: 'meter-radius', option: 'add', makeRule: false },
  { type: 'answer', id: 'invoice-removed', option: 'diff', makeRule: true },
);

function inStore(state: DelegationState) {
  return (Story: () => ReactNode) => (
    <StoreProvider delegation={state}>
      <Story />
    </StoreProvider>
  );
}

const meta = {
  title: 'Review/DelegationScreen',
  component: DelegationScreen,
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The front door: work an agent was handed, and what came of it. It opens on an account of the run, not a queue: what was done, how it was checked, what is unresolved, and whether the agent stayed inside its boundaries. Then the decisions that need the person, each saying why it stopped, and the completed work, each open to what changed, why, on what authority, what the checks did and did not establish, and a revert. Beside it, the boundaries and the rules the person has made. When nothing needs the person, the account says so and the decisions section is not there. The run is simulated: sample data played back through one reducer (data/delegation.ts), the same way every time.',
      },
    },
  },
} satisfies Meta<typeof DelegationScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initial: Story = {
  decorators: [inStore(start)],
  parameters: {
    docs: { description: { story: 'The run as the person finds it: seven changes made and checked, two decisions, four changes held behind the first. The totals are counted from the work, and the work accounts for every literal the lint reported. Of the seven, the three with something to look at (an inconclusive check, a fix after a failed first try, a red chosen by meaning) are rows of their own; the four routine swaps are folded into one row.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const a = account(start);
    await expect(a.total).toBe(start.brief.literals);
    await expect(a.made.length).toBe(7);
    await expect(a.valuesMade + a.literalsLeft).toBe(start.brief.literals);
    await expect(canvas.getByText('7 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('26 merged10 waiting on your 2 decisions');
    await expect(canvas.getByRole('heading', { name: /Needs you/ })).toHaveTextContent('2');
    await expect(canvas.getByRole('heading', { name: /Completed work/ })).toHaveTextContent('7');
    await expect(canvas.getByText(/4 changes are held until you answer/)).toBeInTheDocument();
    await expect(canvas.getByText('Simulated')).toBeInTheDocument();
    await expect(canvas.getByText('4 routine swaps')).toBeInTheDocument();
    await expect(canvas.queryByText('On its own')).toBeNull();
  },
};

export const AfterARule: Story = {
  decorators: [inStore(withRule)],
  parameters: {
    docs: { description: { story: 'The first question answered with the diff pair, and made a rule. The rule settled the three waiting changes it covers and is listed under the boundaries with what it has done. The removed line item is close to the rule but outside it, so it asks, and says so.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('11 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('34 merged2 waiting on your 2 decisions');
    await expect(canvas.getByText(/Close to your rule, but outside it/)).toBeInTheDocument();
    await expect(canvas.getAllByText('Your rule')).toHaveLength(3);
    await expect(canvas.getByText('Active')).toBeInTheDocument();
  },
};

export const AnsweredOnce: Story = {
  decorators: [inStore(answeredOnce)],
  parameters: {
    docs: { description: { story: 'The same answer, given once. A one-time answer does not become standing permission, so the four changes that were waiting each ask, and each says why: the same question was answered once, for another change.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('8 changes made and checked. 5 decisions need you.')).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('28 merged8 waiting on your 5 decisions');
    await expect(canvas.getAllByText(/A one-time answer doesn’t carry over to another change/)).toHaveLength(4);
    await expect(canvas.getByText(/None yet\./)).toBeInTheDocument();
  },
};

export const Quiet: Story = {
  decorators: [inStore(quiet)],
  parameters: {
    docs: { description: { story: 'Nothing needs the person. The account says so first, and the decisions section is not there at all. The completed work, and the one result that stayed inconclusive, are still there to read.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Nothing needs your attention.')).toBeInTheDocument();
    await expect(canvas.queryByRole('heading', { name: /Needs you/ })).toBeNull();
    await expect(canvas.getByRole('heading', { name: /Completed work/ })).toHaveTextContent('13');
    await expect(canvas.getByText('All 36')).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('36 merged');
  },
};

export const TheWholeLoop: Story = {
  decorators: [inStore(start)],
  parameters: {
    docs: {
      description: {
        story:
          'Presses through the loop from the start: inspect work the agent did on its own; answer the first question and make the answer a rule; see the rule settle three changes and the case outside it pause; widen the rule, which settles that case; revert one change the rule made; revoke the rule; allow the new token once; and arrive at the quiet state. Each step asserts the counts, the statuses and what the person can do next.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Inspect a change the agent chose by meaning', async () => {
      const failed = Array.from(canvasElement.querySelectorAll<HTMLDetailsElement>('.record')).find((r) => r.textContent?.includes('The failed-payment red'))!;
      await userEvent.click(within(failed).getByText(/The failed-payment red/));
      await expect(failed.open).toBe(true);
      await expect(within(failed).getByText(/What no check establishes:/)).toBeVisible();
      await expect(within(failed).getByRole('button', { name: 'Revert this change' })).toBeVisible();
    });

    await step('Answer, and make the answer a rule', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Use the diff pair' }));
      const apply = canvas.getByRole('button', { name: 'Apply' });
      await expect(apply).toHaveFocus();
      await userEvent.click(canvas.getByText('Also use this answer for similar cases'));
      await expect(canvas.getByText(/It settles now:/).closest('p')).toHaveTextContent('3 changes that match');
      await userEvent.click(apply);
      await expect(canvas.getByText(/Your rule settled 3 waiting changes\. 1 change is asking now\./)).toBeInTheDocument();
      await expect(canvas.getByRole('heading', { name: /Needs you/ })).toHaveFocus();
      await expect(canvas.getByText('11 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
    });

    await step('The case outside the rule pauses, and says why', async () => {
      await expect(canvas.getByText(/Close to your rule, but outside it/)).toBeInTheDocument();
      await expect(canvas.getByRole('heading', { name: /removed line item/ })).toBeInTheDocument();
    });

    await step('Widen the rule, and it settles that case', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
      await userEvent.click(canvas.getByText('A value struck through with nothing replacing it'));
      await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
      await expect(canvas.getByText(/Rule saved\. Your rule settled 1 waiting change\./)).toBeInTheDocument();
      await expect(canvas.getByText('12 changes made and checked. 1 decision needs you.')).toBeInTheDocument();
      await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('35 merged1 waiting on your decision');
    });

    await step('Revert one change the rule made, and the history keeps both', async () => {
      const seats = Array.from(canvasElement.querySelectorAll<HTMLDetailsElement>('.record')).find((r) => r.textContent?.includes('The changed seat count'))!;
      seats.open = true;
      await userEvent.click(within(seats).getByRole('button', { name: 'Revert this change' }));
      await expect(seats.dataset.status).toBe('reverted');
      await expect(within(seats).getByRole('button', { name: 'Restore it' })).toHaveFocus();
      await expect(within(seats).getByText(/puts the literals back/)).toBeInTheDocument();
      await expect(canvas.getByText(/1 change reverted by you\./)).toBeInTheDocument();
      await expect(canvas.getByText(/The lint reports its 2 literals again\./)).toBeInTheDocument();
      await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('33 merged1 waiting on your decision2 reverted or left by you');
    });

    await step('Revoke the rule; what it made stays', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Revoke' }));
      await expect(canvas.getByRole('button', { name: 'Revoke the rule' })).toHaveFocus();
      await userEvent.click(canvas.getByRole('button', { name: 'Revoke the rule' }));
      await expect(canvas.getByText('Revoked')).toBeInTheDocument();
      await expect(canvas.getByText(/It no longer applies/)).toHaveFocus();
      await expect(canvas.queryByRole('button', { name: 'Edit' })).toBeNull();
      await expect(canvas.getAllByText('Your rule')).toHaveLength(4);
    });

    await step('Allow the new token once, and reach the quiet state', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Add --radius-full, this once' }));
      await expect(canvas.queryByText('Also use this answer for similar cases')).toBeNull();
      await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
      await waitFor(() => expect(canvas.getByText('Nothing needs your attention.')).toBeInTheDocument());
      await expect(canvas.getByText('Nothing needs your attention.').closest('p')).toHaveFocus();
      await expect(canvas.getByText('Allowed once')).toBeInTheDocument();
      await expect(canvas.getByRole('heading', { name: /Completed work/ })).toHaveTextContent('13');
    });

    await step('Reset puts the run back at its start', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Reset the demo' }));
      await expect(canvas.getByText('7 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
      await expect(canvas.getByRole('heading', { level: 1 })).toHaveFocus();
    });
  },
};

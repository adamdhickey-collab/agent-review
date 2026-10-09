import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { play } from '../../data/delegation';
import { OutcomeFacts, OutcomeSummary } from './OutcomeSummary';

const start = initialDelegation();
const withRule = play(start, { type: 'answer', id: 'activity-red', option: 'diff', makeRule: true });
const quiet = play(
  withRule,
  { type: 'answer', id: 'meter-radius', option: 'add', makeRule: false },
  { type: 'answer', id: 'invoice-removed', option: 'diff', makeRule: false },
);
const mixed = play(quiet, { type: 'revert', id: 'plan-seats' });
const left = play(withRule, { type: 'answer', id: 'meter-radius', option: 'leave', makeRule: false }, { type: 'answer', id: 'invoice-removed', option: 'diff', makeRule: false });

const meta = {
  title: 'Review/OutcomeSummary',
  component: OutcomeSummary,
  args: { state: start },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '44rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The account a delegated run opens on, built to be read at a glance: whether anything needs the person, then a bar of where the literals the lint reported are now (merged, waiting on the person’s decisions, taken back). That is the whole of OutcomeSummary, a few lines. What the checks established, each check as a large Badge with its count and a line each for what is unresolved and for scope, is OutcomeFacts, which the delegated work puts after the decisions and not between the title and them. Every figure is counted from the work, never carried. When nothing needs the person, the lead says so first: the quiet state is the result the screen is for.',
      },
    },
  },
} satisfies Meta<typeof OutcomeSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NeedsYou: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('7 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
    await expect(canvas.getByText('26 of 36')).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('26 merged10 waiting on your 2 decisions');
    await expect(canvas.queryByText(/Axe: 6 of 7/)).toBeNull();
  },
};

/* The modes as tiles, since 2026-10-09: one per mode, the count as the
   headline and what it counts under it, so these stories read the tiles as
   well as the line's text, which is unchanged. */
export const Settled: Story = {
  args: { state: withRule },
  parameters: { docs: { description: { story: 'The first question answered with a rule. A fourth tile, settled by you, arrives with the first answer, and the four share the row.' } } },
  play: async ({ canvasElement }) => {
    const modes = within(canvasElement).getByRole('list', { name: 'How the work was handled' });
    await expect(modes).toHaveTextContent('7 proceeded on its own1 needs your judgment1 needs your approval4 settled by you');
    await expect(within(modes).getAllByRole('listitem')).toHaveLength(4);
  },
};

export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  parameters: { docs: { description: { story: 'The account in a 360px column, as on a phone. Four tiles across would leave each a word wide, so each mode is a row: the mark and count, then the words, the held changes under them. The account’s own width decides, not the window’s.' } } },
  play: async ({ canvasElement }) => {
    const modes = within(canvasElement).getByRole('list', { name: 'How the work was handled' });
    await expect(modes).toHaveTextContent('7 proceeded on its own1 needs your judgment · 4 more wait on it1 needs your approval');
    await expect(modes.scrollWidth).toBeLessThanOrEqual(modes.clientWidth);
    const [own, asks] = within(modes).getAllByRole('listitem');
    await expect(asks.getBoundingClientRect().top).toBeGreaterThan(own.getBoundingClientRect().top);
  },
};

export const Facts: Story = {
  render: (args) => <OutcomeFacts state={args.state} />,
  parameters: {
    docs: { description: { story: 'What the checks established and what they could not, the three rows the delegated work shows after the decisions: each check with its count, the first try that failed and was fixed, the check that stayed inconclusive and what it could not measure, and the scope. Nothing in it was shortened by being moved here.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Axe: 6 of 7 passed, 1 inconclusive')).toBeInTheDocument();
    await expect(canvas.getByText(/A first try in the plan card failed two checks and was fixed\./)).toBeInTheDocument();
    await expect(canvas.getByText(/Axe couldn’t measure whether a label in the usage meter clears 4\.5:1/)).toBeInTheDocument();
    await expect(canvas.getByText(/Every change was made under its own boundaries\./)).toBeInTheDocument();
  },
};

export const Quiet: Story = {
  args: { state: quiet },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Nothing needs your attention.')).toBeInTheDocument();
    await expect(within(canvasElement).getByText('13 changes made and checked. Completed work is below.')).toBeInTheDocument();
  },
};

export const WithAReversal: Story = {
  args: { state: mixed },
  parameters: { docs: { description: { story: 'Quiet, with one change reverted by the person: the account says so, and that the lint reports its two literals again.' } } },
  render: (args) => (
    <>
      <OutcomeSummary state={args.state} />
      <OutcomeFacts state={args.state} />
    </>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/1 change reverted by you\./)).toBeInTheDocument();
    await expect(within(canvasElement).getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('34 merged2 reverted or left by you');
  },
};

export const WithALineLeft: Story = {
  args: { state: left },
  parameters: { docs: { description: { story: 'Quiet, with one line the person chose to leave as written: the scope sentence no longer mentions a change past the boundary, because none was made.' } } },
  render: (args) => <OutcomeFacts state={args.state} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/1 line left as written, by you\./)).toBeInTheDocument();
  },
};

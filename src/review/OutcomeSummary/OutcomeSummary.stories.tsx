import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { play } from '../../data/delegation';
import { OutcomeSummary } from './OutcomeSummary';

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
          'The account a delegated run opens on, built to be read at a glance: whether anything needs the person, then a bar of where the literals the lint reported are now (merged, asking, waiting, taken back), each check as a large Badge with its count, and a line each for what is unresolved and for scope. Every figure is counted from the work, never carried. When nothing needs the person, the lead says so first: the quiet state is the result the screen is for.',
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
    await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('26 merged3 asking you7 waiting on an answer');
    await expect(canvas.getByText('Axe: 6 of 7 passed, 1 inconclusive')).toBeInTheDocument();
    await expect(canvas.getByText(/A first try in the plan card failed two checks and was fixed\./)).toBeInTheDocument();
  },
};

export const Quiet: Story = {
  args: { state: quiet },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Nothing needs your attention.')).toBeInTheDocument();
  },
};

export const WithAReversal: Story = {
  args: { state: mixed },
  parameters: { docs: { description: { story: 'Quiet, with one change reverted by the person: the account says so, and that the lint reports its two literals again.' } } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/1 change reverted by you\./)).toBeInTheDocument();
  },
};

export const WithALineLeft: Story = {
  args: { state: left },
  parameters: { docs: { description: { story: 'Quiet, with one line the person chose to leave as written: the scope sentence no longer mentions a change past the boundary, because none was made.' } } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/1 line left as written, by you\./)).toBeInTheDocument();
  },
};

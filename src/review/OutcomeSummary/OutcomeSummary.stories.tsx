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
          'The account a delegated run opens on: whether anything needs the person, then four sentences, done, checked, unresolved and scope. Every figure is counted from the work, never carried, and sits in a sentence that says what it means. When nothing needs the person, the lead says so first: the quiet state is the result the screen is for.',
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
    await expect(canvas.getByText(/26 of the 36 literals/)).toBeInTheDocument();
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

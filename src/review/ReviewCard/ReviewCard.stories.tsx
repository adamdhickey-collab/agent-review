import type { Meta, StoryObj } from '@storybook/react-vite';
import { bulkActionsWithRules, findChange } from '../../data/scenario';
import type { Change } from '../../data/types';
import { ReviewCard } from './ReviewCard';

function change(id: string): Change {
  const c = findChange(id);
  if (!c) throw new Error(`The scenario has no change ${id}`);
  return c;
}

const longTitle: Change = {
  ...change('rv-2040'),
  id: 'rv-2044',
  title: 'Replace the hand-rolled dropdown in the customer menu with the system Menu and put its actions in a Toolbar',
  branch: 'agent/replace-customer-menu-dropdown-with-system-menu-and-toolbar-actions',
  commit: 'e2f8c10',
};

const meta = {
  title: 'Review/ReviewCard',
  component: ReviewCard,
  args: { change: change('rv-2040') },
  decorators: [
    (Story) => (
      <ul style={{ maxWidth: '24rem', margin: 0, padding: 0, listStyle: 'none' }}>
        <li>
          <Story />
        </li>
      </ul>
    ),
  ],
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'One change in the review queue, as a list item, for a screen narrower than 48rem. The table cannot become this by CSS and stay a table to a screen reader, and scrolling it sideways on a phone hides the two columns a reviewer decides on, so the queue renders a list there. The card says the same things in the same order as the row, from the same lane and status parts: the change, its state with the five validation lanes beside it, then who asked, which agent, when, and how many components. The title is the one link and is stretched over the whole card, so the target is the card, the keyboard gets one stop per change, and a screen reader names it by the title. The stories are the same situations as the row’s, at the width a phone gives it.',
      },
    },
  },
} satisfies Meta<typeof ReviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Clean: Story = {
  parameters: {
    docs: { description: { story: 'The invoices empty-state change: every lane passed, ready to accept.' } },
  },
};

export const MultipleFindings: Story = {
  args: { change: bulkActionsWithRules },
  parameters: {
    docs: { description: { story: 'The bulk-actions change: three lanes changed, one failed, and the blocking count beside the lanes.' } },
  },
};

export const Validating: Story = {
  args: { change: change('rv-2038') },
  parameters: {
    docs: { description: { story: 'Three lanes still running and the status dot live.' } },
  },
};

export const ReturnedToAgent: Story = {
  args: { change: change('rv-2036') },
};

export const LongTitle: Story = {
  args: { change: longTitle },
  parameters: {
    docs: { description: { story: 'A title past ninety characters and a branch name to match. The title wraps, and the branch breaks inside the name rather than pushing the card wider than the screen.' } },
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { CustomerTable } from './CustomerTable';

const meta = {
  title: 'Product/CustomerTable',
  component: CustomerTable,
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The customer table in Relay as it stands before the agent\'s change: the baseline Agent Review compares against. A Toolbar with a title, a count and three compact controls over a sortable Table of twelve customers, built entirely from the system. The screen owns the sort; the Table owns the markup and the states. It has no selection and no bulk actions, which is the feature the agent was asked to add, so a difference in those places is the change and a difference anywhere else is a finding.',
      },
    },
  },
} satisfies Meta<typeof CustomerTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = {
  args: { density: 'compact' },
};

export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 768 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The table in a 768px frame. The toolbar wraps rather than overflowing, and the table scrolls inside its own region. Note that the baseline has no bulk-action toolbar: the one the agent adds for a selection is what the Narrow story of the changed screen will have to show wrapping here too.',
      },
    },
  },
};

export const Empty: Story = {
  args: { customers: [] },
  parameters: {
    docs: { description: { story: 'No customers at all. The toolbar shows a count of 0 and the head of the table stays, with nothing under it; the screen does not yet place an EmptyState below the head.' } },
  },
};

export const Sorted: Story = {
  parameters: {
    docs: { description: { story: 'Presses the Seats header. The sort moves from Company to Seats, ascending, and the header says so with aria-sort.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Seats/ }));
    await expect(canvas.getByRole('columnheader', { name: /^Seats/ })).toHaveAttribute('aria-sort', 'ascending');
    await expect(canvas.getByRole('columnheader', { name: /^Company/ })).not.toHaveAttribute('aria-sort');
    const firstRow = canvas.getAllByRole('row')[1];
    await expect(within(firstRow).getByRole('rowheader')).toHaveTextContent('Juniper Foods');
  },
};

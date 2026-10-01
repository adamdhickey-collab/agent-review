import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { CustomerTable } from './CustomerTable';
import { customers } from './customers';

/* Three rows a story can start with: Halvorsen Freight, Monarch Dental
   Group and Northgate Properties. The review's preview opens the screen
   with the same three. */
const THREE = ['c_01HZK3', 'c_01HZKF', 'c_01HZKZ'];
const ALL = customers.map((c) => c.id);

const meta = {
  title: 'Product/CustomerTable',
  component: CustomerTable,
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The customer table in Relay. A Toolbar with a title, a count and three compact controls over a sortable Table of twelve customers, built entirely from the system; the screen owns the sort, the Table owns the markup and the states. Each row has a Checkbox in a control column and the head has a select-all. Selecting a row swaps the title toolbar for the accent Toolbar in the same slot, with the count, Archive, Export and Clear selection. Archive asks first, in that slot, with the number in the question and on the button; Export writes the selected rows to a CSV. Both end on a status line.',
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
        story: 'The table in a 768px frame. The toolbar wraps rather than overflowing, and the table scrolls inside its own region.',
      },
    },
  },
};

export const Empty: Story = {
  args: { customers: [] },
  parameters: {
    docs: {
      description: {
        story:
          'No customers at all. The toolbar shows a count of 0 and the head of the table stays, with its select-all disabled and nothing under it; the screen does not yet place an EmptyState below the head.',
      },
    },
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

export const Selected: Story = {
  args: { initialSelection: THREE },
  parameters: {
    docs: {
      description: {
        story:
          'Three rows selected. The title toolbar is replaced in place by the accent Toolbar, named "Selected customers", with the count and the three actions; the rows say it with aria-selected and a tinted ground, and the select-all box is indeterminate. The heading stays in the tree for the section\'s name.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = canvas.getByRole('toolbar', { name: 'Selected customers' });
    await expect(toolbar).toHaveTextContent('3 selected');
    await expect(canvas.getByRole('checkbox', { name: 'Select all customers' })).toBePartiallyChecked();
    await expect(canvas.getAllByRole('row', { selected: true })).toHaveLength(3);
    await expect(canvas.getByRole('heading', { name: 'Customers' })).toBeInTheDocument();
  },
};

export const AllSelected: Story = {
  args: { initialSelection: ALL },
  parameters: {
    docs: { description: { story: 'Every row selected: the select-all box is checked rather than indeterminate, and the count says twelve.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('checkbox', { name: 'Select all customers' })).toBeChecked();
    await expect(canvas.getByRole('toolbar', { name: 'Selected customers' })).toHaveTextContent('12 selected');
  },
};

export const SelectedNarrow: Story = {
  args: { initialSelection: THREE },
  decorators: [
    (Story) => (
      <div style={{ width: 768 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: { description: { story: 'The selection toolbar in a 768px frame. The three actions wrap under the count rather than overflowing the frame.' } },
  },
  play: async ({ canvasElement }) => {
    const toolbar = within(canvasElement).getByRole('toolbar', { name: 'Selected customers' });
    await expect(toolbar.scrollWidth).toBeLessThanOrEqual(toolbar.clientWidth);
  },
};

export const SelectAll: Story = {
  parameters: {
    docs: { description: { story: 'Presses the select-all box twice. The first press selects all twelve and brings the selection toolbar up; the second clears them and the title toolbar comes back.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const head = canvas.getByRole('checkbox', { name: 'Select all customers' });
    await userEvent.click(head);
    await expect(canvas.getAllByRole('row', { selected: true })).toHaveLength(12);
    await expect(canvas.getByRole('toolbar', { name: 'Selected customers' })).toHaveTextContent('12 selected');
    await userEvent.click(head);
    await expect(canvas.queryAllByRole('row', { selected: true })).toHaveLength(0);
    await expect(canvas.getByRole('toolbar', { name: 'Customers' })).toBeInTheDocument();
  },
};

export const ArchiveConfirm: Story = {
  args: { initialSelection: THREE },
  parameters: {
    docs: {
      description: {
        story:
          'Presses Archive. The toolbar asks "Archive 3 customers?" in the same slot, with Cancel and a danger button that repeats the number. Focus moves to Cancel, so a second Enter does nothing; Escape withdraws the question and returns focus to Archive.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await expect(canvas.getByRole('toolbar', { name: 'Selected customers' })).toHaveTextContent('Archive 3 customers?');
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await expect(canvas.getByRole('button', { name: 'Archive 3 customers' })).toBeInTheDocument();
  },
};

export const ArchiveCancelled: Story = {
  args: { initialSelection: THREE },
  parameters: {
    docs: { description: { story: 'Presses Archive, then Escape. The question goes, the three stay selected, and Archive has focus again.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('toolbar', { name: 'Selected customers' })).toHaveTextContent('3 selected');
    await expect(canvas.getByRole('button', { name: 'Archive' })).toHaveFocus();
    await expect(canvas.getAllByRole('row', { selected: true })).toHaveLength(3);
  },
};

export const Archived: Story = {
  args: { initialSelection: THREE },
  parameters: {
    docs: {
      description: {
        story:
          'Presses Archive and confirms. The three rows leave the list, the count drops to nine, the title toolbar comes back, the status line says what happened, and focus lands on the select-all box.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Archive 3 customers' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Archived 3 customers.');
    await expect(canvas.getAllByRole('row')).toHaveLength(10); // the head and nine
    await expect(canvas.queryByRole('rowheader', { name: 'Halvorsen Freight' })).not.toBeInTheDocument();
    await expect(canvas.getByRole('toolbar', { name: 'Customers' })).toHaveTextContent('9');
    await expect(canvas.getByRole('checkbox', { name: 'Select all customers' })).toHaveFocus();
  },
};

export const Exported: Story = {
  args: { initialSelection: THREE },
  parameters: {
    docs: {
      description: {
        story: 'Presses Export. The three rows are written to customers.csv, the status line says so, and the selection stays, so the same three can be archived next.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Export' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Exported 3 customers to customers.csv.');
    await expect(canvas.getAllByRole('row', { selected: true })).toHaveLength(3);
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CustomerTable } from './CustomerTable';

const THREE = ['c_01HZK3', 'c_01HZKF', 'c_01HZKZ']; // Halvorsen Freight, Monarch Dental Group, Northgate Properties

const meta = {
  title: 'Product/CustomerTable',
  component: CustomerTable,
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The customer table in Relay, with selection and bulk actions. A Toolbar with a title, a count and three compact controls over a sortable Table of twelve customers, each row with a control-column Checkbox and the head with a select-all box that goes indeterminate while the selection is partial. A selection brings up a second Toolbar in the accent tone with the count, Archive (danger), Export and Clear selection. Archive asks first: the same toolbar turns into "Archive 3 customers?" with Cancel beside the confirming button, and Escape cancels. Export hands the selected customers to onExport, or downloads a CSV without one. The screen owns the sort, the selection and the archive; the components own the markup and the states.',
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
        story: 'The table in a 768px frame with nothing selected. The toolbar wraps rather than overflowing, and the table scrolls inside its own region.',
      },
    },
  },
};

export const NarrowSelected: Story = {
  args: { initialSelection: THREE },
  decorators: Narrow.decorators,
  parameters: {
    docs: {
      description: {
        story: 'The same 768px frame with three rows selected, so the selection toolbar is up. Its three actions wrap under the count rather than overflowing the frame (rule 7).',
      },
    },
  },
};

export const Empty: Story = {
  args: { customers: [] },
  parameters: {
    docs: { description: { story: 'No customers at all. The toolbar shows a count of 0, the head of the table stays with its select-all box disabled, and an EmptyState under it says so.' } },
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
  parameters: {
    docs: {
      description: {
        story: 'Checks two rows. Each row says it with aria-selected and a tinted ground, the select-all box is indeterminate, and the selection toolbar appears with "2 selected" and the three actions.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select Halvorsen Freight' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select Monarch Dental Group' }));
    await expect(canvas.getByRole('row', { name: /Halvorsen Freight/ })).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('row', { name: /Brightwater Clinics/ })).not.toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('checkbox', { name: 'Select all customers' })).toBePartiallyChecked();
    const bar = canvas.getByRole('toolbar', { name: 'Selected customers' });
    await expect(bar).toHaveTextContent('2 selected');
    await expect(within(bar).getByRole('button', { name: 'Archive' })).toBeVisible();
    await expect(within(bar).getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(within(bar).getByRole('button', { name: 'Clear selection' })).toBeVisible();
  },
};

export const SelectAll: Story = {
  parameters: {
    docs: { description: { story: 'Presses the select-all box. All twelve rows select and the toolbar counts them; pressing it again clears them and the toolbar goes away.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const all = canvas.getByRole('checkbox', { name: 'Select all customers' });
    await userEvent.click(all);
    await expect(all).toBeChecked();
    await expect(canvas.getByRole('toolbar', { name: 'Selected customers' })).toHaveTextContent('12 selected');
    await expect(canvas.getAllByRole('row', { selected: true })).toHaveLength(12);
    await userEvent.click(all);
    await expect(all).not.toBeChecked();
    await expect(canvas.queryByRole('toolbar', { name: 'Selected customers' })).not.toBeInTheDocument();
  },
};

export const ArchiveConfirmation: Story = {
  args: { initialSelection: THREE },
  parameters: {
    docs: {
      description: {
        story: 'Three rows selected and Archive pressed once. Nothing is archived yet: the selection toolbar asks "Archive 3 customers?" with Cancel and the confirming danger button, which takes focus. Escape is Cancel and puts focus back on Archive (rule 6).',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    const bar = canvas.getByRole('toolbar', { name: 'Selected customers' });
    await expect(bar).toHaveTextContent('Archive 3 customers?');
    await expect(within(bar).getByRole('button', { name: 'Archive 3 customers' })).toHaveFocus();
    await expect(canvas.getAllByRole('row')).toHaveLength(13);
    await userEvent.keyboard('{Escape}');
    await expect(bar).toHaveTextContent('3 selected');
    await expect(within(bar).getByRole('button', { name: 'Archive' })).toHaveFocus();
    await userEvent.click(within(bar).getByRole('button', { name: 'Archive' }));
  },
};

export const Archived: Story = {
  args: { initialSelection: THREE, onArchive: fn() },
  parameters: {
    docs: {
      description: {
        story: 'Archive, then the confirming button. The three rows leave the table, the count drops to 9, the selection toolbar goes away, onArchive receives the three, and the status region announces it. Focus lands on the select-all box.',
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Archive 3 customers' }));
    await expect(canvas.queryByRole('toolbar', { name: 'Selected customers' })).not.toBeInTheDocument();
    await expect(canvas.getAllByRole('row')).toHaveLength(10);
    await expect(canvas.queryByRole('row', { name: /Halvorsen Freight/ })).not.toBeInTheDocument();
    await expect(canvas.getByRole('status')).toHaveTextContent('3 customers archived.');
    await expect(args.onArchive).toHaveBeenCalledTimes(1);
    await expect(args.onArchive).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ company: 'Monarch Dental Group' })]));
    await expect(canvas.getByRole('checkbox', { name: 'Select all customers' })).toHaveFocus();
  },
};

export const Exported: Story = {
  args: { initialSelection: THREE.slice(0, 2), onExport: fn() },
  parameters: {
    docs: {
      description: {
        story: 'Two rows selected and Export pressed. onExport receives the two customers, the selection stays, and the status region says what left. Without an onExport, the screen downloads the same rows as customers.csv.',
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Export' }));
    await expect(args.onExport).toHaveBeenCalledTimes(1);
    await expect(args.onExport).toHaveBeenCalledWith([
      expect.objectContaining({ company: 'Halvorsen Freight' }),
      expect.objectContaining({ company: 'Monarch Dental Group' }),
    ]);
    await expect(canvas.getByRole('toolbar', { name: 'Selected customers' })).toHaveTextContent('2 selected');
    await expect(canvas.getByRole('status')).toHaveTextContent('2 customers exported as CSV.');
  },
};

export const AllArchived: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Select all, Archive, confirm. The head stays with its select-all box disabled, the EmptyState under it says every customer is archived, and focus lands on Add customer, the one action left.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select all customers' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Archive' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Archive 12 customers' }));
    await expect(canvas.getAllByRole('row')).toHaveLength(1);
    await expect(canvas.getByText('All customers archived')).toBeVisible();
    await expect(canvas.getByRole('checkbox', { name: 'Select all customers' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Add customer' })).toHaveFocus();
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { StoreProvider } from '../../app/store';
import { QueueScreen } from './QueueScreen';

const meta = {
  title: 'Review/QueueScreen',
  component: QueueScreen,
  /* The table, whatever width the story browser happens to be: below 48rem
     the screen renders the list, and AsList is that story. */
  args: { list: false },
  decorators: [
    (Story) => (
      <StoreProvider>
        <Story />
      </StoreProvider>
    ),
  ],
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The review queue: every change an agent has opened, grouped by the state it is in, with the five validation lanes beside the title, then who and when. A row is one line, 40px, and the state is said once above its group, with how many, not once on every line. It is dense on purpose, because a reviewer scans it for the row that needs them rather than reading it. Below 48rem it is a list of cards instead of a table, because seven columns do not fit a phone and scrolling them sideways hides the two a reviewer decides on. The filter is a segmented control over the state, and it opens on Open, which is the question a reviewer arrives with. When a filter leaves nothing, the screen renders EmptyState rather than an empty table: on Open it says what will appear and when, and on any other filter it offers the way back. The screen owns the store and the filter; each row is a ReviewRow, or below 48rem each item is a ReviewCard.',
      },
    },
  },
} satisfies Meta<typeof QueueScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'The whole scenario queue under the Open filter: five rows in three groups, in the order a reviewer meets them (needs review, ready to accept, validating), each group headed by its state and how many.' } },
  },
  play: async ({ canvasElement }) => {
    const groups = Array.from(canvasElement.querySelectorAll('.queue__group'));
    await expect(groups.map((g) => g.textContent)).toEqual(['Needs review3', 'Ready to accept1', 'Validating1']);
    await expect(canvasElement.querySelectorAll('tbody .review-row').length).toBe(5);
  },
};

export const OneLineRows: Story = {
  parameters: {
    docs: { description: { story: 'Every row is one line tall: the title, the branch and hash after it, then the lanes, with no wrapped line. The cells carry no border of their own; the row carries one. A row measures 40px.' } },
  },
  play: async ({ canvasElement }) => {
    for (const row of Array.from(canvasElement.querySelectorAll('.review-row'))) {
      await expect(Math.round(row.getBoundingClientRect().height)).toBeLessThanOrEqual(41);
    }
    const headers = Array.from(canvasElement.querySelectorAll('thead th')).map((th) => th.textContent);
    await expect(headers).not.toContain('Status');
  },
};

export const Empty: Story = {
  args: { changes: [] },
  parameters: {
    docs: { description: { story: 'No changes at all. The Open filter has nothing to show, so the EmptyState says what will appear here and offers no action, because there is nothing a reviewer can do about an empty queue.' } },
  },
};

export const Filtered: Story = {
  parameters: {
    docs: { description: { story: 'Presses the Done filter and expects the two decided changes: one accepted, one rejected.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Done' }));
    await expect(canvas.getByRole('radio', { name: 'Done' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getAllByRole('link')).toHaveLength(2);
    await expect(canvas.getByRole('link', { name: /Close account/ })).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: /density toggle/ })).toBeInTheDocument();
    await expect(Array.from(canvasElement.querySelectorAll('.queue__group')).map((g) => g.textContent)).toEqual(['Accepted1', 'Rejected1']);
  },
};

export const KeyboardRow: Story = {
  parameters: {
    docs: { description: { story: 'Tabs from the top of the screen to the first row. The filter is one stop, the table’s scroll region is one, and then the row’s title link has focus: one stop per row, as the ReviewRow promises.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: 'Add bulk actions to the customer table' });
    for (let i = 0; i < 6 && document.activeElement !== link; i++) {
      await userEvent.tab();
    }
    await expect(link).toHaveFocus();
  },
};

export const AsList: Story = {
  args: { list: true },
  parameters: {
    docs: { description: { story: 'What a phone gets: a list of cards, not a table. The same five changes, the same filter, the same order of things in each. The list is named, each item is one link, and the filter still works.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('table')).not.toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: /Changes awaiting review/ })).toBeInTheDocument();
    await expect(canvas.getAllByRole('link')).toHaveLength(5);
    await userEvent.click(canvas.getByRole('radio', { name: 'Done' }));
    await expect(canvas.getAllByRole('link')).toHaveLength(2);
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  parameters: {
    docs: { description: { story: 'The queue in the dark theme: the status marks, the lanes and the sample badges on dark grounds, with axe on all of it.' } },
  },
};

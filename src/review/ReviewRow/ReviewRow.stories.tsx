import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeaderCell, Table } from '../../components';
import { bulkActionsWithRules, findChange, queue } from '../../data/scenario';
import type { Change, Finding } from '../../data/types';
import { ReviewRow } from './ReviewRow';

/* The scenario's changes by id, so a story names the change it shows and
   fails loudly if the scenario stops carrying it. */
function change(id: string): Change {
  const c = findChange(id);
  if (!c) throw new Error(`The scenario has no change ${id}`);
  return c;
}

function finding(id: string): Finding {
  const f = queue.flatMap((c) => c.findings).find((x) => x.id === id);
  if (!f) throw new Error(`No change in the queue has a finding ${id}`);
  return f;
}

const passed = { state: 'passed', label: 'Passed', count: 0 } as const;
const noNewStates = { state: 'passed', label: 'No new states', count: 0 } as const;

const invoicesEmptyState = change('rv-2040');

/* A change whose only lane with something to say is the visual one: the
   layout moved in two stories, nothing else did. Built on the shape of the
   invoices empty-state change. */
const visualOnly: Change = {
  ...invoicesEmptyState,
  id: 'rv-2042',
  title: 'Tighten the spacing in the invoice list header',
  branch: 'agent/invoice-header-spacing',
  commit: 'c4d1e9a',
  state: 'needs-review',
  validation: {
    visual: { state: 'changed', label: '2 changes', count: 2 },
    accessibility: passed,
    interaction: passed,
    components: noNewStates,
    tokens: passed,
  },
};

/* A change with one regression axe found, carried as a blocking finding
   so the row says "1 blocking" beside the lanes. */
const contrastRegression: Change = {
  ...invoicesEmptyState,
  id: 'rv-2043',
  title: 'Add a filter chip row above the invoice list',
  branch: 'agent/invoice-filter-chips',
  commit: '9a3b7f2',
  state: 'needs-review',
  validation: {
    visual: passed,
    accessibility: { state: 'failed', label: '1 regression', count: 1 },
    interaction: passed,
    components: noNewStates,
    tokens: passed,
  },
  findings: [finding('f3-contrast')],
};

const longTitle: Change = {
  ...invoicesEmptyState,
  id: 'rv-2044',
  title: 'Replace the hand-rolled dropdown in the customer menu with the system Menu and put its actions in a Toolbar',
  branch: 'agent/replace-customer-menu-dropdown-with-system-menu-and-toolbar-actions',
  commit: 'e2f8c10',
};

const meta = {
  title: 'Review/ReviewRow',
  component: ReviewRow,
  args: { change: invoicesEmptyState },
  decorators: [
    (Story) => (
      <Table caption="Changes awaiting review, with their validation results" interactive>
        <thead>
          <tr>
            <HeaderCell>Change</HeaderCell>
            <HeaderCell>Status</HeaderCell>
            <HeaderCell>Validation</HeaderCell>
            <HeaderCell>Agent</HeaderCell>
            <HeaderCell>Requested by</HeaderCell>
            <HeaderCell>Opened</HeaderCell>
            <HeaderCell numeric>Components</HeaderCell>
          </tr>
        </thead>
        <tbody>
          <Story />
        </tbody>
      </Table>
    ),
  ],
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'One change in the review queue, as a table row. The title is a real link, so the keyboard gets one stop per row and a screen reader names the row by it; the whole row opens the change for a pointer. The columns run in the order a reviewer decides in: the change, its state, what validation said, then who and when, so the two that decide stay on screen when the table scrolls at 768. The five validation lanes are icons with names in a fixed order, so a column of rows reads as a grid, and a count of blocking findings sits beside them because that is the one number that decides whether the change can be accepted at all. The state is a StatusIndicator whose tone says what kind of attention the row needs: amber for needs review, green for ready or accepted, red for rejected, accent for returned, and a live dot while validation is still running. Each story is one of those situations.',
      },
    },
  },
} satisfies Meta<typeof ReviewRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Clean: Story = {
  parameters: {
    docs: { description: { story: 'The invoices empty-state change: one expected visual change, every other lane passed, no findings. Ready to accept.' } },
  },
};

export const VisualRegression: Story = {
  args: { change: visualOnly },
  parameters: {
    docs: { description: { story: 'The visual lane is the only one with something to say: two stories moved. Amber, because a changed baseline is a question for a person, not a failure.' } },
  },
};

export const AccessibilityRegression: Story = {
  args: { change: contrastRegression },
  parameters: {
    docs: { description: { story: 'Axe found one regression and it is carried as a blocking finding, so the row says "1 blocking" beside the lanes. Red ink on the accessibility lane: this one cannot be accepted as it stands.' } },
  },
};

export const MultipleFindings: Story = {
  args: { change: bulkActionsWithRules },
  parameters: {
    docs: { description: { story: 'The bulk-actions change: three lanes changed, one failed, two blocking findings among seven. The row the product is built around.' } },
  },
};

export const Approved: Story = {
  args: { change: change('rv-2033') },
};

export const ReturnedToAgent: Story = {
  args: { change: change('rv-2036') },
  parameters: {
    docs: { description: { story: 'Sent back with a message. The accent tone marks it as waiting on the agent rather than on a reviewer.' } },
  },
};

export const Validating: Story = {
  args: { change: change('rv-2038') },
  parameters: {
    docs: { description: { story: 'Three lanes still running and the status dot live. Nothing to review yet; the row says so without a spinner.' } },
  },
};

export const Rejected: Story = {
  args: { change: change('rv-2029') },
};

export const LongTitle: Story = {
  args: { change: longTitle },
  parameters: {
    docs: { description: { story: 'A title past ninety characters and a branch name to match. The Change cell wraps and the row grows; the other cells keep their alignment.' } },
  },
};

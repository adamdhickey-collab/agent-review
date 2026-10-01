import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { bulkActionsWithRules, findChange } from '../../data/scenario';
import type { StoryRef } from '../../data/types';
import { StoryList } from './StoryList';

/* The bulk-actions change's four compared stories, plus the one new story
   from the invoices empty-state change, so one item carries the New badge. */
const withNew: StoryRef[] = [...bulkActionsWithRules.stories, ...(findChange('rv-2040')?.stories ?? [])];

const meta = {
  title: 'Review/StoryList',
  component: StoryList,
  args: { stories: bulkActionsWithRules.stories, onOpen: fn() },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The stories a change touches: the ones the visual run compared against a baseline, and the ones that are new and so have no baseline yet. A new story is marked, because a new story is a state nobody has compared, which is a different fact from a story that passed. Each item opens in the Storybook, with the title and story name in the button’s hidden text so the link reads whole to a screen reader. A change that renders in no story gets a compact EmptyState that says what that means: no state of it was compared or tested.',
      },
    },
  },
} satisfies Meta<typeof StoryList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'The four stories the bulk-actions change was compared in: three of the customer table, one of the invoice list it moved by accident.' } },
  },
};

export const WithNew: Story = {
  args: { stories: withNew },
  parameters: {
    docs: { description: { story: 'The same four and one new story, the invoice list’s Empty, with the New badge: it has no baseline to differ from.' } },
  },
};

export const Empty: Story = {
  args: { stories: [] },
  parameters: {
    docs: { description: { story: 'No stories at all. The EmptyState says the change was neither compared nor tested, which is a finding in itself.' } },
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { bulkActions } from '../../data/scenario';
import type { FileChange } from '../../data/types';
import { FileList } from './FileList';

/* Paths of about 110 characters: a deep product directory and a shared
   component, the two places a long path comes from. */
const longPaths: FileChange[] = [
  {
    path: 'src/product/customers/segments/enterprise/bulk-actions/components/BulkActionBarWithSelectionCountAndActions.tsx',
    status: 'added',
    additions: 41,
    deletions: 0,
    shared: false,
  },
  {
    path: 'src/components/Table/internal/selection/SelectAllHeaderCheckboxWithIndeterminateStateAndLabel.tsx',
    status: 'modified',
    additions: 9,
    deletions: 2,
    shared: true,
  },
  {
    path: 'src/product/customers/segments/enterprise/bulk-actions/legacy/BulkActionBarBeforeTheToolbarExisted.css',
    status: 'deleted',
    additions: 0,
    deletions: 38,
    shared: false,
  },
];

const meta = {
  title: 'Review/FileList',
  component: FileList,
  args: { files: bulkActions.files },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The files a change touched, each with its status letter, its path in mono and its line counts. A file under src/components is marked Shared, because an edit there is the one kind whose effect is not where the agent was looking: it changes every screen that uses the component. The status letter carries its word for a screen reader, and the counts use the diff inks, so added and removed read the same here as in the diff below.',
      },
    },
  },
} satisfies Meta<typeof FileList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'The four files of the bulk-actions change: two added, two modified, and the shared Button stylesheet marked.' } },
  },
};

export const LongPaths: Story = {
  args: { files: longPaths },
  parameters: {
    docs: { description: { story: 'Paths of 110 characters. The path truncates with an ellipsis so the badge and the counts keep their place at the end of the row; the full path is in the markup for a hover or a copy.' } },
  },
};

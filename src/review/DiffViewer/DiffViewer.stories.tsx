import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { bulkActionsWithRules } from '../../data/scenario';
import type { DiffHunk } from '../../data/types';
import { DiffViewer } from './DiffViewer';

/* A hunk whose lines run to 140 characters, which is past any column this
   diff is given: a long selector list and a long comment, the two things
   that get that wide in a stylesheet. */
const longLines: DiffHunk[] = [
  {
    file: 'src/product/customers/BulkActionBar.css',
    header: '@@ -1,4 +1,6 @@',
    lines: [
      {
        kind: 'context',
        text: '/* The bulk-action bar sits above the table when at least one row is selected; it carries the count and the three actions. */',
      },
      {
        kind: 'remove',
        text: '.bulk-bar__btn, .bulk-bar__btn:hover, .bulk-bar__btn:focus-visible, .bulk-bar__btn:active, .bulk-bar__btn[aria-pressed="true"] { padding: 10px 14px; }',
        findingId: 'f3-tokens',
      },
      {
        kind: 'add',
        text: '.bulk-bar__btn, .bulk-bar__btn:hover, .bulk-bar__btn:focus-visible, .bulk-bar__btn:active, .bulk-bar__btn[aria-pressed="true"] { padding: 0 var(--space-2); }',
      },
      {
        kind: 'add',
        text: '.bulk-bar__count { color: var(--color-text-secondary); font-size: var(--text-sm); font-variant-numeric: tabular-nums; white-space: nowrap; }',
      },
    ],
  },
];

const meta = {
  title: 'Review/DiffViewer',
  component: DiffViewer,
  args: { hunks: bulkActionsWithRules.diff, onSelectFinding: fn() },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'A unified diff, kept small on purpose: the excerpts a finding points at, not the whole patch, because the review is about what the checks found rather than about reading every line. Added and removed lines sit on the diff grounds, and a line a finding is about carries a marker that is a button, so the diff can open the finding as readily as the finding can show the line. The selected finding’s lines are emphasised and their markers say aria-pressed. Each hunk is a real table with a hidden caption, so a row is a row to a screen reader, and the sign column is hidden from it in favour of a spoken "Added" or "Removed".',
      },
    },
  },
} satisfies Meta<typeof DiffViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'The scenario’s two hunks: the one-line change to the shared Button stylesheet and the new bar’s stylesheet, with five lines marked.' } },
  },
};

export const WithSelectedFinding: Story = {
  args: { selectedFindingId: 'f3-tokens' },
  parameters: {
    docs: { description: { story: 'The contrast finding selected: its one line, the muted ink, is emphasised and its marker is pressed. The other marked lines stay at their resting weight.' } },
  },
};

export const Empty: Story = {
  args: { hunks: [] },
  parameters: {
    docs: { description: { story: 'No excerpts. One quiet sentence rather than an empty table; a change whose findings point at no lines, like a rename, lands here.' } },
  },
};

export const LongLines: Story = {
  args: { hunks: longLines },
  parameters: {
    docs: { description: { story: 'Lines of 140 characters. Code does not wrap, because a wrapped selector is a different selector to the eye, so the line has to scroll sideways. As the stylesheet stands it does not: .diff__file hides its overflow and nothing in the viewer scrolls, so the end of each line is cut off. The story exists so that is visible.' } },
  },
};

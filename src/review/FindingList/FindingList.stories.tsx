import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { bulkActionsWithRules, queue } from '../../data/scenario';
import type { Finding } from '../../data/types';
import { FindingList } from './FindingList';

const findings = bulkActionsWithRules.findings;
const all = queue.flatMap((c) => c.findings);

function finding(id: string): Finding {
  const f = all.find((x) => x.id === id);
  if (!f) throw new Error(`No change in the queue has a finding ${id}`);
  return f;
}

/* A finding can be returned when it carries a correction. The interaction
   finding is the one that cannot: its correction is empty, because the
   tests passed and there is nothing to send back. */
const returnableIds = findings.filter((f) => f.correction.length > 0).map((f) => f.id);

const meta = {
  title: 'Review/FindingList',
  component: FindingList,
  args: {
    findings,
    included: new Set<string>(),
    onSelect: fn(),
    onInclude: fn(),
    onOpenStory: fn(),
  },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The spine of a review: every finding, in severity order, with one open at a time. Blocking first, then the ones that need a decision, then notes, so the order on the page is the order a reviewer should read. Each item is a button that opens its evidence and the correction it would send; the open one is a region named by the finding’s title, and the button says aria-expanded. Beside each returnable finding is a checkbox that includes it in the return message, which is how the reviewer composes that message by choosing rather than by typing. A finding with no correction, like a passed interaction run, gets no box, because there is nothing to send. With no findings at all the list gives way to a compact EmptyState that says the change can be accepted as it is.',
      },
    },
  },
} satisfies Meta<typeof FindingList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'All seven findings from the bulk-actions change, none open and none included yet. Two blocking, three decisions, two notes.' } },
  },
};

export const OneOpen: Story = {
  args: { selectedId: 'f1-shared-table' },
  parameters: {
    docs: { description: { story: 'The contrast finding open: its summary, the axe evidence and the correction it would send. The others stay closed.' } },
  },
};

export const ComponentFinding: Story = {
  args: { findings: [finding('f3-local-button')], selectedId: 'f3-local-button' },
  parameters: {
    docs: { description: { story: 'A component finding: what the agent wrote beside what the system already has, with the story to open.' } },
  },
};

export const TokenFinding: Story = {
  args: { findings: [finding('f3-tokens')], selectedId: 'f3-tokens' },
  parameters: {
    docs: { description: { story: 'A token finding: the literal the agent wrote against the two steps of the scale it falls between.' } },
  },
};

export const VisualFinding: Story = {
  args: { findings: [finding('f3-overflow')], selectedId: 'f3-overflow' },
  parameters: {
    docs: { description: { story: 'A visual finding: the story, the pixels that moved, and whether the change was asked for.' } },
  },
};

export const StateFinding: Story = {
  args: { findings: [finding('f1-states')], selectedId: 'f1-states' },
  parameters: {
    docs: { description: { story: 'A state finding, a note: two states exist and neither has a story, so neither is tested or compared.' } },
  },
};

export const InteractionFinding: Story = {
  args: { findings: [finding('f1-interaction')], selectedId: 'f1-interaction' },
  parameters: {
    docs: { description: { story: 'The interaction tests passed. There is no checkbox, because the correction is empty and there is nothing to return; the item exists so the reviewer sees the tests ran.' } },
  },
};

export const Empty: Story = {
  args: { findings: [] },
  parameters: {
    docs: { description: { story: 'No findings. The list renders the compact EmptyState instead of an empty list.' } },
  },
};

export const Included: Story = {
  args: { included: new Set(returnableIds) },
  parameters: {
    docs: { description: { story: 'Every returnable finding checked for the return message. The interaction finding has no box, so six of seven are included.' } },
  },
};

export const SeverityIsAWord: Story = {
  parameters: {
    docs: { description: { story: 'The severity is a word in its own ink, not a tinted pill: the marker beside the title says it by shape, and a column of identical pills was the loudest thing in the list. Every finding still carries its word, so a reader who cannot tell the inks apart loses nothing. A row is about 54px with its one-line title.' } },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.finding__meta .badge').length).toBe(0);
    const words = Array.from(canvasElement.querySelectorAll('.finding__severity')).map((e) => e.textContent);
    await expect(words.length).toBe(findings.length);
    for (const w of words) await expect(['Blocking', 'Needs a decision', 'Note']).toContain(w);
    const first = canvasElement.querySelector('.finding__row') as HTMLElement;
    await expect(first.getBoundingClientRect().height).toBeLessThanOrEqual(56);
  },
};

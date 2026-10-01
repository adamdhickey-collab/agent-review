import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { queue } from '../../data/scenario';
import type { Finding } from '../../data/types';
import { FindingEvidence } from './FindingEvidence';

function finding(id: string): Finding {
  const f = queue.flatMap((c) => c.findings).find((x) => x.id === id);
  if (!f) throw new Error(`No change in the queue has a finding ${id}`);
  return f;
}

const meta = {
  title: 'Review/FindingEvidence',
  component: FindingEvidence,
  args: { finding: finding('f3-local-button'), onOpenStory: fn() },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The evidence for one finding, in the shape that kind of finding needs. A reviewer deciding about a local button wants to see what was written beside what the system already has; one deciding about a literal wants the value against the scale it fell between; one reading a contrast failure wants the measurement against the floor and what axe actually said. So this is one component with six shapes, by the evidence’s kind: component, token, accessibility, visual, state and interaction. Each shape puts the fact first and the words second, and where a story exists, offers it as a button that opens it in the Storybook. The six stories are the six shapes, each on the scenario’s own finding of that kind.',
      },
    },
  },
} satisfies Meta<typeof FindingEvidence>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Component: Story = {
  parameters: {
    docs: { description: { story: 'Agent wrote, beside System has: the raw button excerpt against Button / secondary / compact, with the story that shows it.' } },
  },
};

export const Token: Story = {
  args: { finding: finding('f3-tokens') },
  parameters: {
    docs: { description: { story: 'The literal with its file and line, then the two tokens it falls between and the note that no token produces it.' } },
  },
};

export const Accessibility: Story = {
  args: { finding: finding('f3-contrast') },
  parameters: {
    docs: { description: { story: 'The measured ratio in red against the floor, the axe rule with its impact as a badge, the element, and the message verbatim.' } },
  },
};

export const Visual: Story = {
  args: { finding: finding('f1-visual') },
  parameters: {
    docs: { description: { story: 'The story that moved, the pixel count and the fraction of the frame, a badge saying the change was not asked for, and where the difference is in words.' } },
  },
};

export const State: Story = {
  args: { finding: finding('f1-states') },
  parameters: {
    docs: { description: { story: 'The component, its new state, how a person reaches it, and a TestStatus saying whether a story covers it.' } },
  },
};

export const Interaction: Story = {
  args: { finding: finding('f1-interaction') },
  parameters: {
    docs: { description: { story: 'The tests that ran, each with its state as an icon and its time. All three passed.' } },
  },
};

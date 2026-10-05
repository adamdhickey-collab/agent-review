import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { bulkActionsWithRules } from '../../data/scenario';
import type { ValidationSummary as Summary } from '../../data/types';
import { ValidationSummary } from './ValidationSummary';

const allPassed: Summary = {
  visual: { state: 'passed', label: 'No changes', count: 0 },
  accessibility: { state: 'passed', label: 'Passed', count: 0 },
  interaction: { state: 'passed', label: 'Passed', count: 0 },
  components: { state: 'passed', label: 'No new states', count: 0 },
  tokens: { state: 'passed', label: 'Passed', count: 0 },
};

const allRunning: Summary = {
  visual: { state: 'running', label: 'Running', count: 0 },
  accessibility: { state: 'running', label: 'Running', count: 0 },
  interaction: { state: 'running', label: 'Running', count: 0 },
  components: { state: 'running', label: 'Running', count: 0 },
  tokens: { state: 'running', label: 'Running', count: 0 },
};

const meta = {
  title: 'Review/ValidationSummary',
  component: ValidationSummary,
  args: { summary: bulkActionsWithRules.validation },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'Five lanes on one line, each a check’s answer in two words: what the visual run found, what axe found, whether the interaction tests passed, what the components lane saw, what the token lint saw. The hierarchy comes from the state rather than from size: a failed lane is red ink, a changed lane amber, a passed lane quiet, so a reviewer’s eye lands on the lane that needs it without any lane shouting. There are no cards and no numerals set large, because five numbers in boxes would make every change look like a dashboard. When the screen passes onSelect, each lane is a toggle button that filters the findings below it, and the pressed one says so with aria-pressed; without it, the lanes are plain text.',
      },
    },
  },
} satisfies Meta<typeof ValidationSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllPassed: Story = {
  args: { summary: allPassed },
  parameters: {
    docs: { description: { story: 'Every lane quiet. This is what a change that can be accepted as it is looks like, and it is deliberately unremarkable.' } },
  },
};

export const Mixed: Story = {
  parameters: {
    docs: { description: { story: 'The bulk-actions change: three lanes changed, one failed, one passed. The red lane is the one to read first.' } },
  },
};

export const AllRunning: Story = {
  args: { summary: allRunning },
  parameters: {
    docs: { description: { story: 'Validation still in progress. Each lane says Running in the muted tone; nothing claims a result it does not have yet.' } },
  },
};

export const Selectable: Story = {
  render: function Render(args) {
    const [active, setActive] = useState<keyof Summary | undefined>();
    return <ValidationSummary {...args} active={active} onSelect={setActive} />;
  },
  parameters: {
    docs: { description: { story: 'With onSelect wired, each lane is a toggle. Pressing a lane filters to its findings and marks it aria-pressed; pressing it again clears the filter. The play presses Accessibility and checks the state.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lane = canvas.getByRole('button', { name: /^Accessibility/ });
    await expect(lane).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(lane);
    await expect(lane).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: /^Visual/ })).toHaveAttribute('aria-pressed', 'false');
  },
};

export const OneLine: Story = {
  parameters: {
    docs: { description: { story: 'Each lane is its name and its answer on one line, "Visual  4 changes", at the control height. They were stacked, a name over its answer in a 7.5rem box, which made the strip 73px tall for five short facts. On a phone, where half a row cannot hold both, they stack again.' } },
  },
  play: async ({ canvasElement }) => {
    for (const lane of Array.from(canvasElement.querySelectorAll('.validation__lane'))) {
      await expect(Math.round(lane.getBoundingClientRect().height)).toBeLessThanOrEqual(32);
    }
  },
};

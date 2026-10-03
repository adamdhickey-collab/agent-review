import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import type { CSSProperties } from 'react';
import { TestStatus } from './TestStatus';

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' };

const meta = {
  title: 'System/TestStatus',
  component: TestStatus,
  args: { state: 'passed' },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The result of a check, as an icon with a name and a word. The five states are five different things a reviewer has to do: passed needs nothing, changed needs a look, failed blocks, running is not an answer yet, and skipped is a check that did not run and says so rather than passing quietly. Each has its own shape as well as its own colour (a disc, a triangle, an octagon, an open arc, a dashed ring), and the three that are answers are drawn solid at 16px, because a queue row is five of these with no word beside them. The label can be replaced with what the check found ("3 changes") when the count is the news; the icon keeps the state. Icon-only keeps the word as the icon\'s accessible name.',
      },
    },
  },
} satisfies Meta<typeof TestStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Passed: Story = { args: { state: 'passed' } };
export const Changed: Story = {
  args: { state: 'changed' },
  parameters: {
    docs: { description: { story: 'The check found something a person has to look at. The caution triangle, solid, in the warning ink, with the word beside it. It is not the ring with a dot it used to be: a reader could not tell what that was saying, and it is the one state that is neither good nor bad news.' } },
  },
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('.test-status svg');
    await expect(icon).toHaveAttribute('data-icon', 'status-changed');
  },
};
export const Failed: Story = { args: { state: 'failed' } };
export const Running: Story = {
  args: { state: 'running' },
  parameters: {
    docs: { description: { story: 'Not an answer yet: an open arc on a faint track, turning, in the accent. It is the one state that is happening now, so it does not share the grey of the check that did not run. The turn stops under prefers-reduced-motion.' } },
  },
};
export const Skipped: Story = {
  args: { state: 'skipped' },
  parameters: {
    docs: { description: { story: 'The check did not run: an empty dashed ring, in the muted ink. Empty, because there is no result in it, and not solid, so it cannot be mistaken for one of the three answers.' } },
  },
};

export const WithLabels: Story = {
  render: () => (
    <div style={row}>
      <TestStatus state="changed" label="3 changes" />
      <TestStatus state="failed" label="1 regression" />
      <TestStatus state="passed" label="12 passed" />
      <TestStatus state="skipped" label="Not run" />
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
      <div style={row} data-ground="plain">
        <TestStatus state="passed" iconOnly />
        <TestStatus state="changed" iconOnly />
        <TestStatus state="failed" iconOnly />
        <TestStatus state="running" iconOnly />
        <TestStatus state="skipped" iconOnly />
      </div>
      <div
        style={{ ...row, gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-accent-subtle)' }}
        data-ground="selected"
      >
        <TestStatus state="changed" iconOnly />
        <TestStatus state="passed" iconOnly />
        <TestStatus state="passed" iconOnly />
        <TestStatus state="failed" iconOnly />
        <TestStatus state="skipped" iconOnly />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The word is gone from the screen and lives in the SVG\'s title, so the icon is an image with a name rather than a decoration. This is where the shapes do the work: with no word beside them the five have to differ by outline, and the three answers by a solid one. The second row is a queue row\'s five checks on the selected tint: the mark inside each solid shape is a hole, not a white mark, so it takes the row\'s colour and the icon reads as one piece on any ground.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const icons = [...canvasElement.querySelectorAll('[data-ground="plain"] .test-status svg')];
    /* One drawing per state, and each one names itself. */
    const names = icons.map((i) => i.getAttribute('data-icon'));
    await expect(new Set(names).size).toBe(5);
    await expect(icons.map((i) => i.querySelector('title')?.textContent)).toEqual(['Passed', 'Changed', 'Failed', 'Running', 'Skipped']);
    /* The three answers are filled shapes; the two that are not are rings. */
    await expect(icons.map((i) => i.getAttribute('fill'))).toEqual(['currentColor', 'currentColor', 'currentColor', 'none', 'none']);
    for (const icon of icons) await expect(icon).toHaveAttribute('width', '16');
    /* The cut is a hole: one even-odd path and nothing painted over it. */
    const onTint = canvasElement.querySelectorAll('[data-ground="selected"] svg[fill="currentColor"]');
    await expect(onTint.length).toBe(4);
    for (const icon of onTint) {
      await expect(icon.children.length).toBe(2);
      await expect(icon.querySelector('path')).toHaveAttribute('fill-rule', 'evenodd');
    }
  },
};

const SUMMARY: { check: string; state: 'passed' | 'changed' | 'failed'; label?: string }[] = [
  { check: 'Visual', state: 'changed', label: '3 changes' },
  { check: 'Accessibility', state: 'failed', label: '1 regression' },
  { check: 'Interaction', state: 'passed' },
  { check: 'Components', state: 'changed', label: '2 new states' },
  { check: 'Tokens', state: 'changed', label: '1 deviation' },
];

export const Summary: Story = {
  render: () => (
    <ul style={{ ...row, gap: 'var(--space-6)' }}>
      {SUMMARY.map((s) => (
        <li key={s.check} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{s.check}</span>
          <TestStatus state={s.state} label={s.label} />
        </li>
      ))}
    </ul>
  ),
  parameters: {
    docs: { description: { story: 'The five checks of one review in a row, each with its state and what it found. This is the strip a reviewer reads first.' } },
  },
};

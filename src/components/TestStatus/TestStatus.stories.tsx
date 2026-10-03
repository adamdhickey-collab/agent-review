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
          'The result of a check, as an icon with a name and a word. The five states are five different things a reviewer has to do: passed needs nothing, changed needs a look, failed blocks, running is not an answer yet, and skipped is a check that did not run and says so rather than passing quietly. The label can be replaced with what the check found ("3 changes") when the count is the news; the icon keeps the state. Icon-only keeps the word as the icon\'s accessible name.',
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
    docs: { description: { story: 'The check found something a person has to look at. The caution triangle, in the warning ink, with the word beside it. It is not the ring with a dot it used to be: a reader could not tell what that was saying, and it is the one state that is neither good nor bad news.' } },
  },
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('.test-status svg');
    await expect(icon).toHaveAttribute('data-icon', 'alert');
  },
};
export const Failed: Story = { args: { state: 'failed' } };
export const Running: Story = { args: { state: 'running' } };
export const Skipped: Story = { args: { state: 'skipped' } };

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
    <div style={row}>
      <TestStatus state="passed" iconOnly />
      <TestStatus state="changed" iconOnly />
      <TestStatus state="failed" iconOnly />
      <TestStatus state="running" iconOnly />
      <TestStatus state="skipped" iconOnly />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'The word is gone from the screen and lives in the SVG\'s title, so the icon is an image with a name rather than a decoration.' } },
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
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>{s.check}</span>
          <TestStatus state={s.state} label={s.label} />
        </li>
      ))}
    </ul>
  ),
  parameters: {
    docs: { description: { story: 'The five checks of one review in a row, each with its state and what it found. This is the strip a reviewer reads first.' } },
  },
};

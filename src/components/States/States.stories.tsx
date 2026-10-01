import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { EmptyState, ErrorState, LoadingState } from './States';

const panel: CSSProperties = {
  border: 'var(--border-width) solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface)',
};

const meta = {
  title: 'System/States',
  component: EmptyState,
  args: { title: 'No findings' },
  decorators: [
    (Story) => (
      <div style={panel}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The three states a region has when it has no content: nothing yet (empty), not yet (loading) and could not (error). Each says what happened and what to do in one shape, so a screen never improvises a spinner, a "No results" line or red text. Loading is a polite status, so it is announced without interrupting. Error is an alert, because it arrives after the fact and a screen reader should hear it; its detail line is the message the system gave, in mono, for someone who can use it.',
      },
    },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { title: 'No findings', description: 'The change matches the baseline on every story it rendered.' },
};

export const EmptyWithAction: Story = {
  args: { icon: 'search', title: 'No customers match', description: 'Clear the filter to see all 12.', action: { label: 'Clear filter', onClick: () => {} } },
};

export const Loading: Story = {
  render: () => <LoadingState title="Rendering stories" description="Four stories at three widths, against their baselines." />,
};

export const Error: Story = {
  render: () => (
    <ErrorState
      title="The baseline did not load"
      description="Relay's main branch could not be fetched, so there is nothing to compare against."
      action={{ label: 'Try again', onClick: () => {} }}
    />
  ),
};

export const ErrorWithDetail: Story = {
  render: () => (
    <ErrorState
      title="The review could not be opened"
      description="The server answered, but not with the review."
      detail="GET /api/reviews/rv_01HZK3 502"
      action={{ label: 'Try again', onClick: () => {} }}
    />
  ),
};

export const Compact: Story = {
  decorators: [
    (Story) => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--space-3)' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <div style={panel}>
        <EmptyState compact title="No findings" description="Nothing moved." />
      </div>
      <div style={panel}>
        <LoadingState compact title="Rendering" />
      </div>
      <div style={panel}>
        <ErrorState compact title="Could not render" detail="ECONNREFUSED 6006" action={{ label: 'Retry', onClick: () => {} }} />
      </div>
    </>
  ),
  parameters: {
    docs: { description: { story: 'All three at the compact padding, for a panel rather than a page.' } },
  },
};

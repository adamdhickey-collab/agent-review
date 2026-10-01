import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { Cell, HeaderCell, Row, Table } from '../Table/Table';
import { StatusIndicator } from './StatusIndicator';

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-4)' };

const meta = {
  title: 'System/StatusIndicator',
  component: StatusIndicator,
  args: { tone: 'success', label: 'Passing' },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'A dot and a word, for the state of something that persists: a service, a review, a check that runs on a schedule. The dot is the glance and the word is the meaning, and the word is always in the tree, visually hidden at most, so a screen reader gets it. Live adds a pulse for something still changing, and the pulse stops under prefers-reduced-motion because it is ambient, not information.',
      },
    },
  },
} satisfies Meta<typeof StatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  render: () => (
    <div style={row}>
      <StatusIndicator tone="neutral" label="Idle" />
      <StatusIndicator tone="accent" label="Reviewing" />
      <StatusIndicator tone="success" label="Passing" />
      <StatusIndicator tone="warning" label="Needs a look" />
      <StatusIndicator tone="danger" label="Failing" />
    </div>
  ),
};

export const Live: Story = {
  args: { tone: 'accent', label: 'Running checks', live: true },
};

export const DotOnly: Story = {
  args: { tone: 'success', label: 'Passing', dotOnly: true },
  parameters: {
    docs: { description: { story: 'The word is visually hidden, for a tight column. It is still the accessible text; the dot alone is never the state.' } },
  },
};

export const InTable: Story = {
  render: () => (
    <Table caption="Checks, with their current state and last run">
      <thead>
        <tr>
          <HeaderCell>Check</HeaderCell>
          <HeaderCell>State</HeaderCell>
          <HeaderCell>Last run</HeaderCell>
        </tr>
      </thead>
      <tbody>
        <Row>
          <Cell rowHeader>Visual</Cell>
          <Cell><StatusIndicator tone="warning" label="Needs a look" /></Cell>
          <Cell muted>2 min ago</Cell>
        </Row>
        <Row>
          <Cell rowHeader>Accessibility</Cell>
          <Cell><StatusIndicator tone="danger" label="Failing" /></Cell>
          <Cell muted>2 min ago</Cell>
        </Row>
        <Row>
          <Cell rowHeader>Interaction</Cell>
          <Cell><StatusIndicator tone="accent" label="Running" live /></Cell>
          <Cell muted>Now</Cell>
        </Row>
        <Row>
          <Cell rowHeader>Tokens</Cell>
          <Cell><StatusIndicator tone="success" label="Passing" /></Cell>
          <Cell muted>14 min ago</Cell>
        </Row>
      </tbody>
    </Table>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { Badge } from './Badge';

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' };

const meta = {
  title: 'System/Badge',
  component: Badge,
  args: { children: 'Active', tone: 'neutral' },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'A small label with a tone, for a status word in a row or a count beside a name. The tone is meaning and nothing else: neutral says nothing, accent marks the thing in hand, success is a pass, warning is a change that needs a look, danger is a failure. A badge is never the only place a state is said; its own text says it, so a reader who cannot see the tint loses nothing. Outline is for a badge inside a row that is already tinted; mono is for a value a machine wrote.',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  render: () => (
    <div style={row}>
      <Badge tone="neutral">Churned</Badge>
      <Badge tone="accent">Trial</Badge>
      <Badge tone="success">Active</Badge>
      <Badge tone="warning">Past due</Badge>
      <Badge tone="danger">Failed</Badge>
    </div>
  ),
};

export const Outline: Story = {
  render: () => (
    <div style={{ ...row, padding: 'var(--space-3)', background: 'var(--color-accent-subtle)', borderRadius: 'var(--radius-md)' }}>
      <Badge variant="outline" tone="neutral">Churned</Badge>
      <Badge variant="outline" tone="accent">Trial</Badge>
      <Badge variant="outline" tone="success">Active</Badge>
      <Badge variant="outline" tone="warning">Past due</Badge>
      <Badge variant="outline" tone="danger">Failed</Badge>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'On a tinted ground, a tinted badge disappears; the outline keeps the ink and drops the fill. Shown here on the accent-subtle ground a selected row uses.' } },
  },
};

export const WithIcon: Story = {
  render: () => (
    <div style={row}>
      <Badge tone="success" icon="status-passed">Passed</Badge>
      <Badge tone="warning" icon="alert">3 changes</Badge>
      <Badge tone="danger" icon="alert">1 regression</Badge>
      <Badge tone="neutral" icon="git-branch">feature/bulk-actions</Badge>
    </div>
  ),
};

export const Large: Story = {
  render: () => (
    <div style={row}>
      <Badge size="large" tone="success" icon="status-passed">Token lint: 7 of 7 passed</Badge>
      <Badge size="large" tone="neutral" icon="status-inconclusive">Axe: 6 of 7 passed, 1 inconclusive</Badge>
      <Badge size="large" tone="danger" icon="status-failed">Visual baselines: 1 failed</Badge>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'The large size, for a badge that is the content: the compact control’s height, the small type and a 14px icon. The delegated work’s account shows each check as one of these, with its count.' } },
  },
};

export const Mono: Story = {
  render: () => (
    <div style={row}>
      <Badge mono>e4f1a9c</Badge>
      <Badge mono tone="accent">--space-3</Badge>
      <Badge mono tone="danger">10px</Badge>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'A commit hash and a token name. Mono is for anything a machine wrote, at the regular weight, so a hash reads as a hash and a token as a token.' } },
  },
};

export const InRow: Story = {
  render: () => (
    <p style={{ maxWidth: '48ch', lineHeight: 'var(--leading-body)' }}>
      Halvorsen Freight is <Badge tone="success">Active</Badge> on the <Badge>Scale</Badge> plan. The agent&apos;s change,{' '}
      <Badge mono>e4f1a9c</Badge>, touched this row and left it with <Badge tone="warning">1 deviation</Badge> against the token
      layer, which is <Badge tone="accent">under review</Badge>.
    </p>
  ),
  parameters: {
    docs: { description: { story: 'Several badges inline in a sentence. Vertical-align middle and a fixed height keep them on the line rather than pushing it apart.' } },
  },
};

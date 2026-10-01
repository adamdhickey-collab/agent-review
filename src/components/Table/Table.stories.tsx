import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties } from 'react';
import { Checkbox } from '../Checkbox/Checkbox';
import { IconButton } from '../IconButton/IconButton';
import { EmptyState, LoadingState } from '../States/States';
import { Cell, HeaderCell, Row, Table, type SortDirection } from './Table';

interface Account {
  id: string;
  company: string;
  owner: string;
  seats: number;
  mrr: number;
}

const ACCOUNTS: Account[] = [
  { id: 'a1', company: 'Halvorsen Freight', owner: 'Priya Natarajan', seats: 48, mrr: 3840 },
  { id: 'a2', company: 'Brightwater Clinics', owner: 'Tomas Reyes', seats: 22, mrr: 1320 },
  { id: 'a3', company: 'Alder & Finch', owner: 'Priya Natarajan', seats: 5, mrr: 0 },
  { id: 'a4', company: 'Monarch Dental Group', owner: 'Dana Whitfield', seats: 17, mrr: 1020 },
  { id: 'a5', company: 'Pinecrest Credit Union', owner: 'Priya Natarajan', seats: 110, mrr: 8800 },
];

const mrr = (n: number) => (n === 0 ? '—' : `$${n.toLocaleString('en-US')}`);

/* A panel the way a screen frames a table: a surface with a hairline. */
const panel: CSSProperties = {
  border: 'var(--border-width) solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface)',
  overflow: 'hidden',
};

function Head() {
  return (
    <thead>
      <tr>
        <HeaderCell>Company</HeaderCell>
        <HeaderCell>Owner</HeaderCell>
        <HeaderCell numeric>Seats</HeaderCell>
        <HeaderCell numeric>MRR</HeaderCell>
      </tr>
    </thead>
  );
}

function Body({ rows = ACCOUNTS }: { rows?: Account[] }) {
  return (
    <tbody>
      {rows.map((a) => (
        <Row key={a.id}>
          <Cell rowHeader>{a.company}</Cell>
          <Cell muted>{a.owner}</Cell>
          <Cell numeric>{a.seats}</Cell>
          <Cell numeric>{mrr(a.mrr)}</Cell>
        </Row>
      ))}
    </tbody>
  );
}

const meta = {
  title: 'System/Table',
  component: Table,
  args: { caption: 'Accounts, with owner, seats and monthly revenue', children: null },
  render: (args) => (
    <Table {...args}>
      <Head />
      <Body />
    </Table>
  ),
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The table primitives: a real table with a caption, sortable headers that announce their direction, numeric cells that align right in tabular figures, a control column for a checkbox, and two densities. A row can be selected, and the row\'s ground says so along with aria-selected. Nothing here fetches, sorts or pages; those belong to the screen, because a table that did them would be a different component for every screen. The wrapper scrolls sideways when the columns are wider than the frame, which is the one width behaviour a table needs.',
      },
    },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

type SortKey = keyof Omit<Account, 'id'>;

export const Sortable: Story = {
  render: function Render(args) {
    const [key, setKey] = useState<SortKey>('company');
    const [direction, setDirection] = useState<Exclude<SortDirection, 'none'>>('ascending');
    const rows = [...ACCOUNTS].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return direction === 'ascending' ? cmp : -cmp;
    });
    const sortFor = (k: SortKey): SortDirection => (k === key ? direction : 'none');
    const toggle = (k: SortKey) => {
      if (k === key) setDirection(direction === 'ascending' ? 'descending' : 'ascending');
      else {
        setKey(k);
        setDirection('ascending');
      }
    };
    return (
      <Table {...args}>
        <thead>
          <tr>
            <HeaderCell sort={sortFor('company')} onSort={() => toggle('company')}>Company</HeaderCell>
            <HeaderCell sort={sortFor('owner')} onSort={() => toggle('owner')}>Owner</HeaderCell>
            <HeaderCell numeric sort={sortFor('seats')} onSort={() => toggle('seats')}>Seats</HeaderCell>
            <HeaderCell numeric sort={sortFor('mrr')} onSort={() => toggle('mrr')}>MRR</HeaderCell>
          </tr>
        </thead>
        <Body rows={rows} />
      </Table>
    );
  },
  parameters: {
    docs: { description: { story: 'The screen holds the sort key and direction; each header says its own with aria-sort and a hidden suffix. Press a header to sort by it, again to reverse.' } },
  },
};

export const Compact: Story = {
  args: { density: 'compact' },
};

export const SelectedRows: Story = {
  render: function Render(args) {
    const [selected, setSelected] = useState<Set<string>>(new Set(['a1', 'a4']));
    const all = selected.size === ACCOUNTS.length;
    const some = selected.size > 0 && !all;
    const toggle = (id: string, on: boolean) => {
      const next = new Set(selected);
      if (on) next.add(id);
      else next.delete(id);
      setSelected(next);
    };
    return (
      <Table {...args}>
        <thead>
          <tr>
            <HeaderCell control>
              <Checkbox
                label="Select all accounts"
                hideLabel
                checked={all}
                indeterminate={some}
                onChange={(e) => setSelected(e.currentTarget.checked ? new Set(ACCOUNTS.map((a) => a.id)) : new Set())}
              />
            </HeaderCell>
            <HeaderCell>Company</HeaderCell>
            <HeaderCell>Owner</HeaderCell>
            <HeaderCell numeric>Seats</HeaderCell>
            <HeaderCell numeric>MRR</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {ACCOUNTS.map((a) => (
            <Row key={a.id} selected={selected.has(a.id)}>
              <Cell control>
                <Checkbox label={`Select ${a.company}`} hideLabel checked={selected.has(a.id)} onChange={(e) => toggle(a.id, e.currentTarget.checked)} />
              </Cell>
              <Cell rowHeader>{a.company}</Cell>
              <Cell muted>{a.owner}</Cell>
              <Cell numeric>{a.seats}</Cell>
              <Cell numeric>{mrr(a.mrr)}</Cell>
            </Row>
          ))}
        </tbody>
      </Table>
    );
  },
  parameters: {
    docs: { description: { story: 'Two rows selected through control cells. The row says it with aria-selected and a tinted ground; the checkbox says it too, and the select-all box is indeterminate while the selection is partial.' } },
  },
};

export const Interactive: Story = {
  args: { interactive: true },
  render: function Render(args) {
    const [opened, setOpened] = useState<string | null>(null);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Table {...args}>
          <thead>
            <tr>
              <HeaderCell>Company</HeaderCell>
              <HeaderCell>Owner</HeaderCell>
              <HeaderCell numeric>Seats</HeaderCell>
              <HeaderCell numeric>MRR</HeaderCell>
              <HeaderCell control>
                <span className="visually-hidden">Open</span>
              </HeaderCell>
            </tr>
          </thead>
          <tbody>
            {ACCOUNTS.map((a) => (
              <Row key={a.id} onClick={() => setOpened(a.company)}>
                <Cell rowHeader>{a.company}</Cell>
                <Cell muted>{a.owner}</Cell>
                <Cell numeric>{a.seats}</Cell>
                <Cell numeric>{mrr(a.mrr)}</Cell>
                <Cell control>
                  <IconButton icon="arrow-up-right" label={`Open ${a.company}`} size="compact" onClick={(e) => { e.stopPropagation(); setOpened(a.company); }} />
                </Cell>
              </Row>
            ))}
          </tbody>
        </Table>
        <p role="status" style={{ color: 'var(--color-text-secondary)' }}>{opened ? `Opened ${opened}.` : 'Nothing opened yet.'}</p>
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Rows take a hover ground and a pointer, and the screen handles the press. Each row also carries a compact icon button in a control cell, so the same action is reachable by keyboard; a row press alone would be pointer-only.' } },
  },
};

export const Empty: Story = {
  render: (args) => (
    <div style={panel}>
      <Table {...args}>
        <Head />
      </Table>
      <EmptyState title="No accounts match" description="Clear the filter to see all 12." action={{ label: 'Clear filter', onClick: () => {} }} />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'The head stays, so the columns are still named, and the EmptyState below says what to do. The table never improvises a "No results" row.' } },
  },
};

export const Loading: Story = {
  render: (args) => (
    <div style={panel}>
      <Table {...args}>
        <Head />
      </Table>
      <LoadingState title="Loading accounts" description="Reading 12 rows from Relay." />
    </div>
  ),
};

const METRICS = Array.from({ length: 36 }, (_, i) => `Metric ${i + 1}`);
const LONG: Account[] = [
  { id: 'l1', company: 'The Halvorsen Freight and Intermodal Logistics Company of Greater Duluth, Minnesota', owner: 'Priya Natarajan', seats: 48, mrr: 3840 },
  { id: 'l2', company: 'Brightwater Clinics, Outpatient Imaging and Diagnostic Services Partnership', owner: 'Tomas Reyes', seats: 22, mrr: 1320 },
  { id: 'l3', company: 'Pinecrest Federal Credit Union and Community Savings Cooperative', owner: 'Dana Whitfield', seats: 110, mrr: 8800 },
];

export const LongContent: Story = {
  render: (args) => (
    <Table {...args}>
      <thead>
        <tr>
          <HeaderCell>Company</HeaderCell>
          <HeaderCell>Owner</HeaderCell>
          <HeaderCell numeric>Seats</HeaderCell>
          <HeaderCell numeric>MRR</HeaderCell>
          {METRICS.map((m) => (
            <HeaderCell key={m} numeric>{m}</HeaderCell>
          ))}
        </tr>
      </thead>
      <tbody>
        {LONG.map((a, r) => (
          <Row key={a.id}>
            <Cell rowHeader>{a.company}</Cell>
            <Cell muted>{a.owner}</Cell>
            <Cell numeric>{a.seats}</Cell>
            <Cell numeric>{mrr(a.mrr)}</Cell>
            {METRICS.map((m, c) => (
              <Cell key={m} numeric>{((r + 1) * (c + 7) * 13) % 997}</Cell>
            ))}
          </Row>
        ))}
      </tbody>
    </Table>
  ),
  parameters: {
    docs: { description: { story: 'Forty columns and company names that run to eighty characters. Cells do not wrap, so the table is wider than any frame and the wrapper scrolls sideways; the frame itself does not.' } },
  },
};

export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: { description: { story: 'The Default table in a 360px frame. The four columns are wider than that, so the scroll region takes over.' } },
  },
};

import { useMemo, useState } from 'react';
import { Badge, Button, Cell, HeaderCell, IconButton, Row, Table, Toolbar, type BadgeTone, type SortDirection } from '../../components';
import { customers as allCustomers, formatMrr, STATUS_LABEL, type Customer, type CustomerStatus } from './customers';
import './CustomerTable.css';

/* The customer table in Relay, as it stands before the agent's change.
   This is the baseline Agent Review compares against: a sortable table of
   customers with a toolbar, built from the system. It has no selection
   and no bulk actions, which is the feature the agent was asked to add.

   The screen owns sorting; the Table owns the markup and the states. */

const STATUS_TONE: Record<CustomerStatus, BadgeTone> = {
  active: 'success',
  trial: 'accent',
  'past-due': 'warning',
  churned: 'neutral',
};

type SortKey = 'company' | 'owner' | 'plan' | 'status' | 'seats' | 'mrr';

export interface CustomerTableProps {
  customers?: Customer[];
  density?: 'default' | 'compact';
}

export function CustomerTable({ customers = allCustomers, density = 'default' }: CustomerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('company');
  const [direction, setDirection] = useState<Exclude<SortDirection, 'none'>>('ascending');

  const rows = useMemo(() => {
    const sorted = [...customers].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return direction === 'ascending' ? cmp : -cmp;
    });
    return sorted;
  }, [customers, sortKey, direction]);

  function sortFor(key: SortKey): SortDirection {
    return key === sortKey ? direction : 'none';
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) setDirection(direction === 'ascending' ? 'descending' : 'ascending');
    else {
      setSortKey(key);
      setDirection('ascending');
    }
  }

  return (
    <section className="customers" aria-labelledby="customers-title">
      <Toolbar
        label="Customers"
        start={
          <>
            <h2 id="customers-title" className="customers__title">
              Customers
            </h2>
            <span className="customers__count">{customers.length}</span>
          </>
        }
      >
        <IconButton icon="filter" label="Filter customers" size="compact" />
        <IconButton icon="columns" label="Choose columns" size="compact" />
        <Button size="compact" variant="secondary" leadingIcon="plus">
          Add customer
        </Button>
      </Toolbar>
      <Table caption="Customers, with plan, status, seats and monthly revenue" density={density}>
        <thead>
          <tr>
            <HeaderCell sort={sortFor('company')} onSort={() => toggleSort('company')}>
              Company
            </HeaderCell>
            <HeaderCell sort={sortFor('owner')} onSort={() => toggleSort('owner')}>
              Owner
            </HeaderCell>
            <HeaderCell sort={sortFor('plan')} onSort={() => toggleSort('plan')}>
              Plan
            </HeaderCell>
            <HeaderCell sort={sortFor('status')} onSort={() => toggleSort('status')}>
              Status
            </HeaderCell>
            <HeaderCell numeric sort={sortFor('seats')} onSort={() => toggleSort('seats')}>
              Seats
            </HeaderCell>
            <HeaderCell numeric sort={sortFor('mrr')} onSort={() => toggleSort('mrr')}>
              MRR
            </HeaderCell>
            <HeaderCell>Last active</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <Row key={c.id}>
              <Cell rowHeader>{c.company}</Cell>
              <Cell muted>{c.owner}</Cell>
              <Cell>{c.plan}</Cell>
              <Cell>
                <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
              </Cell>
              <Cell numeric>{c.seats}</Cell>
              <Cell numeric>{formatMrr(c.mrr)}</Cell>
              <Cell muted>{c.lastActive}</Cell>
            </Row>
          ))}
        </tbody>
      </Table>
    </section>
  );
}

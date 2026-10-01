/* FROZEN. The seeded drift branch, agent/bulk-actions-drift at 97e0303:
   not an agent's run, but the four drifts the workflow exists to catch,
   written by hand into Run 1's screen and labelled as such everywhere
   they appear: a local button treatment with literal values instead of
   Button, a selection count in an ink that fails contrast on the accent
   ground, a bar that does not wrap at 768, and a change to the shared
   Button's padding. Verbatim, imports repointed, its stylesheet and the
   Button change scoped in drift.css. docs/experiment/ is the record. */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Cell,
  Checkbox,
  EmptyState,
  HeaderCell,
  IconButton,
  Row,
  Table,
  Toolbar,
  type BadgeTone,
  type SortDirection,
} from '../../../components';
import { customers as allCustomers, customersToCsv, formatMrr, STATUS_LABEL, type Customer, type CustomerStatus } from '../customers';
import '../CustomerTable.css';
import './drift.css';

/* The customer table in Relay, with selection and bulk actions.

   A control column of checkboxes selects rows (the Table's SelectedRows
   pattern: the row says it with aria-selected and a tinted ground, the
   select-all box is indeterminate while the selection is partial). A
   selection brings up a second Toolbar, in the accent tone, with the count
   and the three actions: Archive, Export, Clear selection. Archive is a
   danger button and does nothing on first press; the same toolbar turns
   into the question ("Archive 3 customers?") with Cancel beside the
   confirming button, and Escape is Cancel. Export hands the selected
   customers to the screen's `onExport`, or, without one, downloads them
   as a CSV.

   The screen owns sorting, the selection and the archive; the Table, the
   Checkbox, the Toolbar and the Button own the markup and the states. */

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
  /** Ids selected on first render, for a story or a preview that opens the screen mid-selection. */
  initialSelection?: string[];
  /** Receives the selected customers when Export is pressed. Without it, the screen downloads a CSV. */
  onExport?: (selected: Customer[]) => void;
  /** Receives the customers once Archive is confirmed. The screen takes them out of the table either way. */
  onArchive?: (archived: Customer[]) => void;
}

function plural(n: number): string {
  return n === 1 ? '1 customer' : `${n} customers`;
}

function downloadCsv(rows: Customer[]) {
  const url = URL.createObjectURL(new Blob([customersToCsv(rows)], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'customers.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function CustomerTable({ customers = allCustomers, density = 'default', initialSelection = [], onExport, onArchive }: CustomerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('company');
  const [direction, setDirection] = useState<Exclude<SortDirection, 'none'>>('ascending');
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelection));
  const [archived, setArchived] = useState<Set<string>>(() => new Set());
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState('');

  const archiveButton = useRef<HTMLButtonElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const selectAll = useRef<HTMLInputElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  /* Where focus goes once the toolbar that held it has re-rendered or gone. */
  const pendingFocus = useRef<'archive' | 'select-all' | 'add' | null>(null);

  const visible = useMemo(() => customers.filter((c) => !archived.has(c.id)), [customers, archived]);

  const rows = useMemo(() => {
    return [...visible].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return direction === 'ascending' ? cmp : -cmp;
    });
  }, [visible, sortKey, direction]);

  const selectedRows = useMemo(() => visible.filter((c) => selected.has(c.id)), [visible, selected]);
  const count = selectedRows.length;
  const all = visible.length > 0 && count === visible.length;
  const some = count > 0 && !all;

  /* The question replaces the actions, so focus would fall off the toolbar
     unless it is placed: on the confirming button, as the DecisionBar does.
     On the way back (Cancel, or the archive itself) the control that had
     focus is gone from the tree, so the hand-off waits for the render that
     removes it: a cancel changes `confirming`, an archive changes the row
     count, and either runs this. */
  useEffect(() => {
    if (confirming) {
      confirmButton.current?.focus();
      return;
    }
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target === 'archive') archiveButton.current?.focus();
    else if (target === 'select-all') selectAll.current?.focus();
    else if (target === 'add') addButton.current?.focus();
  }, [confirming, visible.length]);

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

  function toggleRow(id: string, on: boolean) {
    const next = new Set(selected);
    if (on) next.add(id);
    else next.delete(id);
    setSelected(next);
    setConfirming(false);
  }

  function toggleAll(on: boolean) {
    setSelected(on ? new Set(visible.map((c) => c.id)) : new Set());
    setConfirming(false);
  }

  function clearSelection() {
    setSelected(new Set());
    setConfirming(false);
    selectAll.current?.focus();
  }

  function cancelArchive() {
    setConfirming(false);
    pendingFocus.current = 'archive';
  }

  function archiveSelected() {
    const going = selectedRows;
    const next = new Set(archived);
    for (const c of going) next.add(c.id);
    setArchived(next);
    setSelected(new Set());
    setConfirming(false);
    setStatus(`${plural(going.length)} archived.`);
    onArchive?.(going);
    /* The toolbar that held focus is gone; land on the table's own control,
       or on the one action left when the table is empty. */
    pendingFocus.current = visible.length - going.length > 0 ? 'select-all' : 'add';
  }

  function exportSelected() {
    if (onExport) onExport(selectedRows);
    else downloadCsv(selectedRows);
    setStatus(`${plural(count)} exported as CSV.`);
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
            <span className="customers__count">{visible.length}</span>
          </>
        }
      >
        <IconButton icon="filter" label="Filter customers" size="compact" />
        <IconButton icon="columns" label="Choose columns" size="compact" />
        <Button ref={addButton} size="compact" variant="secondary" leadingIcon="plus">
          Add customer
        </Button>
      </Toolbar>
      {count > 0 ? (
        <div className="bulk-bar" role="toolbar" aria-label="Selected customers" data-finding="bulk-bar">
          <span className="bulk-bar__count" data-finding="bulk-count">
            {confirming ? `Archive ${plural(count)}?` : `${count} of ${visible.length} customers selected`}
          </span>
          <span className="bulk-bar__spacer" />
          {confirming ? (
            <>
              <button type="button" className="bulk-bar__btn" onClick={cancelArchive}>
                Cancel
              </button>
              <button type="button" className="bulk-bar__btn bulk-bar__btn--danger" ref={confirmButton} onClick={archiveSelected}>
                Archive {plural(count)}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="bulk-bar__btn bulk-bar__btn--danger" ref={archiveButton} onClick={() => setConfirming(true)} data-finding="bulk-archive">
                Archive selected
              </button>
              <button type="button" className="bulk-bar__btn" onClick={exportSelected}>
                Export selected as CSV
              </button>
              <button type="button" className="bulk-bar__btn">
                Change owner
              </button>
              <button type="button" className="bulk-bar__btn bulk-bar__btn--quiet" onClick={clearSelection}>
                Clear selection
              </button>
            </>
          )}
        </div>
      ) : null}
      <Table caption="Customers, with plan, status, seats and monthly revenue" density={density}>
        <thead>
          <tr>
            <HeaderCell control>
              <Checkbox
                ref={selectAll}
                label="Select all customers"
                hideLabel
                checked={all}
                indeterminate={some}
                disabled={visible.length === 0}
                onChange={(e) => toggleAll(e.currentTarget.checked)}
              />
            </HeaderCell>
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
            <Row key={c.id} selected={selected.has(c.id)}>
              <Cell control>
                <Checkbox label={`Select ${c.company}`} hideLabel checked={selected.has(c.id)} onChange={(e) => toggleRow(c.id, e.currentTarget.checked)} />
              </Cell>
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
      {visible.length === 0 ? (
        customers.length === 0 ? (
          <EmptyState title="No customers yet" description="Add a customer and it appears here." />
        ) : (
          <EmptyState title="All customers archived" description="Archived customers are not shown in this table." />
        )
      ) : null}
      {/* Always in the tree, so the announcement has a region to arrive in. */}
      <p className="visually-hidden" role="status">
        {status}
      </p>
    </section>
  );
}

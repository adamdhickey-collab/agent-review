/* FROZEN. The customer table as Claude Code left it on
   agent/bulk-actions-no-rules at b643e08, the control run: the same
   request, the same tree, with CLAUDE.md, the ui-quality skill and the
   project documents removed from what it could read. Verbatim, with
   imports repointed, its three product rules scoped in norules.css, and
   data-finding hooks added on the elements the review outlines. Do not
   edit; docs/experiment/ is the record. */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Badge, Button, Cell, Checkbox, HeaderCell, IconButton, Row, Table, Toolbar, type BadgeTone, type SortDirection } from '../../../components';
import { customers as allCustomers, formatMrr, STATUS_LABEL, type Customer, type CustomerStatus } from '../customers';
import { customersToCsv, downloadCsv, EXPORT_FILENAME } from './exportCsv.norules';
import '../CustomerTable.css';
import './norules.css';

/* The customer table in Relay: a sortable table of customers with a
   toolbar, built from the system, with a selection and two bulk actions
   over it.

   The screen owns the sort, the selection and the actions; the Table owns
   the markup and the states. Selecting a row swaps the title toolbar for
   the system's accent toolbar in the same slot, so nothing below it moves:
   a count, Archive, Export and Clear selection. Archive cannot be taken
   back, so it asks first, in that same slot, and the question names the
   number. Export writes the selected rows to a CSV. Both end on a status
   line a screen reader hears. Archived customers leave the list for the
   session; this screen has no Archived view to show them in. */

const STATUS_TONE: Record<CustomerStatus, BadgeTone> = {
  active: 'success',
  trial: 'accent',
  'past-due': 'warning',
  churned: 'neutral',
};

type SortKey = 'company' | 'owner' | 'plan' | 'status' | 'seats' | 'mrr';

function count(n: number): string {
  return n === 1 ? '1 customer' : `${n} customers`;
}

export interface CustomerTableProps {
  customers?: Customer[];
  density?: 'default' | 'compact';
  /** Rows selected on first render, by id: for a story or a preview that opens the screen mid-task. */
  initialSelection?: string[];
}

export function CustomerTable({ customers = allCustomers, density = 'default', initialSelection }: CustomerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('company');
  const [direction, setDirection] = useState<Exclude<SortDirection, 'none'>>('ascending');
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(initialSelection));
  const [archived, setArchived] = useState<ReadonlySet<string>>(() => new Set());
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const root = useRef<HTMLElement>(null);
  const archiveRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  /* Where focus goes after the next render, when the control that holds it
     is about to leave the tree: into the question, back to Archive when
     the question is withdrawn, and to the head of the table when the
     selection toolbar goes away. */
  const focusNext = useRef<'archive' | 'cancel' | 'table' | null>(null);
  useEffect(() => {
    const target = focusNext.current;
    focusNext.current = null;
    if (target === 'archive') archiveRef.current?.focus();
    if (target === 'cancel') cancelRef.current?.focus();
    if (target === 'table') {
      const head = selectAllRef.current;
      if (head && !head.disabled) head.focus();
      else root.current?.querySelector<HTMLElement>('.table-scroll')?.focus();
    }
  });

  const visible = useMemo(() => customers.filter((c) => !archived.has(c.id)), [customers, archived]);

  const rows = useMemo(() => {
    const sorted = [...visible].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return direction === 'ascending' ? cmp : -cmp;
    });
    return sorted;
  }, [visible, sortKey, direction]);

  const chosen = useMemo(() => visible.filter((c) => selected.has(c.id)), [visible, selected]);
  const selecting = chosen.length > 0;
  const all = visible.length > 0 && chosen.length === visible.length;
  const some = selecting && !all;

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

  /* A change to the selection withdraws an open question, since the number
     in it would be stale, and clears the last status, which was about a
     selection that no longer exists. */
  function select(next: ReadonlySet<string>) {
    setSelected(next);
    setConfirming(false);
    setStatus(null);
  }

  function toggleRow(id: string, on: boolean) {
    const next = new Set(selected);
    if (on) next.add(id);
    else next.delete(id);
    select(next);
  }

  function toggleAll(on: boolean) {
    select(on ? new Set(visible.map((c) => c.id)) : new Set());
  }

  function clearSelection() {
    select(new Set());
    focusNext.current = 'table';
  }

  function askToArchive() {
    setConfirming(true);
    focusNext.current = 'cancel';
  }

  function cancelArchive() {
    setConfirming(false);
    focusNext.current = 'archive';
  }

  function archive() {
    const ids = chosen.map((c) => c.id);
    setArchived(new Set([...archived, ...ids]));
    setSelected(new Set());
    setConfirming(false);
    setStatus(`Archived ${count(ids.length)}.`);
    focusNext.current = 'table';
  }

  function exportSelected() {
    downloadCsv(customersToCsv(chosen));
    setStatus(`Exported ${count(chosen.length)} to ${EXPORT_FILENAME}.`);
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Escape' && confirming) {
      e.preventDefault();
      cancelArchive();
    }
  }

  return (
    <section ref={root} className="customers" aria-labelledby="customers-title" onKeyDown={onKeyDown}>
      <Toolbar
        label={selecting ? 'Selected customers' : 'Customers'}
        tone={selecting ? 'accent' : 'plain'}
        start={
          <>
            <h2 id="customers-title" className={selecting ? 'visually-hidden' : 'customers__title'}>
              Customers
            </h2>
            {!selecting ? <span className="customers__count">{visible.length}</span> : null}
            {selecting && !confirming ? <span className="customers__selected">{chosen.length} selected</span> : null}
            {confirming ? (
              <>
                <span>Archive {count(chosen.length)}?</span>
                <span className="customers__hint">They leave this list.</span>
              </>
            ) : null}
          </>
        }
      >
        {!selecting ? (
          <>
            <IconButton icon="filter" label="Filter customers" size="compact" />
            <IconButton icon="columns" label="Choose columns" size="compact" />
            <Button size="compact" variant="secondary" leadingIcon="plus">
              Add customer
            </Button>
          </>
        ) : confirming ? (
          <>
            <Button ref={cancelRef} size="compact" variant="ghost" onClick={cancelArchive}>
              Cancel
            </Button>
            <Button size="compact" variant="danger" onClick={archive}>
              Archive {count(chosen.length)}
            </Button>
          </>
        ) : (
          <>
            <Button ref={archiveRef} size="compact" variant="danger" onClick={askToArchive}>
              Archive
            </Button>
            <Button size="compact" variant="secondary" leadingIcon="external" onClick={exportSelected}>
              Export
            </Button>
            <Button size="compact" variant="ghost" onClick={clearSelection}>
              Clear selection
            </Button>
          </>
        )}
      </Toolbar>
      {/* The live region is always in the tree, so a status that arrives
          is announced; it has no box of its own until there is one. */}
      <div role="status" className="customers__status">
        {status ? <p className="customers__status-text">{status}</p> : null}
      </div>
      <Table caption="Customers, with plan, status, seats and monthly revenue" density={density}>
        <thead>
          <tr>
            <HeaderCell control>
              <Checkbox
                ref={selectAllRef}
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
    </section>
  );
}

import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Badge, Button, Cell, Checkbox, EmptyState, HeaderCell, Row, SegmentedControl, Table, Toolbar, type BadgeTone } from '../../components';
import { customers as allCustomers, formatMrr, STATUS_LABEL, type Customer, type CustomerStatus } from './customers';
import './ArchiveFlow.css';

/* ARCHIVING CUSTOMERS, THREE WAYS (2026-10-25). The customer table's bulk
   archive, as each of the design cycle's three directions would build it
   (data/cycle.ts, Explore). The same rows, the same selection, the same
   components; what differs is what happens between pressing Archive and the
   rows leaving, and what a person can do after.

     undo     Archive acts at once. A bar says what left and offers Undo
              until the next action (rule 6's "a way back").
     confirm  Archive becomes the question, as CustomerTable's does, and the
              question names any active customer in the selection.
     review   Archive opens a review of the selection under the toolbar:
              what can't be archived and why, the active customers each with
              a box to keep them out, and the routine rest as a count.

   And four features a designer can require of any of them (Evaluate):
   naming active customers before the press, naming blocked ones before the
   press, an Archived view with Restore, and who archived each one.

   One customer can't be archived, Monarch Dental Group, because it has an
   open invoice, so every direction meets a partial failure; the question
   is whether the person learns that before the press or after.

   It is a new screen rather than a prop on CustomerTable, because the
   customer table is the one the experiment's runs changed and its history
   is frozen against it (history/); this one is built from the same parts
   and reports what a person did through onEvent, which is how the cycle
   knows what was tried.

   Since 2026-10-28 it also says where it is and what one press moves it
   on: onPhase reports the phase (the batch selected, the question open,
   the review open, done) with the label of that press, the button for it
   carries data-next, and next() on the ref presses it. The cycle's Explore
   reads all three, so its move can offer the same press beside the screen
   and mark the control here, after a reader pressed Archive from the move
   and then could not find the question's button in the screen. */

export type ArchiveDirection = 'undo' | 'confirm' | 'review';

export interface ArchiveFeatures {
  /** Name any active customer in the selection before the press. */
  namesActive: boolean;
  /** Name customers that can't be archived before the press. */
  blockedFirst: boolean;
  /** An Archived view with Restore. */
  restore: boolean;
  /** Who archived each customer, and when, in the Archived view. */
  who: boolean;
}

export type ArchiveEvent = 'archived' | 'undone' | 'restored' | 'blocked' | 'active-archived';

/** Where the flow is: idle (nothing selected, or the Archived view),
    selected (the bar offers Archive), asking (the confirm question is open),
    reviewing (the review is open), done (the last action's bar shows). */
export type ArchivePhase = 'idle' | 'selected' | 'asking' | 'reviewing' | 'done';

export interface ArchiveFlowHandle {
  /** Presses the one control that moves the flow on, if there is one. */
  next(): boolean;
}

export interface ArchiveFlowProps {
  direction: ArchiveDirection;
  features?: Partial<ArchiveFeatures>;
  /** What counts as active: the Active status, or any activity in the last week. */
  activeRule?: 'status' | 'recent';
  customers?: Customer[];
  /** Ids selected on first render, for a story or a capture that opens mid-selection. */
  initialSelection?: string[];
  /** Opens with the selection's next step showing: the question, or the review. */
  initialStep?: boolean;
  /** Ids already archived on first render, for a story of the Archived view. */
  initialArchived?: string[];
  initialView?: 'current' | 'archived';
  onEvent?: (event: ArchiveEvent) => void;
  /** The phase, and the label of the press that moves it on, or null when none does. */
  onPhase?: (phase: ArchivePhase, next: string | null) => void;
}

const STATUS_TONE: Record<CustomerStatus, BadgeTone> = {
  active: 'success',
  trial: 'accent',
  'past-due': 'warning',
  churned: 'neutral',
};

/** Why a customer can't be archived, when it can't. */
const BLOCKED: Record<string, string> = { c_01HZKF: 'it has an open invoice' };

function plural(n: number): string {
  return n === 1 ? '1 customer' : `${n} customers`;
}

function list(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function isActive(c: Customer, rule: 'status' | 'recent'): boolean {
  return rule === 'recent' ? !/week|month/.test(c.lastActive) : c.status === 'active';
}

interface Result {
  archived: Customer[];
  blocked: Customer[];
  undoable: boolean;
}

export const ArchiveFlow = forwardRef<ArchiveFlowHandle, ArchiveFlowProps>(function ArchiveFlow(
  { direction, features = {}, activeRule = 'status', customers = allCustomers, initialSelection = [], initialStep = false, initialArchived = [], initialView = 'current', onEvent, onPhase },
  ref,
) {
  const f: ArchiveFeatures = {
    namesActive: direction !== 'undo' || !!features.namesActive,
    blockedFirst: direction === 'review' || !!features.blockedFirst,
    restore: !!features.restore,
    who: !!features.who,
  };
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelection));
  const [archived, setArchived] = useState<string[]>(initialArchived);
  const [step, setStep] = useState(initialStep && initialSelection.length > 0);
  /* In the review, the active customers a person has kept out of the batch. */
  const [keptOut, setKeptOut] = useState<Set<string>>(() => new Set());
  const [result, setResult] = useState<Result | null>(null);
  const [view, setView] = useState<'current' | 'archived'>(initialView);
  const [status, setStatus] = useState('');

  const root = useRef<HTMLElement>(null);
  const selectAll = useRef<HTMLInputElement>(null);
  const stepButton = useRef<HTMLButtonElement>(null);
  const undoButton = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<'select-all' | 'undo' | null>(null);

  const visible = useMemo(() => customers.filter((c) => !archived.includes(c.id)), [customers, archived]);
  const gone = useMemo(() => archived.map((id) => customers.find((c) => c.id === id)).filter((c): c is Customer => !!c), [customers, archived]);
  const chosen = useMemo(() => visible.filter((c) => selected.has(c.id)), [visible, selected]);
  const count = chosen.length;
  const all = visible.length > 0 && count === visible.length;
  const blocked = chosen.filter((c) => BLOCKED[c.id]);
  const active = chosen.filter((c) => !BLOCKED[c.id] && isActive(c, activeRule));
  /* Undo names the active customers by shading their rows until the press. */
  const shaded = new Set(view === 'current' && !step && direction === 'undo' && f.namesActive ? active.map((c) => c.id) : []);
  const going = chosen.filter((c) => !BLOCKED[c.id] && !(direction === 'review' && keptOut.has(c.id)));
  /* What the question offers to archive: without blocked-first, the screen
     doesn't know yet that one will fail, so it offers the whole selection. */
  const offered = f.blockedFirst ? going.length : chosen.length;

  /* Where the flow is, and the one press that moves it on. */
  const phase: ArchivePhase = view !== 'current' ? 'idle' : step && direction === 'confirm' ? 'asking' : step && direction === 'review' ? 'reviewing' : count > 0 ? 'selected' : result ? 'done' : 'idle';
  const next = phase === 'selected' ? 'Archive' : phase === 'asking' && offered > 0 ? `Archive ${plural(offered)}` : phase === 'reviewing' && going.length > 0 ? `Archive ${plural(going.length)}` : null;
  useEffect(() => {
    onPhase?.(phase, next);
  }, [phase, next, onPhase]);
  useImperativeHandle(ref, () => ({
    next() {
      const button = root.current?.querySelector<HTMLButtonElement>('[data-next]');
      button?.click();
      return !!button;
    },
  }));

  useEffect(() => {
    if (step) {
      stepButton.current?.focus();
      return;
    }
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target === 'undo') undoButton.current?.focus();
    else if (target === 'select-all') selectAll.current?.focus();
  }, [step, result]);

  /* Any new action ends the last one's bar, and with it its Undo. */
  function act() {
    setResult(null);
  }

  function toggleRow(id: string, on: boolean) {
    const next = new Set(selected);
    if (on) next.add(id);
    else next.delete(id);
    setSelected(next);
    setStep(false);
    act();
  }

  function toggleAll(on: boolean) {
    setSelected(on ? new Set(visible.map((c) => c.id)) : new Set());
    setStep(false);
    act();
  }

  function cancel() {
    setStep(false);
    setKeptOut(new Set());
    pendingFocus.current = 'select-all';
  }

  function archive() {
    const out = going;
    const stopped = blocked;
    setArchived((a) => [...a, ...out.map((c) => c.id)]);
    setSelected(new Set());
    setStep(false);
    setKeptOut(new Set());
    const undoable = direction === 'undo';
    setResult({ archived: out, blocked: stopped, undoable });
    setStatus(sentence(out, stopped));
    pendingFocus.current = undoable && out.length ? 'undo' : 'select-all';
    if (out.length) onEvent?.('archived');
    if (stopped.length) onEvent?.('blocked');
    if (out.some((c) => isActive(c, 'status'))) onEvent?.('active-archived');
  }

  function press() {
    act();
    if (direction === 'undo') archive();
    else setStep(true);
  }

  function undo() {
    if (!result) return;
    const back = new Set(result.archived.map((c) => c.id));
    setArchived((a) => a.filter((id) => !back.has(id)));
    setResult(null);
    setStatus(`${plural(back.size)} back in the table.`);
    pendingFocus.current = 'select-all';
    onEvent?.('undone');
  }

  function restore(c: Customer) {
    setArchived((a) => a.filter((id) => id !== c.id));
    setStatus(`${c.company} restored.`);
    act();
    onEvent?.('restored');
  }

  const archivedCount = gone.length;
  /* Ids from React, not written: a scene shows the flow three times side by
     side, and a written id named all three sections by the first one's title. */
  const titleId = useId();
  const reviewId = useId();

  return (
    <section ref={root} className="archive-flow" aria-labelledby={titleId}>
      <Toolbar
        label="Customers"
        start={
          <>
            <h2 id={titleId} className="archive-flow__title">
              Customers
            </h2>
            <span className="archive-flow__count">{visible.length}</span>
          </>
        }
      >
        {f.restore ? (
          <SegmentedControl
            label="Show"
            size="compact"
            value={view}
            onChange={(v) => {
              setView(v);
              setStep(false);
            }}
            options={[
              { value: 'current', label: 'Current' },
              { value: 'archived', label: `Archived ${archivedCount}` },
            ]}
          />
        ) : null}
      </Toolbar>

      {view === 'current' && count > 0 && !step ? (
        <Toolbar label="Selected customers" tone="accent" start={<span className="archive-flow__selected">{count} selected</span>}>
          <Button size="compact" variant="danger" data-next="" onClick={press}>
            Archive
          </Button>
          <Button size="compact" variant="ghost" onClick={() => toggleAll(false)}>
            Clear selection
          </Button>
        </Toolbar>
      ) : null}

      {/* Before the press, what the person should know, where the direction
          or a requirement says so. The active customers are named by their
          own rows, shaded below (a line naming them, until 2026-10-29, said
          again what each row's badge says); the blocked one gets a note,
          because the reason is nowhere in its row. The question and the
          review say both themselves. */}
      {view === 'current' && count > 0 && !step && direction === 'undo' && f.blockedFirst && blocked.length ? (
        <div className="archive-flow__notes">
          <p className="archive-flow__note">
            <Badge tone="warning">Can’t archive</Badge> {list(blocked.map((c) => c.company))}: {BLOCKED[blocked[0].id]}.
          </p>
        </div>
      ) : null}

      {view === 'current' && step && direction === 'confirm' ? (
        <Toolbar
          label="Confirm archive"
          tone="accent"
          start={
            <span className="archive-flow__question">
              <strong>Archive {plural(offered)}?</strong>
              {f.namesActive && active.length ? ` ${list(active.map((c) => c.company))} ${active.length === 1 ? 'is' : 'are'} active.` : ''}
              {f.blockedFirst && blocked.length ? ` ${list(blocked.map((c) => c.company))} can’t be: ${BLOCKED[blocked[0].id]}.` : ''}
            </span>
          }
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
        >
          <Button size="compact" variant="ghost" onClick={cancel}>
            Cancel
          </Button>
          <Button ref={stepButton} size="compact" variant="danger" data-next={offered > 0 ? '' : undefined} onClick={archive} disabled={offered === 0}>
            Archive {plural(offered)}
          </Button>
        </Toolbar>
      ) : null}

      {view === 'current' && step && direction === 'review' ? (
        <section
          className="archive-flow__review"
          aria-labelledby={reviewId}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
        >
          <h3 id={reviewId} className="archive-flow__review-title">
            Review {plural(count)} before archiving
          </h3>
          {blocked.length ? (
            <div className="archive-flow__group">
              <p className="archive-flow__group-name">
                <Badge tone="warning">Can’t archive</Badge>
              </p>
              <ul className="archive-flow__rows">
                {blocked.map((c) => (
                  <li key={c.id}>
                    <strong>{c.company}</strong>: {BLOCKED[c.id]}. It stays in the table.
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {active.length ? (
            <div className="archive-flow__group">
              <p className="archive-flow__group-name">
                <Badge tone="success">Active</Badge> Check these. Clear a box to keep the customer.
              </p>
              <ul className="archive-flow__rows">
                {active.map((c) => (
                  <li key={c.id}>
                    <Checkbox
                      label={`${c.company}, ${formatMrr(c.mrr)} a month`}
                      checked={!keptOut.has(c.id)}
                      onChange={(e) => {
                        const next = new Set(keptOut);
                        if (e.currentTarget.checked) next.delete(c.id);
                        else next.add(c.id);
                        setKeptOut(next);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {count - blocked.length - active.length > 0 ? (
            <p className="archive-flow__group-name">{plural(count - blocked.length - active.length)} churned, past due or on trial.</p>
          ) : null}
          <div className="archive-flow__review-actions">
            <Button size="compact" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <Button ref={stepButton} size="compact" variant="danger" data-next={going.length > 0 ? '' : undefined} onClick={archive} disabled={going.length === 0}>
              Archive {plural(going.length)}
            </Button>
          </div>
        </section>
      ) : null}

      {view === 'current' && result ? (
        <Toolbar label="Last action" start={<span className="archive-flow__result">{sentence(result.archived, result.blocked)}</span>}>
          {result.undoable && result.archived.length ? (
            <Button ref={undoButton} size="compact" variant="secondary" leadingIcon="undo" onClick={undo}>
              Undo
            </Button>
          ) : null}
        </Toolbar>
      ) : null}

      {view === 'current' ? (
        <>
          <Table caption="Customers, with status, seats and monthly revenue" density="compact">
            <thead>
              <tr>
                <HeaderCell control>
                  <Checkbox ref={selectAll} label="Select all customers" hideLabel checked={all} indeterminate={count > 0 && !all} disabled={visible.length === 0} onChange={(e) => toggleAll(e.currentTarget.checked)} />
                </HeaderCell>
                <HeaderCell>Company</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell numeric>Seats</HeaderCell>
                <HeaderCell numeric>MRR</HeaderCell>
                <HeaderCell>Last active</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <Row key={c.id} selected={selected.has(c.id)} className={shaded.has(c.id) ? 'archive-flow__row--active' : undefined}>
                  <Cell control>
                    <Checkbox label={`Select ${c.company}`} hideLabel checked={selected.has(c.id)} onChange={(e) => toggleRow(c.id, e.currentTarget.checked)} />
                  </Cell>
                  <Cell rowHeader>{c.company}</Cell>
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
          {visible.length === 0 ? <EmptyState title="All customers archived" description={f.restore ? 'They’re in Archived, and can be restored for 90 days.' : 'Archived customers aren’t shown here. Support can restore one for 90 days.'} /> : null}
        </>
      ) : (
        <>
          <Table caption="Archived customers, restorable for 90 days" density="compact">
            <thead>
              <tr>
                <HeaderCell>Company</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                {f.who ? <HeaderCell>Archived</HeaderCell> : null}
                <HeaderCell>
                  <span className="visually-hidden">Actions</span>
                </HeaderCell>
              </tr>
            </thead>
            <tbody>
              {gone.map((c) => (
                <Row key={c.id}>
                  <Cell rowHeader>{c.company}</Cell>
                  <Cell>
                    <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                  </Cell>
                  {f.who ? <Cell muted>By you, just now</Cell> : null}
                  <Cell control>
                    <Button size="compact" variant="secondary" onClick={() => restore(c)} aria-label={`Restore ${c.company}`}>
                      Restore
                    </Button>
                  </Cell>
                </Row>
              ))}
            </tbody>
          </Table>
          {gone.length === 0 ? <EmptyState title="Nothing archived" description="Customers you archive stay here for 90 days." /> : null}
        </>
      )}
      <p className="visually-hidden" role="status">
        {status}
      </p>
    </section>
  );
});

function sentence(out: Customer[], stopped: Customer[]): string {
  const a = out.length ? `${plural(out.length)} archived.` : 'Nothing archived.';
  const b = stopped.length ? ` ${list(stopped.map((c) => c.company))} wasn’t: ${BLOCKED[stopped[0].id]}.` : '';
  return a + b;
}

import { useState } from 'react';
import { EmptyState, HeaderCell, SegmentedControl, Table, Toolbar } from '../../components';
import { useStore } from '../../app/store';
import type { Change, ReviewState } from '../../data/types';
import { ReviewRow } from '../ReviewRow/ReviewRow';
import './QueueScreen.css';

/* The queue: every change an agent has opened, newest first, with the
   validation summary in five columns and the state at the end. Dense on
   purpose; a reviewer scans this for the row that needs them. */

type Filter = 'open' | 'returned' | 'done' | 'all';

const FILTERS: { value: Filter; label: string; states: ReviewState[] }[] = [
  { value: 'open', label: 'Open', states: ['needs-review', 'ready', 'validating'] },
  { value: 'returned', label: 'Returned', states: ['returned'] },
  { value: 'done', label: 'Done', states: ['accepted', 'rejected'] },
  { value: 'all', label: 'All', states: ['needs-review', 'ready', 'validating', 'returned', 'accepted', 'rejected'] },
];

export function QueueScreen({ changes: given }: { changes?: Change[] }) {
  const store = useStore();
  const changes = given ?? store.changes;
  const [filter, setFilter] = useState<Filter>('open');
  const states = FILTERS.find((f) => f.value === filter)!.states;
  const rows = changes.filter((c) => states.includes(c.state));

  return (
    <div className="queue">
      <Toolbar
        label="Review queue"
        className="queue__toolbar"
        start={
          <>
            <h1 className="queue__title" tabIndex={-1}>
              Review queue
            </h1>
            <span className="queue__count">{rows.length}</span>
          </>
        }
      >
        <SegmentedControl label="Show" options={FILTERS} value={filter} onChange={setFilter} size="compact" />
      </Toolbar>
      {rows.length === 0 ? (
        <EmptyState
          title={filter === 'open' ? 'Nothing waiting for review' : 'No changes here'}
          description={filter === 'open' ? 'When an agent opens a change, it appears here with its validation.' : 'Try another filter.'}
          action={filter === 'open' ? undefined : { label: 'Show open changes', onClick: () => setFilter('open') }}
        />
      ) : (
        <Table caption="Changes awaiting review, with their validation results" interactive className="queue__table">
          <thead>
            <tr>
              <HeaderCell>Change</HeaderCell>
              <HeaderCell>Agent</HeaderCell>
              <HeaderCell>Requested by</HeaderCell>
              <HeaderCell>Opened</HeaderCell>
              <HeaderCell numeric>Components</HeaderCell>
              <HeaderCell>Validation</HeaderCell>
              <HeaderCell>Status</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <ReviewRow key={c.id} change={c} />
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

import { useState } from 'react';
import { EmptyState, HeaderCell, SegmentedControl, StatusIndicator, Table, Toolbar } from '../../components';
import { useStore } from '../../app/store';
import { useMediaQuery } from '../../app/useMediaQuery';
import { listKeys } from '../../app/shortcuts';
import { REVIEW_STATE_LABEL, type Change, type ReviewState } from '../../data/types';
import { ReviewCard } from '../ReviewCard/ReviewCard';
import { ReviewRow } from '../ReviewRow/ReviewRow';
import { STATE_TONE } from '../ReviewRow/ReviewParts';
import './QueueScreen.css';

/* The queue: every change an agent has opened, newest first within the state
   it is in, with the validation summary in five lanes beside the title. Dense
   on purpose; a reviewer scans this for the row that needs them. The rows
   are grouped by state, so the state is said once, above them, with how
   many, and not once on every line: a row is one line, 40px, and the group
   a change is in is what a Status column used to repeat. Below 48rem it is a
   list of cards, because the table's columns do not fit a phone and
   scrolling them sideways hides the two a reviewer decides on; a card says
   its own state, since a list of cards has no room for a header between
   them. */

type Filter = 'open' | 'returned' | 'done' | 'all';

/* J and K, and the arrows, move between the changes while one has focus: a
   row in the table or a card in the list, each by its title link. */
const onListKey = listKeys('.review-row, .review-card', 'a[href]');

/** The table's columns: the change, validation, agent, requested by, opened, components. */
const COLUMNS = 6;

const FILTERS: { value: Filter; label: string; states: ReviewState[] }[] = [
  { value: 'open', label: 'Open', states: ['needs-review', 'ready', 'validating'] },
  { value: 'returned', label: 'Returned', states: ['returned'] },
  { value: 'done', label: 'Done', states: ['accepted', 'rejected'] },
  { value: 'all', label: 'All', states: ['needs-review', 'ready', 'validating', 'returned', 'accepted', 'rejected'] },
];

export function QueueScreen({ changes: given, list }: { changes?: Change[]; /** Force the list (true) or the table (false); by default the width decides. */ list?: boolean }) {
  const store = useStore();
  const narrow = useMediaQuery('(max-width: 48rem)');
  const asList = list ?? narrow;
  const changes = given ?? store.changes;
  const [filter, setFilter] = useState<Filter>('open');
  const states = FILTERS.find((f) => f.value === filter)!.states;
  const rows = changes.filter((c) => states.includes(c.state));
  /* The groups, in the order a reviewer meets them, and only the ones with a change in them. */
  const groups = states.map((state) => ({ state, rows: rows.filter((c) => c.state === state) })).filter((g) => g.rows.length > 0);

  return (
    <div className="queue" onKeyDown={onListKey}>
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
      ) : asList ? (
        <ul className="queue__list" aria-label="Changes awaiting review, with their validation results">
          {rows.map((c) => (
            <li key={c.id}>
              <ReviewCard change={c} />
            </li>
          ))}
        </ul>
      ) : (
        <Table caption="Changes awaiting review, with their validation results" interactive className="queue__table">
          <thead>
            <tr>
              <HeaderCell>Change</HeaderCell>
              <HeaderCell>Validation</HeaderCell>
              <HeaderCell>Agent</HeaderCell>
              <HeaderCell>Requested by</HeaderCell>
              <HeaderCell>Opened</HeaderCell>
              <HeaderCell numeric>Components</HeaderCell>
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g.state}>
              <tr className="queue__group">
                <th scope="rowgroup" colSpan={COLUMNS}>
                  <StatusIndicator tone={STATE_TONE[g.state]} label={REVIEW_STATE_LABEL[g.state]} live={g.state === 'validating'} />
                  <span className="queue__group-count">{g.rows.length}</span>
                </th>
              </tr>
              {g.rows.map((c) => (
                <ReviewRow key={c.id} change={c} />
              ))}
            </tbody>
          ))}
        </Table>
      )}
      {rows.some((c) => c.sample) ? (
        <p className="queue__note">The three bulk-actions changes are the experiment’s own branches, recorded from real runs. Rows marked Sample are invented, so the queue reads as a queue.</p>
      ) : null}
    </div>
  );
}

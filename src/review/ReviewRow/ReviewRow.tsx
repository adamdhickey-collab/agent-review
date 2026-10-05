import type { KeyboardEvent } from 'react';
import { Badge, Cell, Row } from '../../components';
import type { Change } from '../../data/types';
import { href, titleTransitionName } from '../../app/router';
import { relativeTime } from '../format';
import { ReviewLanes } from './ReviewParts';
import './ReviewRow.css';

/* One change in the queue, on one line. The whole row opens the change; the
   title is a real link, so the keyboard has one tab stop per row and a screen
   reader reads the row by its name. The state is not a column: the queue
   groups its rows by state (QueueScreen), so the state is said once above
   them and not once on every line. The branch and the hash follow the title,
   muted, and give way first when the line is short. The columns run in the
   order a reviewer decides in: the change, what validation said, and only
   then who and when. At 768 the last of them are the ones the table scrolls
   away, which is the right ones to lose. */

export function ReviewRow({ change }: { change: Change }) {
  const to = href({ name: 'change', id: change.id });

  function open() {
    location.hash = to;
  }
  function onKey(e: KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === 'Enter' && e.target === e.currentTarget) open();
  }

  return (
    <Row onClick={open} onKeyDown={onKey} className="review-row" data-state={change.state}>
      <Cell rowHeader className="review-row__change">
        <span className="review-row__line">
          <a href={to} className="review-row__title" style={{ viewTransitionName: titleTransitionName(change.id) }} onClick={(e) => e.stopPropagation()}>
            {change.title}
          </a>
          <span className="review-row__meta">
            <code>{change.branch}</code>
            <span aria-hidden="true">·</span>
            <code>{change.commit}</code>
          </span>
          {change.sample ? <Badge variant="quiet">Sample</Badge> : null}
        </span>
      </Cell>
      <Cell>
        <ReviewLanes change={change} />
      </Cell>
      <Cell muted>{change.agent.name}</Cell>
      <Cell muted>{change.requester.name}</Cell>
      <Cell muted>{relativeTime(change.openedAt)}</Cell>
      <Cell numeric>{change.componentsTouched.length}</Cell>
    </Row>
  );
}

import type { Change } from '../../data/types';
import { href } from '../../app/router';
import { relativeTime } from '../format';
import { ReviewLanes, ReviewStatus } from '../ReviewRow/ReviewParts';
import './ReviewCard.css';

/* One change in the queue, as a list item, for a screen too narrow for the
   table. Considered: ReviewRow. A table cannot reflow into this and stay a
   table to a screen reader (a row set to display: block stops being a row),
   and scrolling seven columns sideways on a phone hides the two the
   reviewer decides on. So below 48rem the queue renders a list, from the
   same lanes and the same status as the row (ReviewParts), in the same
   order: the change, its state, what validation said, then who and when.

   One link, the title, stretched over the whole card, so the target is the
   card and the keyboard gets one stop per change, as it does in the table. */

export function ReviewCard({ change }: { change: Change }) {
  const to = href({ name: 'change', id: change.id });
  return (
    <div className="review-card" data-state={change.state}>
      <a href={to} className="review-card__title">
        {change.title}
      </a>
      <span className="review-card__meta">
        <code>{change.branch}</code>
        <span aria-hidden="true">·</span>
        <code>{change.commit}</code>
      </span>
      <span className="review-card__verdict">
        <ReviewStatus change={change} />
        <ReviewLanes change={change} />
      </span>
      <span className="review-card__facts">
        <span className="review-card__group">
          {change.agent.name}
          <span aria-hidden="true"> · </span>
          {change.requester.name}
        </span>
        <span className="review-card__group">
          {relativeTime(change.openedAt)}
          <span aria-hidden="true"> · </span>
          {change.componentsTouched.length} component{change.componentsTouched.length === 1 ? '' : 's'}
        </span>
      </span>
    </div>
  );
}

import type { KeyboardEvent } from 'react';
import { Cell, Row, StatusIndicator, TestStatus, type StatusTone } from '../../components';
import { REVIEW_STATE_LABEL, type Change, type ReviewState } from '../../data/types';
import { href } from '../../app/router';
import { relativeTime } from '../format';
import './ReviewRow.css';

/* One change in the queue. The whole row opens the change; the title is
   a real link, so the keyboard has one tab stop per row and a screen
   reader reads the row by its name. The five validation lanes are icons
   with names, in a fixed order, so a column of rows reads as a grid. */

const STATE_TONE: Record<ReviewState, StatusTone> = {
  'needs-review': 'warning',
  ready: 'success',
  validating: 'neutral',
  returned: 'accent',
  accepted: 'success',
  rejected: 'danger',
};

export function ReviewRow({ change }: { change: Change }) {
  const to = href({ name: 'change', id: change.id });
  const v = change.validation;
  const blocking = change.findings.filter((f) => f.severity === 'blocking').length;

  function open() {
    location.hash = to;
  }
  function onKey(e: KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === 'Enter' && e.target === e.currentTarget) open();
  }

  return (
    <Row onClick={open} onKeyDown={onKey} className="review-row" data-state={change.state}>
      <Cell rowHeader className="review-row__change">
        <a href={to} className="review-row__title" onClick={(e) => e.stopPropagation()}>
          {change.title}
        </a>
        <span className="review-row__meta">
          <code>{change.branch}</code>
          <span aria-hidden="true">·</span>
          <code>{change.commit}</code>
        </span>
      </Cell>
      <Cell muted>{change.agent.name}</Cell>
      <Cell muted>{change.requester.name}</Cell>
      <Cell muted>{relativeTime(change.openedAt)}</Cell>
      <Cell numeric>{change.componentsTouched.length}</Cell>
      <Cell>
        <span className="review-row__lanes">
          <TestStatus state={v.visual.state} label={`Visual: ${v.visual.label}`} iconOnly />
          <TestStatus state={v.accessibility.state} label={`Accessibility: ${v.accessibility.label}`} iconOnly />
          <TestStatus state={v.interaction.state} label={`Interaction: ${v.interaction.label}`} iconOnly />
          <TestStatus state={v.components.state} label={`Components: ${v.components.label}`} iconOnly />
          <TestStatus state={v.tokens.state} label={`Tokens: ${v.tokens.label}`} iconOnly />
          {blocking ? <span className="review-row__blocking">{blocking} blocking</span> : null}
        </span>
      </Cell>
      <Cell>
        <StatusIndicator tone={STATE_TONE[change.state]} label={REVIEW_STATE_LABEL[change.state]} live={change.state === 'validating'} />
      </Cell>
    </Row>
  );
}

import { useEffect, useId, useRef, useState } from 'react';
import { Button, Icon } from '../../components';
import { REVIEW_STATE_LABEL, type Change } from '../../data/types';
import './DecisionBar.css';

/* The three decisions. Accept is refused while a blocking finding stands,
   and the bar says why in words next to the button rather than greying
   it out silently. Reject asks for a reason, because a rejection with no
   reason teaches the agent nothing. Return opens the composer. A decision
   already made shows as a record, with Undo. */

export interface DecisionBarProps {
  change: Change;
  onAccept: () => void;
  onReject: (reason: string) => void;
  onReturn: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export function DecisionBar({ change, onAccept, onReject, onReturn, onUndo, canUndo }: DecisionBarProps) {
  const blocking = change.findings.filter((f) => f.severity === 'blocking').length;
  const decided = change.decision && ['accepted', 'rejected', 'returned'].includes(change.state);
  const [confirm, setConfirm] = useState<'accept' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const id = useId();
  const firstField = useRef<HTMLElement>(null);
  useEffect(() => {
    if (confirm) firstField.current?.focus();
  }, [confirm]);

  if (decided && change.decision) {
    const d = change.decision;
    return (
      <div className="decision decision--made" data-action={d.action} role="status">
        <Icon name={d.action === 'accept' ? 'circle-check' : d.action === 'reject' ? 'circle-x' : 'corner-up-left'} size={16} />
        <span className="decision__record">
          <strong>{REVIEW_STATE_LABEL[change.state]}</strong> by {d.by.name}
          {d.message ? <span className="decision__message">“{d.message.split('\n')[0]}”</span> : null}
        </span>
        {canUndo && onUndo ? (
          <Button size="compact" variant="ghost" leadingIcon="undo" onClick={onUndo}>
            Undo
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="decision">
      {confirm === 'accept' ? (
        <form
          className="decision__confirm"
          onSubmit={(e) => {
            e.preventDefault();
            onAccept();
            setConfirm(null);
          }}
        >
          <span>
            Accept <strong>{change.title}</strong>? It merges <code>{change.branch}</code> into <code>{change.base}</code>.
          </span>
          <Button variant="ghost" size="compact" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button ref={firstField as never} variant="primary" size="compact" type="submit">
            Accept and merge
          </Button>
        </form>
      ) : confirm === 'reject' ? (
        <form
          className="decision__confirm"
          onSubmit={(e) => {
            e.preventDefault();
            onReject(reason.trim());
            setConfirm(null);
          }}
        >
          <label htmlFor={`${id}-reason`} className="visually-hidden">
            Why this change is rejected
          </label>
          <input
            ref={firstField as never}
            id={`${id}-reason`}
            className="decision__reason"
            placeholder="Why, in a sentence the agent can learn from"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <Button variant="ghost" size="compact" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="compact" type="submit" disabled={reason.trim().length === 0}>
            Reject
          </Button>
        </form>
      ) : (
        <>
          {blocking ? (
            <span className="decision__reason-text">
              <Icon name="circle-x" size={14} />
              {blocking} blocking finding{blocking === 1 ? '' : 's'}: cannot accept as is
            </span>
          ) : null}
          <Button variant="secondary" leadingIcon="corner-up-left" onClick={onReturn}>
            Return to agent
          </Button>
          <Button variant="danger" onClick={() => setConfirm('reject')}>
            Reject
          </Button>
          <Button variant="primary" leadingIcon="check" disabled={blocking > 0} onClick={() => setConfirm('accept')}>
            Accept
          </Button>
        </>
      )}
    </div>
  );
}

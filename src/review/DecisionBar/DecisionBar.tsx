import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Button, Icon } from '../../components';
import { REVIEW_STATE_LABEL, type Change } from '../../data/types';
import './DecisionBar.css';

/* The three decisions. Accept is refused while a blocking finding stands,
   and the bar says why in words next to the button rather than greying it
   out silently; the words are also the button's description, because a
   disabled button is out of the Tab order and a screen reader that finds it
   should hear why. Reject asks for a reason, because a rejection with no
   reason teaches the agent nothing, and says so if it is pressed without
   one: the field has a visible label, so the question is still on screen
   once a placeholder would have gone (WCAG 3.3.2). Return opens the
   composer. A decision already made shows as a record, with Undo.

   Either question backs out with Cancel or Escape, as the shortcut sheet
   says, and focus goes back to the button that asked it rather than to
   the top of the page. */

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
  const [missing, setMissing] = useState(false);
  const id = useId();
  const firstField = useRef<HTMLElement>(null);
  const acceptButton = useRef<HTMLButtonElement>(null);
  const rejectButton = useRef<HTMLButtonElement>(null);
  const backTo = useRef<'accept' | 'reject' | null>(null);
  useEffect(() => {
    if (confirm) firstField.current?.focus();
    else if (backTo.current) {
      (backTo.current === 'accept' ? acceptButton : rejectButton).current?.focus();
      backTo.current = null;
    }
  }, [confirm]);
  const cancel = () => {
    backTo.current = confirm;
    setConfirm(null);
    setMissing(false);
  };
  const onEscape = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    cancel();
  };

  if (decided && change.decision) {
    const d = change.decision;
    return (
      <div className="decision decision--made" data-action={d.action} role="status">
        <Icon name={d.action === 'accept' ? 'status-passed' : d.action === 'reject' ? 'status-failed' : 'corner-up-left'} size={16} />
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
          onKeyDown={onEscape}
          onSubmit={(e) => {
            e.preventDefault();
            onAccept();
            setConfirm(null);
          }}
        >
          <span>
            Accept <strong>{change.title}</strong>? It merges <code>{change.branch}</code> into <code>{change.base}</code>.
          </span>
          <Button variant="ghost" size="compact" onClick={cancel}>
            Cancel
          </Button>
          <Button ref={firstField as never} variant="primary" size="compact" type="submit">
            Accept and merge
          </Button>
        </form>
      ) : confirm === 'reject' ? (
        <form
          className="decision__confirm"
          noValidate
          onKeyDown={onEscape}
          onSubmit={(e) => {
            e.preventDefault();
            if (reason.trim().length === 0) {
              setMissing(true);
              firstField.current?.focus();
              return;
            }
            onReject(reason.trim());
            setConfirm(null);
          }}
        >
          <label htmlFor={`${id}-reason`} className="decision__label">
            Why this change is rejected
          </label>
          <input
            ref={firstField as never}
            id={`${id}-reason`}
            className="decision__reason"
            placeholder="In a sentence the agent can learn from"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setMissing(false);
            }}
            required
            aria-invalid={missing || undefined}
            aria-describedby={missing ? `${id}-missing` : undefined}
          />
          <Button variant="ghost" size="compact" onClick={cancel}>
            Cancel
          </Button>
          <Button variant="danger" size="compact" type="submit">
            Reject
          </Button>
          {missing ? (
            <span id={`${id}-missing`} className="decision__missing" role="alert">
              <Icon name="status-failed" size={14} />
              Write the reason first: a rejection without one teaches the agent nothing.
            </span>
          ) : null}
        </form>
      ) : (
        <>
          {blocking ? (
            <span id={`${id}-blocked`} className="decision__reason-text">
              <Icon name="status-failed" size={14} />
              {blocking} blocking finding{blocking === 1 ? '' : 's'}: cannot accept as is
            </span>
          ) : null}
          <Button variant="secondary" leadingIcon="corner-up-left" onClick={onReturn}>
            Return to agent
          </Button>
          <Button ref={rejectButton} variant="danger" onClick={() => setConfirm('reject')}>
            Reject
          </Button>
          <Button
            ref={acceptButton}
            variant="primary"
            leadingIcon="check"
            disabled={blocking > 0}
            aria-describedby={blocking ? `${id}-blocked` : undefined}
            onClick={() => setConfirm('accept')}
          >
            Accept
          </Button>
        </>
      )}
    </div>
  );
}

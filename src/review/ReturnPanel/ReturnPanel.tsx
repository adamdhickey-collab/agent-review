import { useEffect, useEffectEvent, useId, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Icon } from '../../components';
import type { Finding } from '../../data/types';
import './ReturnPanel.css';

/* Return to agent. The reviewer chooses findings; each contributes its
   correction, with its rule, to a message; the reviewer edits the whole
   before sending. The composed text is what the agent receives, so it is
   precise on purpose: which component, which prop, which file, which
   story to add. A free text box would make the reviewer write that from
   memory, and most would not.

   A dialog: focus moves in and stays in (Tab wraps at the ends, and from
   anywhere outside comes back in), Escape closes it, and focus returns to
   where it was. Once the message has been edited, closing it is the one
   way to lose the reviewer's own words, so Escape, the scrim and Cancel
   ask first, in the shape rule 6 gives an action with no view to restore
   from: the footer becomes the question, Escape means keep editing, and
   focus lands on the confirming button. */

export interface ReturnPanelProps {
  findings: Finding[];
  initiallyIncluded: Set<string>;
  onSend: (message: string, findingIds: string[]) => void;
  onClose: () => void;
}

export function compose(findings: Finding[], ids: Set<string>): string {
  const chosen = findings.filter((f) => ids.has(f.id) && f.correction);
  if (chosen.length === 0) return '';
  const lines = chosen.map((f, i) => {
    const rules = f.rules.length ? ` (ui-quality rule${f.rules.length > 1 ? 's' : ''} ${f.rules.join(', ')})` : '';
    return `${i + 1}. ${f.title}${rules}\n   ${f.correction.replace(/`/g, '')}`;
  });
  return `Returning this change with ${chosen.length} correction${chosen.length === 1 ? '' : 's'}. Please address each and re-run npm run check before reopening.\n\n${lines.join('\n\n')}`;
}

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function tabbable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter((el) => el.getClientRects().length > 0);
}

export function ReturnPanel({ findings, initiallyIncluded, onSend, onClose }: ReturnPanelProps) {
  const id = useId();
  const [included, setIncluded] = useState<Set<string>>(new Set(initiallyIncluded));
  const composed = useMemo(() => compose(findings, included), [findings, included]);
  const [edited, setEdited] = useState<string | null>(null);
  const text = edited ?? composed;
  const [asking, setAsking] = useState(false);

  const dialog = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const discard = useRef<HTMLButtonElement>(null);

  /* Closing is asked for from three places. With nothing of the reviewer's
     own to lose it closes; otherwise it asks. */
  function requestClose() {
    if (edited !== null) setAsking(true);
    else onClose();
  }

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (asking) setAsking(false);
      else requestClose();
      return;
    }
    if (e.key !== 'Tab' || !dialog.current) return;
    const items = tabbable(dialog.current);
    if (items.length === 0) return;
    const active = document.activeElement as HTMLElement | null;
    const first = items[0];
    const last = items[items.length - 1];
    if (!active || !dialog.current.contains(active)) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLElement>('input, button, textarea')?.focus();
    const listener = (e: KeyboardEvent) => onKey(e);
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
      previous?.focus();
    };
  }, []);

  /* The question takes focus on the confirming button; answering "keep
     editing" gives it back to the message. */
  const asked = useRef(false);
  useEffect(() => {
    if (asking) {
      asked.current = true;
      discard.current?.focus();
    } else if (asked.current) {
      asked.current = false;
      textarea.current?.focus();
    }
  }, [asking]);

  const returnable = findings.filter((f) => f.correction);

  return (
    <div className="return-backdrop" onClick={() => (asking ? undefined : requestClose())}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className="return"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="return__header">
          <h2 id={`${id}-title`} className="return__title">
            <Icon name="corner-up-left" size={16} />
            Return to agent
          </h2>
          <p className="return__lede">Choose the findings to send back. Each adds its correction to the message; edit the result before sending.</p>
        </header>
        <div className="return__body">
          <fieldset className="return__findings">
            <legend className="return__legend">Findings to return</legend>
            {returnable.map((f) => (
              <Checkbox
                key={f.id}
                label={f.title}
                checked={included.has(f.id)}
                onChange={(e) => {
                  const next = new Set(included);
                  if (e.target.checked) next.add(f.id);
                  else next.delete(f.id);
                  setIncluded(next);
                }}
              />
            ))}
          </fieldset>
          <div className="return__message">
            <label htmlFor={`${id}-text`} className="return__legend">
              Message to the agent
              {edited !== null ? <span className="return__edited">edited</span> : null}
            </label>
            <textarea
              ref={textarea}
              id={`${id}-text`}
              className="return__textarea"
              value={text}
              rows={12}
              onChange={(e) => setEdited(e.target.value)}
              placeholder="Choose at least one finding, or write the correction here."
            />
            {edited !== null ? (
              <Button variant="ghost" size="compact" leadingIcon="undo" onClick={() => setEdited(null)}>
                Reset to the composed message
              </Button>
            ) : null}
          </div>
        </div>
        {asking ? (
          <footer className="return__footer return__footer--ask" role="group" aria-label="Discard your edits?">
            <span className="return__ask">Discard your edits to the message?</span>
            <Button variant="ghost" onClick={() => setAsking(false)}>
              Keep editing
            </Button>
            <Button ref={discard} variant="danger" onClick={onClose}>
              Discard and close
            </Button>
          </footer>
        ) : (
          <footer className="return__footer">
            <span className="return__count">{included.size} of {returnable.length} findings</span>
            <Button variant="ghost" onClick={requestClose}>
              Cancel
            </Button>
            <Button variant="primary" leadingIcon="send" disabled={text.trim().length === 0} onClick={() => onSend(text, [...included])}>
              Send to agent
            </Button>
          </footer>
        )}
      </div>
    </div>
  );
}

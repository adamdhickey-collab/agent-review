import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Icon } from '../../components';
import type { Finding } from '../../data/types';
import './ReturnPanel.css';

/* Return to agent. The reviewer chooses findings; each contributes its
   correction, with its rule, to a message; the reviewer edits the whole
   before sending. The composed text is what the agent receives, so it is
   precise on purpose: which component, which prop, which file, which
   story to add. A free text box would make the reviewer write that from
   memory, and most would not.

   A dialog: focus moves in, Escape closes, focus returns. */

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

export function ReturnPanel({ findings, initiallyIncluded, onSend, onClose }: ReturnPanelProps) {
  const id = useId();
  const [included, setIncluded] = useState<Set<string>>(new Set(initiallyIncluded));
  const composed = useMemo(() => compose(findings, included), [findings, included]);
  const [edited, setEdited] = useState<string | null>(null);
  const text = edited ?? composed;

  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLElement>('input, button, textarea')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [onClose]);

  const returnable = findings.filter((f) => f.correction);

  return (
    <div className="return-backdrop" onClick={onClose}>
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
        <footer className="return__footer">
          <span className="return__count">{included.size} of {returnable.length} findings</span>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" leadingIcon="send" disabled={text.trim().length === 0} onClick={() => onSend(text, [...included])}>
            Send to agent
          </Button>
        </footer>
      </div>
    </div>
  );
}

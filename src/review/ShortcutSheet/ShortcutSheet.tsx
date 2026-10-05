import { useEffect, useId, useRef } from 'react';
import { Checkbox, IconButton } from '../../components';
import { SHORTCUTS, setSingleKeys, useSingleKeys } from '../../app/shortcuts';
import './ShortcutSheet.css';

/* The list of keyboard shortcuts, in a dialog. Opened by the question mark or
   by the keyboard button in the bar; closed by Escape, by its close button,
   or by a press outside it.

   A new component, and why the system's did not do: there is no dialog in
   src/components. The one in the review, ReturnPanel, is a side sheet built
   to compose a message and to ask before discarding it; this is a short
   reference with nothing to lose, so it is the browser's own <dialog>, shown
   modally, which brings the focus trap, Escape, the inert page behind it and
   focus returned to where it was, with none of it written here. Everything
   inside it is the system's: IconButton, Checkbox.

   What it lists is app/shortcuts.ts, which is also what answers the keys, so
   the list is the behaviour. Under the list are the two things a reader
   should know that are not shortcuts: the switch for single keys, and that a
   decision has none. */

export interface ShortcutSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutSheet({ open, onClose }: ShortcutSheetProps) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const single = useSingleKeys();

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      /* Focus goes to the heading, not to the first control: this is a thing
         to read, and focus on the close button would open its tooltip over
         the list before anyone asked. Tab reaches the button next. */
      d.querySelector<HTMLElement>('h2')?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="shortcuts"
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      onKeyDown={(e) => {
        /* The browser closes a modal dialog on Escape by itself, but only for a
           key a person pressed; said here too, so it does not depend on that. */
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      }}
      onClick={(e) => {
        /* A press on the dialog itself is a press on its backdrop: the content is in a child that fills it. */
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="shortcuts__panel">
        <header className="shortcuts__head">
          <h2 id={`${id}-title`} className="shortcuts__title" tabIndex={-1}>
            Keyboard shortcuts
          </h2>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </header>
        <dl className="shortcuts__list">
          {SHORTCUTS.map((s) => (
            <div key={s.does} className="shortcuts__row">
              <dt>
                {s.keys.map((k, i) => (
                  <span key={k}>
                    {i > 0 ? <span className="shortcuts__or"> or </span> : null}
                    <kbd className="shortcuts__key">{k}</kbd>
                  </span>
                ))}
              </dt>
              <dd>
                <span className="shortcuts__does">{s.does}</span>
                <span className="shortcuts__where">{s.where}</span>
              </dd>
            </div>
          ))}
        </dl>
        <footer className="shortcuts__foot">
          <Checkbox label="Single-key shortcuts: ?, J and K" checked={single} onChange={(e) => setSingleKeys(e.target.checked)} />
          <p className="shortcuts__note">Switched off, the arrow keys still move between rows, and this list opens from the keyboard button in the bar.</p>
          <p className="shortcuts__note">
            <strong>Accept, Reject, Return and the answers to a decision have no shortcut.</strong> A decision is pressed on purpose, with the control in front of you.
          </p>
        </footer>
      </div>
    </dialog>
  );
}

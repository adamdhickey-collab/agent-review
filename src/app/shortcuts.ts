import { useSyncExternalStore, type KeyboardEvent } from 'react';

/* The keyboard layer: the few shortcuts the review has, in one place.

   SHORTCUTS is the list the sheet shows (review/ShortcutSheet), and it is
   written here, beside the code that answers the keys, so the list and the
   behaviour cannot drift apart: a shortcut that is not in this file is not a
   shortcut, and one that is here is one a reader can press.

   THREE RULES, each from somewhere:
   - A single-key shortcut can be switched off, or only works while the thing
     it acts on has focus (WCAG 2.1.4, Character Key Shortcuts). J and K only
     answer while a row in their list has focus; the question mark is the one
     that works from anywhere, so there is a switch for all three, in the
     sheet, and it is remembered. The arrow keys are not character keys and
     are never switched off.
   - No shortcut while a person is typing. A question mark in a message to
     the agent is a question mark.
   - No shortcut decides anything. Accept, Reject, Return and every answer to
     a decision are pressed on purpose, with the control in front of the
     person (ui-quality rule 6 asks a destructive action for a second step;
     a single key is the opposite of one). */

export interface Shortcut {
  /** The keys, as a keycap each. More than one is "either". */
  keys: string[];
  does: string;
  where: string;
}

export const SHORTCUTS: Shortcut[] = [
  { keys: ['?'], does: 'Open this list', where: 'Anywhere, unless you are typing' },
  { keys: ['J', '↓'], does: 'Move to the next row', where: 'The review queue and a change’s findings, while a row has focus' },
  { keys: ['K', '↑'], does: 'Move to the previous row', where: 'The review queue and a change’s findings, while a row has focus' },
  { keys: ['Enter'], does: 'Open the row or the finding that has focus', where: 'The review queue and a change’s findings' },
  { keys: ['←', '→'], does: 'Move between tabs, or between a control’s options', where: 'Tabs and segmented controls' },
  { keys: ['Esc'], does: 'Close a dialog, or back out of a question', where: 'Dialogs and confirmations' },
];

/* The switch for single-key shortcuts. On unless a person turned it off;
   remembered where storage allows, and for the visit where it does not. */
const KEY = 'agent-review:single-key-shortcuts';
const listeners = new Set<() => void>();
let forVisit: boolean | null = null;

export function singleKeysOn(): boolean {
  if (forVisit !== null) return forVisit;
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSingleKeys(on: boolean) {
  forVisit = on;
  try {
    if (on) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, 'off');
  } catch {
    /* the choice still holds for this visit */
  }
  listeners.forEach((notify) => notify());
}

export function useSingleKeys(): boolean {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    singleKeysOn,
    () => true,
  );
}

/** A person is typing: a text field, a textarea, a select's typeahead, or anything editable. */
export function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== 'function') return false;
  if (el.isContentEditable) return true;
  const field = el.closest('input, textarea, select');
  if (!field) return false;
  if (field instanceof HTMLInputElement) return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range'].includes(field.type);
  return true;
}

/** Whether a key press, anywhere, is the one that opens the list of shortcuts. */
export function opensSheet(e: globalThis.KeyboardEvent): boolean {
  if (e.key !== '?' || e.altKey || e.ctrlKey || e.metaKey) return false;
  if (isTyping(e.target) || !singleKeysOn()) return false;
  /* Not over a dialog that is already open: one thing in front of a person at a time. */
  return !document.querySelector('dialog[open], [aria-modal="true"]');
}

/* J and K, and the arrows, move focus between the rows of a list, while one
   of its rows has focus. Returned as a key handler for the list's own
   element, so it only ever hears keys pressed inside the list. `row` is what
   a row is, and `focus` is the thing in a row that takes focus. */
export function listKeys(row: string, focus: string) {
  return (e: KeyboardEvent<HTMLElement>) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target)) return;
    const letter = e.key === 'j' || e.key === 'k';
    const arrow = e.key === 'ArrowDown' || e.key === 'ArrowUp';
    if (!letter && !arrow) return;
    if (letter && (e.shiftKey || !singleKeysOn())) return;
    const rows = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(row)).filter((el) => el.getClientRects().length > 0);
    const at = rows.findIndex((el) => el.contains(document.activeElement));
    if (at === -1) return;
    const next = rows[at + (e.key === 'j' || e.key === 'ArrowDown' ? 1 : -1)];
    const target = next?.matches(focus) ? next : next?.querySelector<HTMLElement>(focus);
    if (!target) return; /* at an end: the key does what it would have */
    e.preventDefault();
    target.focus();
  };
}

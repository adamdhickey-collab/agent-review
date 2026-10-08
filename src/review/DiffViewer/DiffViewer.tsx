import { Badge, Button } from '../../components';
import type { DiffHunk } from '../../data/types';
import './DiffViewer.css';

/* A unified diff, small. Lines added and removed on the diff grounds; a
   line a finding points at is marked, and the selected finding's lines
   are emphasised. Rendered as a table so a row is a row to a screen
   reader and the line numbers are headers.

   A long line scrolls the table sideways, so the table is a tab stop (a
   keyboard can scroll it) and the marker column is sticky at the right
   edge: a line's marker is in view wherever the line has been scrolled to.
   The marker is a compact ghost Button around a warning Badge, which is
   24px tall, the least a target may be (WCAG 2.5.8). Its name says which
   finding it opens, after the word it shows: a diff can carry a dozen
   markers, and a dozen buttons all called "finding" cannot be told apart
   in a list of buttons or by Tab (WCAG 2.4.6). The visible word stays
   first, so a voice user who says it still matches (2.5.3). */

export interface DiffViewerProps {
  hunks: DiffHunk[];
  selectedFindingId?: string;
  onSelectFinding?: (id: string) => void;
  /** The title of the finding a marker opens, for the marker's name. */
  findingTitle?: (id: string) => string | undefined;
}

export function DiffViewer({ hunks, selectedFindingId, onSelectFinding, findingTitle }: DiffViewerProps) {
  if (hunks.length === 0) {
    return <p className="diff__empty">No diff excerpts for this change.</p>;
  }
  return (
    <div className="diff">
      {hunks.map((h) => (
        <section key={h.file} className="diff__file" aria-label={h.file}>
          <header className="diff__header">
            <code>{h.file}</code>
            <code className="diff__hunk">{h.header}</code>
          </header>
          <table className="diff__table" tabIndex={0}>
            <caption className="visually-hidden">Changed lines in {h.file}</caption>
            <tbody>
              {h.lines.map((l, i) => {
                const marked = l.findingId !== undefined;
                const selected = marked && l.findingId === selectedFindingId;
                const title = marked ? findingTitle?.(l.findingId!) : undefined;
                return (
                  <tr
                    key={i}
                    className={['diff__line', `diff__line--${l.kind}`, marked ? 'is-marked' : '', selected ? 'is-selected' : ''].filter(Boolean).join(' ')}
                  >
                    <td className="diff__sign" aria-hidden="true">
                      {l.kind === 'add' ? '+' : l.kind === 'remove' ? '−' : ' '}
                    </td>
                    <td className="diff__text">
                      <span className="visually-hidden">{l.kind === 'add' ? 'Added: ' : l.kind === 'remove' ? 'Removed: ' : ''}</span>
                      <code>{l.text}</code>
                    </td>
                    <td className="diff__mark">
                      {marked ? (
                        <Button
                          variant="ghost"
                          size="compact"
                          className="diff__finding"
                          onClick={() => onSelectFinding?.(l.findingId!)}
                          aria-pressed={selected}
                          aria-label={title ? `finding: ${title}` : undefined}
                        >
                          <Badge tone="warning">finding</Badge>
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

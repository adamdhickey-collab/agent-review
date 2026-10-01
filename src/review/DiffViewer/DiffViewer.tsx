import type { DiffHunk } from '../../data/types';
import './DiffViewer.css';

/* A unified diff, small. Lines added and removed on the diff grounds; a
   line a finding points at is marked, and the selected finding's lines
   are emphasised. Rendered as a table so a row is a row to a screen
   reader and the line numbers are headers. */

export interface DiffViewerProps {
  hunks: DiffHunk[];
  selectedFindingId?: string;
  onSelectFinding?: (id: string) => void;
}

export function DiffViewer({ hunks, selectedFindingId, onSelectFinding }: DiffViewerProps) {
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
          <table className="diff__table">
            <caption className="visually-hidden">Changed lines in {h.file}</caption>
            <tbody>
              {h.lines.map((l, i) => {
                const marked = l.findingId !== undefined;
                const selected = marked && l.findingId === selectedFindingId;
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
                        <button type="button" className="diff__finding" onClick={() => onSelectFinding?.(l.findingId!)} aria-pressed={selected}>
                          finding
                        </button>
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

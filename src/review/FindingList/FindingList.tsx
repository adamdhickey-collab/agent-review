import { Checkbox, EmptyState, Icon } from '../../components';
import { listKeys } from '../../app/shortcuts';
import { FINDING_KIND_LABEL, SEVERITY_LABEL, type Finding, type Severity } from '../../data/types';
import { FindingEvidence } from '../FindingEvidence/FindingEvidence';
import './FindingList.css';

/* The spine of the review. Findings in severity order; one open at a
   time, and the open one shows its evidence and the correction it would
   send. Each has a box to include it in the return message, which is
   how the reviewer composes the message by choosing rather than typing.

   The list is a list, the items are buttons, and the open item's
   evidence is a region named by the finding's title. A line above it says
   what the boxes are for and how many are checked, because nothing else on
   the screen does until the return dialog opens. */

const ORDER: Severity[] = ['blocking', 'decision', 'note'];

export interface FindingListProps {
  findings: Finding[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  included: Set<string>;
  onInclude: (id: string, include: boolean) => void;
  onOpenStory?: (storyId: string) => void;
}

/* J and K, and the arrows, move between the findings while one has focus,
   each by the button that opens it. */
const onListKey = listKeys('.finding', '.finding__button');

export function FindingList({ findings, selectedId, onSelect, included, onInclude, onOpenStory }: FindingListProps) {
  const sorted = [...findings].sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));
  if (sorted.length === 0) {
    return <EmptyState compact icon="circle-check" title="No findings" description="Every check passed. The change can be accepted as it is." />;
  }
  const sendable = sorted.filter((f) => f.correction.length > 0);
  const chosen = sendable.filter((f) => included.has(f.id)).length;
  return (
    <>
      {sendable.length > 0 ? (
        <p className="findings__legend">
          Checked findings go into the message if you return this change: {chosen} of {sendable.length}.
        </p>
      ) : null}
      <ol className="findings" onKeyDown={onListKey}>
        {sorted.map((f) => {
          const open = f.id === selectedId;
          const returnable = f.correction.length > 0;
          return (
            <li key={f.id} className={['finding', `finding--${f.severity}`, open ? 'is-open' : ''].filter(Boolean).join(' ')} data-kind={f.kind}>
              <div className="finding__row">
                {returnable ? (
                  <Checkbox
                    className="finding__include"
                    label={`Include “${f.title}” in the return message`}
                    hideLabel
                    checked={included.has(f.id)}
                    onChange={(e) => onInclude(f.id, e.target.checked)}
                  />
                ) : (
                  <span className="finding__include finding__include--none" aria-hidden="true" />
                )}
                <button
                  type="button"
                  className="finding__button"
                  aria-expanded={open}
                  aria-controls={`finding-${f.id}`}
                  onClick={() => onSelect(open ? undefined : f.id)}
                >
                  <span className="finding__marker" aria-hidden="true">
                    <Icon name={f.severity === 'blocking' ? 'status-failed' : f.severity === 'decision' ? 'status-changed' : 'status-note'} size={16} />
                  </span>
                  <span className="finding__text">
                    <span className="finding__title">{f.title}</span>
                    <span className="finding__meta">
                      <span className="finding__severity">{SEVERITY_LABEL[f.severity]}</span>
                      <span className="finding__kind">{FINDING_KIND_LABEL[f.kind]}</span>
                      {f.rules.length ? (
                        <span className="finding__rules">
                          {f.rules.map((r) => `rule ${r}`).join(', ')}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <Icon name="chevron-right" size={14} className="finding__chevron" />
                </button>
              </div>
              <div id={`finding-${f.id}`} className="finding__body" hidden={!open} role="region" aria-label={f.title}>
                <p className="finding__summary">{f.summary}</p>
                <FindingEvidence finding={f} onOpenStory={onOpenStory} />
                {returnable ? (
                  <div className="finding__correction">
                    <span className="finding__correction-label">
                      <Icon name="corner-up-left" size={12} />
                      Correction, if returned
                    </span>
                    <p>{f.correction}</p>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

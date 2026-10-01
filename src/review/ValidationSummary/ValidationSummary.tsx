import { TestStatus } from '../../components';
import type { FindingKind, ValidationSummary as Summary } from '../../data/types';
import './ValidationSummary.css';

/* Five lanes, one line. Each is a check's answer in two words, and each
   is a filter on the findings below it. Hierarchy from the state, not
   from size: a failed lane is red ink, a changed one amber, a passed one
   quiet. No cards, no numerals set large. */

const LANES: { key: keyof Summary; label: string; kinds: FindingKind[] }[] = [
  { key: 'visual', label: 'Visual', kinds: ['visual'] },
  { key: 'accessibility', label: 'Accessibility', kinds: ['accessibility'] },
  { key: 'interaction', label: 'Interaction', kinds: ['interaction'] },
  { key: 'components', label: 'Components', kinds: ['component', 'state'] },
  { key: 'tokens', label: 'Tokens', kinds: ['token'] },
];

export interface ValidationSummaryProps {
  summary: Summary;
  /** The lane whose findings are shown, or none for all. */
  active?: keyof Summary;
  onSelect?: (lane: keyof Summary | undefined) => void;
}

export function ValidationSummary({ summary, active, onSelect }: ValidationSummaryProps) {
  return (
    <div className="validation" role="group" aria-label="Validation summary">
      {LANES.map((lane) => {
        const v = summary[lane.key];
        const selected = active === lane.key;
        const body = (
          <>
            <span className="validation__name">{lane.label}</span>
            <TestStatus state={v.state} label={v.label} className="validation__result" />
          </>
        );
        return onSelect ? (
          <button
            key={lane.key}
            type="button"
            className="validation__lane"
            aria-pressed={selected}
            onClick={() => onSelect(selected ? undefined : lane.key)}
            data-state={v.state}
          >
            {body}
          </button>
        ) : (
          <div key={lane.key} className="validation__lane" data-state={v.state}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

export function kindsForLane(lane: keyof Summary): FindingKind[] {
  return LANES.find((l) => l.key === lane)!.kinds;
}

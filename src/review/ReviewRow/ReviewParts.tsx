import { StatusIndicator, TestStatus, type StatusTone } from '../../components';
import { REVIEW_STATE_LABEL, type Change, type ReviewState } from '../../data/types';
import './ReviewRow.css';

/* The two things a queue entry says that are not text: the five validation
   lanes, and the state. Shared by the table row and the phone's card, so a
   lane added or a tone changed is changed once and the two cannot say
   different things about the same change. */

export const STATE_TONE: Record<ReviewState, StatusTone> = {
  'needs-review': 'warning',
  ready: 'success',
  validating: 'neutral',
  returned: 'accent',
  accepted: 'success',
  rejected: 'danger',
};

/** The five lanes as icons with names, in a fixed order, and the count of
    blocking findings beside them. */
export function ReviewLanes({ change }: { change: Change }) {
  const v = change.validation;
  const blocking = change.findings.filter((f) => f.severity === 'blocking').length;
  return (
    <span className="review-row__lanes">
      <TestStatus state={v.visual.state} label={`Visual: ${v.visual.label}`} iconOnly />
      <TestStatus state={v.accessibility.state} label={`Accessibility: ${v.accessibility.label}`} iconOnly />
      <TestStatus state={v.interaction.state} label={`Interaction: ${v.interaction.label}`} iconOnly />
      <TestStatus state={v.components.state} label={`Components: ${v.components.label}`} iconOnly />
      <TestStatus state={v.tokens.state} label={`Tokens: ${v.tokens.label}`} iconOnly />
      {blocking ? <span className="review-row__blocking">{blocking} blocking</span> : null}
    </span>
  );
}

/** The change's state: a dot for the glance, the word for the meaning, and
    a live dot while validation is still running. */
export function ReviewStatus({ change }: { change: Change }) {
  return <StatusIndicator tone={STATE_TONE[change.state]} label={REVIEW_STATE_LABEL[change.state]} live={change.state === 'validating'} />;
}

import { forwardRef } from 'react';
import { Icon } from '../../components';
import { account, find, valuesIn, type DelegationState, type Work } from '../../data/delegation';
import { plural } from '../format';
import './OutcomeSummary.css';

/* The account the delegated work opens on: what got done, how it was
   checked, what is still open, and whether the agent stayed inside what it
   was allowed to do. Four sentences, not four big numbers: each figure is
   counted from the work (data/delegation.ts, `account`) and sits inside a
   sentence that says what it means.

   The lead says whether anything needs the person. When nothing does, it
   says so first and stops: the quiet state is the result the screen is for,
   so it reads as finished rather than as an empty queue. */

const join = (parts: string[], word = 'and') =>
  parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} ${word} ${parts[parts.length - 1]}`;

export interface OutcomeSummaryProps {
  state: DelegationState;
}

export const OutcomeSummary = forwardRef<HTMLParagraphElement, OutcomeSummaryProps>(function OutcomeSummary({ state }, ref) {
  const a = account(state);
  const quiet = a.asking.length === 0;

  const share = a.valuesMade === a.total ? `All ${a.total} literals the lint reported are` : `${a.valuesMade} of the ${a.total} literals the lint reported are`;
  const done = [`${plural(a.made.length, 'change')} merged to main. ${share} tokens now, and none moved a pixel.`];
  if (a.reverted.length) done.push(`${plural(a.reverted.length, 'change')} reverted by you.`);
  if (a.left.length) done.push(`${plural(a.left.length, 'line')} left as written, by you.`);

  const checked = ['The token lint, the visual baselines and the stories with axe ran on every change.'];
  for (const w of a.fixed) checked.push(`A first try in the ${w.screen.toLowerCase()} failed two of them and was fixed.`);
  for (const w of a.inconclusive) checked.push(`One result in the ${w.screen.toLowerCase()} is inconclusive.`);

  const unresolved: string[] = [];
  const groups = new Map<string, Work[]>();
  for (const w of a.waiting) groups.set(w.waitsOn!, [...(groups.get(w.waitsOn!) ?? []), w]);
  for (const [on, ws] of groups) {
    unresolved.push(`${plural(ws.length, 'change')} ${ws.length === 1 ? 'waits' : 'wait'} on your answer about the ${find(state, on)?.screen.toLowerCase()}.`);
  }
  for (const w of a.inconclusive) unresolved.push(`Whether a label in the ${w.screen.toLowerCase()} clears 4.5:1. The axe check couldn’t measure it, before this run or after it.`);
  const back = valuesIn([...a.reverted, ...a.left]);
  if (back) unresolved.push(`The lint reports ${plural(back, 'literal')} you reverted or left as written.`);
  if (!unresolved.length) unresolved.push('Nothing.');

  const bases = ['its own boundaries'];
  if (a.byRule.length) bases.push('your rule');
  if (a.made.some((w) => w.basis?.kind === 'answer')) bases.push('your answers');
  const scope = [`Every change was made under ${join(bases, 'or')}.`];
  if (a.allowedOnce.length) scope.push(`${a.allowedOnce.length === 1 ? 'One' : a.allowedOnce.length} went past them because you allowed it, once.`);
  if (a.scopeAsks.length) scope.push('One stopped at the edge: it needs a new token, and the token layer is outside the delegation.');

  return (
    <section className="outcome" aria-label="What happened">
      <p ref={ref} className="outcome__lead" tabIndex={-1} data-quiet={quiet || undefined}>
        {quiet ? (
          <>
            <Icon name="status-passed" size={20} className="outcome__mark" />
            Nothing needs your attention.
          </>
        ) : (
          <>
            {plural(a.made.length, 'change')} made and checked. {plural(a.asking.length, 'decision')} {a.asking.length === 1 ? 'needs' : 'need'} you.
          </>
        )}
      </p>
      {quiet ? (
        <p className="outcome__sub">
          {plural(a.made.length, 'change')} made and checked. Completed work is below.
        </p>
      ) : null}
      <dl className="outcome__facts">
        <div>
          <dt>Done</dt>
          <dd>{done.join(' ')}</dd>
        </div>
        <div>
          <dt>Checked</dt>
          <dd>{checked.join(' ')}</dd>
        </div>
        <div>
          <dt>Unresolved</dt>
          <dd>{unresolved.join(' ')}</dd>
        </div>
        <div>
          <dt>Scope</dt>
          <dd>{scope.join(' ')}</dd>
        </div>
      </dl>
    </section>
  );
});

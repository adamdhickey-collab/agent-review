import { forwardRef } from 'react';
import { Badge, Icon, type BadgeTone, type IconName } from '../../components';
import { account, valuesIn, type CheckName, type DelegationState } from '../../data/delegation';
import { plural } from '../format';
import './OutcomeSummary.css';

/* The account the delegated work opens on, built to be read at a glance:
   whether anything needs the person, how far the job got, how it was
   checked, what is still unresolved, and whether the agent stayed inside
   what it was allowed to do. Every figure is counted from the work
   (data/delegation.ts, `account`), never carried.

   It was four rows of sentences (done, checked, unresolved, scope), about
   ninety words that repeated the lead's numbers in prose. Now the lead
   says the answer in words, a bar shows the job's progress in the one unit
   the request was written in (the literals the lint reported), each check
   is a Badge with its count, and the two rows left are one line each.
   Nothing the sentences said is gone: the fix after a failed first try,
   the inconclusive result and what it could not measure, the reversals,
   and the scope are all here, shorter.

   The lead says whether anything needs the person. When nothing does, it
   says so first: the quiet state is the result the screen is for, so it
   reads as finished rather than as an empty queue. */

const join = (parts: string[], word = 'and') =>
  parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} ${word} ${parts[parts.length - 1]}`;

const CHECKS: { name: CheckName; short: string }[] = [
  { name: 'Token lint', short: 'Token lint' },
  { name: 'Visual baselines', short: 'Visual baselines' },
  { name: 'Stories with axe', short: 'Axe' },
];

type Segment = { kind: 'made' | 'asking' | 'waiting' | 'back'; n: number; label: string };

export interface OutcomeSummaryProps {
  state: DelegationState;
}

export const OutcomeSummary = forwardRef<HTMLParagraphElement, OutcomeSummaryProps>(function OutcomeSummary({ state }, ref) {
  const a = account(state);
  const quiet = a.asking.length === 0;
  const back = [...a.reverted, ...a.left];

  const segments: Segment[] = [
    { kind: 'made' as const, n: a.valuesMade, label: 'merged' },
    { kind: 'asking' as const, n: valuesIn(a.asking), label: 'asking you' },
    { kind: 'waiting' as const, n: valuesIn(a.waiting), label: 'waiting on an answer' },
    { kind: 'back' as const, n: valuesIn(back), label: 'reverted or left by you' },
  ].filter((s) => s.n > 0);

  const checked = [...a.made, ...a.reverted].filter((w) => w.checks);
  const checks = CHECKS.map(({ name, short }) => {
    const results = checked.map((w) => w.checks!.find((c) => c.name === name)).filter(Boolean);
    const passed = results.filter((c) => c!.state === 'passed').length;
    const failed = results.filter((c) => c!.state === 'failed').length;
    const unsure = results.filter((c) => c!.state === 'inconclusive').length;
    const tone: BadgeTone = failed ? 'danger' : unsure ? 'neutral' : 'success';
    const icon: IconName = failed ? 'status-failed' : unsure ? 'status-inconclusive' : 'status-passed';
    const extra = [failed ? `${failed} failed` : '', unsure ? `${unsure} inconclusive` : ''].filter(Boolean).join(', ');
    return { name, text: `${short}: ${passed} of ${results.length} passed${extra ? `, ${extra}` : ''}`, tone, icon };
  });

  const unresolved: { icon: IconName; text: string }[] = [];
  for (const w of a.inconclusive) {
    unresolved.push({ icon: 'status-inconclusive', text: `Axe couldn’t measure whether a label in the ${w.screen.toLowerCase()} clears 4.5:1, before this run or after.` });
  }
  if (a.reverted.length) {
    const n = valuesIn(a.reverted);
    unresolved.push({ icon: 'undo', text: `${plural(a.reverted.length, 'change')} reverted by you. The lint reports ${a.reverted.length === 1 ? 'its' : 'their'} ${plural(n, 'literal')} again.` });
  }
  if (a.left.length) {
    unresolved.push({ icon: 'undo', text: `${plural(a.left.length, 'line')} left as written, by you. The lint still reports ${a.left.length === 1 ? 'it' : 'them'}.` });
  }

  const bases = ['its own boundaries'];
  if (a.byRule.length) bases.push('your rule');
  if (a.made.some((w) => w.basis?.kind === 'answer')) bases.push('your answers');
  const scope = [`Every change was made under ${join(bases, 'or')}.`];
  if (a.allowedOnce.length) scope.push(`${a.allowedOnce.length === 1 ? 'One' : a.allowedOnce.length} went past them because you allowed it, once.`);
  if (a.scopeAsks.length) scope.push('One stopped at the edge: it needs a new token.');

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

      <div className="outcome__progress">
        <p className="outcome__share">
          <strong>{a.valuesMade === a.total ? `All ${a.total}` : `${a.valuesMade} of ${a.total}`}</strong> literals are tokens now, and none moved a pixel.
        </p>
        <div className="outcome__bar" aria-hidden="true">
          {segments.map((s) => (
            <span key={s.kind} className="outcome__segment" data-kind={s.kind} style={{ flexGrow: s.n }} />
          ))}
        </div>
        <ul className="outcome__legend" aria-label="Where the literals are">
          {segments.map((s) => (
            <li key={s.kind} data-kind={s.kind}>
              <span className="outcome__swatch" aria-hidden="true" />
              <span>
                <strong>{s.n}</strong> {s.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <dl className="outcome__facts">
        <div>
          <dt>Checks</dt>
          <dd>
            <ul className="outcome__checks" aria-label="Checks run on every change">
              {checks.map((c) => (
                <li key={c.name}>
                  <Badge size="large" tone={c.tone} icon={c.icon}>
                    {c.text}
                  </Badge>
                </li>
              ))}
            </ul>
            {a.fixed.map((w) => {
              const n = w.checks!.filter((c) => c.earlier?.state === 'failed').length;
              return (
                <p key={w.id} className="outcome__note">
                  A first try in the {w.screen.toLowerCase()} failed {n === 1 ? 'one check' : n === 2 ? 'two checks' : plural(n, 'check')} and was fixed.
                </p>
              );
            })}
          </dd>
        </div>
        <div>
          <dt>Unresolved</dt>
          <dd>
            {unresolved.length ? (
              <ul className="outcome__lines">
                {unresolved.map((u) => (
                  <li key={u.text}>
                    <Icon name={u.icon} size={16} />
                    <span>{u.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              'Nothing.'
            )}
          </dd>
        </div>
        <div>
          <dt>Scope</dt>
          <dd>
            <p className="outcome__line">
              <Icon name="circle-check" size={16} className="outcome__scope-mark" />
              <span>{scope.join(' ')}</span>
            </p>
          </dd>
        </div>
      </dl>
    </section>
  );
});

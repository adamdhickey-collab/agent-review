import { forwardRef } from 'react';
import { Badge, Icon, type BadgeTone, type IconName } from '../../components';
import { account, BOUNDARY_GROUP_ICON, valuesIn, wordsOf, type CheckName, type Decision, type DelegationState } from '../../data/delegation';
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
   reads as finished rather than as an empty queue.

   What the person holds up is one segment, counted in literals and named
   in the lead's own unit: "10 waiting on your 2 decisions". It was two,
   "3 asking you" and "7 waiting on an answer", and neither reconciled with
   the lead: the lead counts decisions, the legend counted literals without
   saying so, and a reader who had just read "2 decisions need you" met a
   3 and a 7. Every literal not yet merged or taken back hinges on those
   decisions, the ones held behind a question as much as the question's
   own, so the bar reads as progress: what is done, and what remains on
   the person. It takes the waiting style rather than the warning fill,
   because what it shows is remaining, not wrong.

   THE THREE KINDS OF WORK, COUNTED, SINCE 2026-10-09. Under the lead, one
   line says how the run's changes were handled, in the three modes the
   product is built around: how many the agent proceeded with on its own,
   how many stopped for the person's judgment, and how many stopped for
   their approval, each with the mark its boundary group carries. A fourth
   count, what the person has settled, appears once there is one. The
   reader who arrives knowing nothing is told in one line what kind of
   product this is: most of the work needed nobody, and the two that did
   are two different kinds of stop.

   AS TILES, SINCE 2026-10-09. The counts were one line of three cells, the
   number the size of the words beside it, so the account still read as a
   sentence. Every product the research looked at that reports a run
   (Gumloop's insights, Linear's project progress, the health and budget
   apps) sets the count as the headline and the words as its caption, and
   that is what this is now: a tile per mode, its mark and its number on
   the first line, what the number counts under it, and the changes held
   behind the judgment as a muted third line on that tile. The tiles are
   tonal, not raised: the decisions stay the screen's only cards. The text
   a screen reader or a test reads is the line's, to the character: a
   space still parts the number from its words, and the separator before
   the held changes is in the text and hidden on the screen, where the
   note has a line of its own. */

const join = (parts: string[], word = 'and') =>
  parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} ${word} ${parts[parts.length - 1]}`;

const CHECKS: { name: CheckName; short: string }[] = [
  { name: 'Token lint', short: 'Token lint' },
  { name: 'Visual baselines', short: 'Visual baselines' },
  { name: 'Stories with axe', short: 'Axe' },
];

type Segment = { kind: 'made' | 'waiting' | 'back'; n: number; label: string };

function factsOf(a: ReturnType<typeof account>, decisions: Decision[] = []) {
  const checked = [...a.made, ...a.reverted].filter((w) => w.checks);
  const checks = CHECKS.map(({ name, short }) => {
    const results = checked.map((w) => w.checks!.find((c) => c.name === name)).filter(Boolean);
    const passed = results.filter((c) => c!.state === 'passed').length;
    const failed = results.filter((c) => c!.state === 'failed').length;
    const unsure = results.filter((c) => c!.state === 'inconclusive').length;
    /* A check that changed is one a person approved moving (the shared-table
       run's baselines): not a pass, so not counted as one, and not a
       failure either. It is said, with the caution mark the check uses. */
    const changed = results.filter((c) => c!.state === 'changed').length;
    const tone: BadgeTone = failed ? 'danger' : unsure || changed ? 'neutral' : 'success';
    /* A check that passed asks nothing of the reader, so its badge is quiet:
       the mark keeps the green and the ground stays neutral. A failure keeps
       its tint, and so the one that needs a look is the one that has color. */
    const variant = tone === 'success' ? ('quiet' as const) : ('tint' as const);
    const icon: IconName = failed ? 'status-failed' : unsure ? 'status-inconclusive' : changed ? 'status-changed' : 'status-passed';
    const extra = [failed ? `${failed} failed` : '', unsure ? `${unsure} inconclusive` : '', changed ? `${changed} changed` : ''].filter(Boolean).join(', ');
    return { name, text: `${short}: ${passed} of ${results.length} passed${extra ? `, ${extra}` : ''}`, tone, variant, icon };
  });

  const unresolved: { icon: IconName; text: string }[] = [];
  for (const w of a.inconclusive) {
    unresolved.push({ icon: 'status-inconclusive', text: `Axe couldn’t measure whether a label in the ${w.screen.toLowerCase()} clears 4.5:1, before this run or after.` });
  }
  /* What a change left open once it merged, in its own words: the screens
     nobody has looked at after a shared change was allowed, or the other
     screens a local fix left as they were. */
  for (const w of a.made) {
    if (w.open) unresolved.push({ icon: w.basis?.kind === 'allowed-once' ? 'status-changed' : 'status-note', text: w.open });
  }
  /* What a decision left to do, until somebody does it: the follow-up it
     opened, which no change in this run closes. */
  for (const d of decisions) {
    unresolved.push({ icon: 'flag', text: `Follow-up from your decision at ${d.at}: ${d.followUp.charAt(0).toLowerCase()}${d.followUp.slice(1)}` });
  }
  if (a.reverted.length) {
    const n = valuesIn(a.reverted);
    const lint = a.reverted.some((w) => !w.undo);
    unresolved.push({
      icon: 'undo',
      text: lint
        ? `${plural(a.reverted.length, 'change')} reverted by you. The lint reports ${a.reverted.length === 1 ? 'its' : 'their'} ${plural(n, 'literal')} again.`
        : `${plural(a.reverted.length, 'change')} reverted by you.`,
    });
  }
  if (a.left.length) {
    unresolved.push({ icon: 'undo', text: `${plural(a.left.length, 'line')} left as written, by you. The lint still reports ${a.left.length === 1 ? 'it' : 'them'}.` });
  }

  const bases = ['its own boundaries'];
  if (a.byRule.length) bases.push('your rule');
  if (a.made.some((w) => w.basis?.kind === 'answer')) bases.push('your answers');
  const scope = [`Every change was made under ${join(bases, 'or')}.`];
  if (a.allowedOnce.length) scope.push(`${a.allowedOnce.length === 1 ? 'One' : a.allowedOnce.length} went past them because you allowed it, once.`);
  if (a.scopeAsks.length) scope.push(`One stopped at the edge: ${a.scopeAsks[0].question?.edge ?? 'it needs permission'}.`);
  return { checks, unresolved, scope };
}

/* One tile's contents: the mark and the count on the first line, the words
   under them, and a note under those. The space between the count and the
   words, and the separator before the note, are what keep the list's text
   the sentence it was ("1 needs your judgment · 4 more wait on it"). */
function Mode({ icon, n, words, note }: { icon: IconName; n: number; words: string; note?: string }) {
  return (
    <>
      <span className="outcome__mode-head">
        <Icon name={icon} size={16} />
        <strong>{n}</strong>
      </span>{' '}
      <span className="outcome__mode-words">{words}</span>
      {note ? (
        <span className="outcome__mode-note">
          <span className="outcome__mode-sep"> · </span>
          {note}
        </span>
      ) : null}
    </>
  );
}

export interface OutcomeSummaryProps {
  state: DelegationState;
}

export const OutcomeSummary = forwardRef<HTMLParagraphElement, OutcomeSummaryProps>(function OutcomeSummary({ state }, ref) {
  const a = account(state);
  const words = wordsOf(state.brief);
  const quiet = a.asking.length === 0;
  const back = [...a.reverted, ...a.left];
  /* A change held behind a question with nothing asking is a state the
     reducer never reaches (answering a question settles or asks everything
     held behind it), so it gets no wording of its own beyond "waiting". */
  const decisions = a.asking.length === 1 ? 'decision' : plural(a.asking.length, 'decision');

  /* Every kind keeps its segment in the bar, at zero when it is empty, so
     an answer that merges what was waiting moves the boundary between them
     rather than redrawing the bar; the legend names only what is there. */
  const kinds: Segment[] = [
    { kind: 'made' as const, n: a.valuesMade, label: 'merged' },
    { kind: 'waiting' as const, n: valuesIn(a.asking) + valuesIn(a.waiting), label: a.asking.length ? `waiting on your ${decisions}` : 'waiting' },
    { kind: 'back' as const, n: valuesIn(back), label: 'reverted or left by you' },
  ];
  const segments = kinds.filter((s) => s.n > 0);

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

      <ul className="outcome__modes" aria-label="How the work was handled">
        <li data-mode="own" data-zero={a.own.length === 0 || undefined}>
          <Mode icon={BOUNDARY_GROUP_ICON.own} n={a.own.length} words="proceeded on its own" />
        </li>
        <li data-mode="asks" data-zero={a.intentAsks.length === 0 || undefined}>
          <Mode
            icon={BOUNDARY_GROUP_ICON.asks}
            n={a.intentAsks.length}
            words={`${a.intentAsks.length === 1 ? 'needs' : 'need'} your judgment`}
            note={a.waiting.length ? `${a.waiting.length} more wait on it` : undefined}
          />
        </li>
        <li data-mode="outside" data-zero={a.scopeAsks.length === 0 || undefined}>
          <Mode icon={BOUNDARY_GROUP_ICON.outside} n={a.scopeAsks.length} words={`${a.scopeAsks.length === 1 ? 'needs' : 'need'} your approval`} />
        </li>
        {a.settled.length ? (
          <li data-mode="you">
            <Mode icon="user" n={a.settled.length} words="settled by you" />
          </li>
        ) : null}
      </ul>

      <div className="outcome__progress">
        <p className="outcome__share">
          <strong>{a.valuesMade === a.total ? `All ${a.total}` : `${a.valuesMade} of ${a.total}`}</strong> {words.unit[1]} {words.done}.
        </p>
        <div className="outcome__bar" aria-hidden="true">
          {kinds.map((s) => (
            <span key={s.kind} className="outcome__segment" data-kind={s.kind} data-empty={s.n === 0 || undefined} style={{ flexGrow: s.n }} />
          ))}
        </div>
        <ul className="outcome__legend" aria-label={`Where the ${words.unit[1]} are`}>
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
    </section>
  );
});

/* What the checks established, and what they could not: the three rows under
   the account. It is its own section because the delegated work puts it after
   the decisions, not between the title and them: a person who has decisions to
   make is told how the run went in one sentence and a bar, asked first, and
   then shown the evidence for the sentence. Nothing here was shortened or
   hidden by being moved; the unresolved check is as visible as it was. */
export function OutcomeFacts({ state }: { state: DelegationState }) {
  const a = account(state);
  const { checks, unresolved, scope } = factsOf(a, state.decisions);
  return (
    <section className="outcome" aria-label="What the checks established">
      <dl className="outcome__facts">
        <div>
          <dt>Checks</dt>
          <dd>
            <ul className="outcome__checks" aria-label="Checks run on every change">
              {checks.map((c) => (
                <li key={c.name}>
                  <Badge size="large" tone={c.tone} variant={c.variant} icon={c.icon}>
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
}

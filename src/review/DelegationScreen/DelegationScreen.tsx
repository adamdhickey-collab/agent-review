import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Badge, Button, Disclosure, Icon, IconButton } from '../../components';
import { useStore } from '../../app/store';
import { href } from '../../app/router';
import { account, activeRule, ruleText, waitingOn, whyAsking, wordsOf, wouldSettle, type Action, type Pattern, type RunId, type Work } from '../../data/delegation';
import { plural, relativeTime } from '../format';
import { OutcomeFacts, OutcomeSummary } from '../OutcomeSummary/OutcomeSummary';
import { DecisionRead, DecisionRequest, type RulePreview } from '../DecisionRequest/DecisionRequest';
import { DecisionPreview, type PreviewView } from '../DecisionPreview/DecisionPreview';
import { DecisionRecord } from '../DecisionRecord/DecisionRecord';
import { RecordHead, WorkRecord } from '../WorkRecord/WorkRecord';
import { Boundaries } from '../Boundaries/Boundaries';
import './DelegationScreen.css';
import { Inline } from '../Inline';

/* The front door: work an agent was handed, and what came of it. The
   review queue asks a person to look at every change; this screen is built
   for the case that should become ordinary as agents get better, where
   most of the work needed nobody, and says so first.

   In order: that this is a simulation, and a way back to its start; what
   was delegated, by whom; the account (OutcomeSummary); the decisions that
   need the person, each a DecisionRequest; and the completed work, each a
   WorkRecord, newest first. Beside it, or under it on a narrow screen, the
   boundaries the agent works inside and the rules the person has added.

   When nothing needs the person, the "Needs you" section is not there at
   all. The account says "Nothing needs your attention." and the work is
   below it. Nothing is invented to fill the space.

   The screen owns behaviour, the components own markup. Every change of
   state is an action on the store's reducer (data/delegation.ts). After an
   answer the card that asked is gone, so focus goes to what comes next: the
   next question's section, or the account once none is left. What happened
   is said in a visible line that is also a live region.

   READ AT A GLANCE, SINCE 2026-10-04. The screen said everything in
   sentences, and a person arriving at it read a paragraph before they knew
   how the run had gone. Now: the simulation is a labelled strip with a
   real button to reset it; the header is who and when on one line and the
   title, with the request one press away; the account is a bar and badges
   (OutcomeSummary); each decision is its answers (DecisionRequest); the
   completed work labels its check columns once, marks only the work that
   was not done on its own, and folds the routine swaps, where every check
   passed and nothing needed judgment, into one row; and the boundaries are
   three counted rows (Boundaries). Nothing was removed that the person can
   act on, and nothing simulated is said as if it were real.

   TWO RUNS, SINCE 2026-10-07. The billing run's decision is missing
   intent: two reds, and no check can say which meaning is right. A second
   run, the shared table, is a permission boundary: the agent knows exactly
   how to make the fix, and the fix is in a component forty screens share.
   The strip that says this is a simulation also says which one is playing,
   and switches between them. They are links, not the system's
   SegmentedControl, because a run is a place with an address
   (#/runs/shared-table), so it can be linked to, bookmarked and gone back
   from, and following one moves focus to the new run's title the way any
   change of screen does; a radio group that navigated would take focus
   away from the arrow key that moved it. Each run keeps its own state while
   the other is on screen, and Reset puts back the one shown.

   WHAT HAPPENED NEXT, SINCE 2026-10-09. After a decision the card that
   asked is gone, and what used to stand in its place was one grey line.
   It is a result now: a mark for the kind of thing that happened (done,
   taken back, or left open), the sentence, and, when the answer made or
   used a rule, a button to the rule under the boundaries, so a person who
   has just decided can see what the decision became without hunting for
   it. The sentence is still the live region. Nothing is claimed that the
   reducer did not do: the agent merged what the answer settled, and a rule
   exists because the person made one.

   YOUR DECISIONS, SINCE 2026-10-09, LATER. A decision on a trade-off
   leaves a record (DecisionRecord): what the agent did, the person's
   reason, the trade-off they accepted, the risk that remains, the
   follow-up it opened and whether it became a rule. The records are a
   section of their own under the decisions still asking, newest first,
   so the card that asked turns into what it decided a few lines down, and
   the notice points at it.

   PREVIEW STUDIO, SINCE 2026-10-11 (LATER). The screen was a document: the
   decisions were cards in a column, each drawing its two reds as tiles, and
   a person weighed a change to an interface without ever seeing the
   interface. It is a workspace now, in three bands:

   - The chrome: a bar under the app's, on the same ground, holding which
     sample run this is (the links that switch between them), that it is
     simulated, in one quiet line, and the reset. Then the job: who
     delegated it, its title, the request, and the account, counted from
     the fixtures as before, as a band rather than a block.
   - The workspace, for whatever needs the person. On the left, about two
     thirds of it, the interface the decision changes (DecisionPreview),
     with the element marked; under it, what the agent read and found
     (DecisionRead). On the right, the inspector (DecisionRequest): which
     decision this is and of how many, with a way to the others, then the
     decision itself. Selecting a direction there previews it on the left,
     labelled as proposed and not applied; Apply goes through the reducer,
     as every answer always has. One decision at a time, so the preview is
     always of the decision being read; the account and the pager say how
     many others there are.
   - The rest of the run, under the workspace, as it was: the decisions
     made, what the checks established, the completed work, and beside them
     the boundaries and the rules.

   Under 56rem the workspace is one column, the preview first, then the
   read, then the inspector, and nothing is dropped. Nothing is fixed to the
   window's height and nothing scrolls inside anything else: the page grows. */

/* The runs, as the switch names them: what each is about, in two words. */
const RUNS: { id: RunId; label: string; kind: string }[] = [
  { id: 'billing', label: 'Two reds', kind: 'missing intent' },
  { id: 'shared-table', label: 'Shared table', kind: 'a permission boundary' },
];

/* The shorter of the workspace's two columns follows the page while the
   longer one is read, so the interface stays beside the reasoning about it
   (or the decision beside a long read): but only when the whole of it fits
   the window, so following never holds any of it out of view, and only
   while there are two columns (the stylesheet says when). Measured rather
   than assumed, because which is shorter depends on the decision and on
   what is open in it; re-measured whenever either changes size. */
function useFollow(a: RefObject<HTMLElement | null>, b: RefObject<HTMLElement | null>, key: string) {
  useLayoutEffect(() => {
    const one = a.current;
    const two = b.current;
    if (!one || !two) return;
    const decide = () => {
      const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      const room = window.innerHeight - 2 * 16 * zoom; /* --space-4 above and below, at the page's zoom */
      const h1 = one.getBoundingClientRect().height;
      const h2 = two.getBoundingClientRect().height;
      one.toggleAttribute('data-follows', h1 < h2 && h1 <= room);
      two.toggleAttribute('data-follows', h2 < h1 && h2 <= room);
    };
    decide();
    const ro = new ResizeObserver(decide);
    ro.observe(one);
    ro.observe(two);
    window.addEventListener('resize', decide);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', decide);
    };
  }, [a, b, key]);
}

/* Work with nothing to look at: made on its own, every check passed on the
   first run, nothing chosen by meaning. Folded into one row. */
function routine(w: Work): boolean {
  return (
    w.status === 'made' &&
    w.basis?.kind === 'boundary' &&
    !w.unchecked &&
    (w.checks ?? []).every((c) => c.state === 'passed' && !c.earlier)
  );
}

function latest(w: Work): string {
  return w.history[w.history.length - 1]?.at ?? '';
}

export function DelegationScreen({ run = 'billing' }: { run?: RunId }) {
  const { runs, delegate: dispatch, resetDelegation } = useStore();
  const s = runs[run];
  const delegate = (action: Action) => dispatch(run, action);
  const words = wordsOf(s.brief);
  const a = account(s);
  const needs = useRef<HTMLHeadingElement>(null);
  const lead = useRef<HTMLParagraphElement>(null);
  const top = useRef<HTMLHeadingElement>(null);
  const bounds = useRef<HTMLElement>(null);
  const records = useRef<Record<string, HTMLElement | null>>({});
  const focusNext = useRef(false);

  /* Which decision the workspace shows, and what is selected in each. The
     decision is kept by id, so an answer elsewhere doesn't move it, and by
     position, so that once it is answered the workspace shows the one that
     took its place. A selection is kept per decision, so the preview and
     the inspector read the same one, and going to another decision and
     back finds it as it was left. */
  const [at, setAt] = useState<{ id?: string; index: number }>({ index: 0 });
  const [chosen, setChosen] = useState<Record<string, string | undefined>>({});
  const [views, setViews] = useState<Record<string, PreviewView>>({});

  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    (needs.current ?? lead.current)?.focus();
  });

  /* Whether an answer can become a rule, and the rule as it would read. Only
     an answer that carries a draft can (data/delegation.ts, RuleDraft): an
     answer about what a value means, or keeping a fix on the screen asked
     about. Allowing a change past a boundary never can, and says why. */
  const preview = useCallback(
    (w: Work) =>
      (optionId: string): RulePreview => {
        const pattern = w.question?.pattern;
        const draft = w.question?.options.find((o) => o.id === optionId)?.rule;
        if (!pattern || !draft) return { offer: 'none', settles: [] };
        const current = activeRule(s);
        if (current && current.answer !== optionId) return { offer: 'conflict', settles: [], existing: ruleText(current) };
        const covers: Pattern[] = current ? Array.from(new Set([...current.covers, pattern])) : [pattern];
        const rule = { answer: optionId, covers, text: draft.text };
        const settles = wouldSettle(s, rule, w.id).filter((x) => x.id !== w.id);
        return { offer: current ? 'widen' : 'make', text: ruleText(rule), excludes: draft.excludes, scope: draft.scope, fixed: Boolean(draft.text), settles };
      },
    [s],
  );

  const done = [...a.made, ...a.reverted, ...a.left].sort((x, y) => latest(y).localeCompare(latest(x)));
  const notable = done.filter((w) => !routine(w));
  const easy = done.filter(routine);
  const asking = a.asking;
  const found = asking.findIndex((w) => w.id === at.id);
  const index = found >= 0 ? found : Math.min(at.index, Math.max(asking.length - 1, 0));
  const current = asking[index];
  const go = (i: number) => setAt({ id: asking[i]?.id, index: i });
  const choice = current ? chosen[current.id] : undefined;
  /* What the preview can show of a selection: a direction or an answer, but
     not more evidence, which decides nothing and changes nothing. */
  const previewing = current?.question?.options.find((o) => o.id === choice && !o.asks);
  const view: PreviewView = current && previewing ? (views[current.id] ?? 'proposed') : 'current';

  const stage = useRef<HTMLDivElement>(null);
  const inspector = useRef<HTMLDivElement>(null);
  useFollow(stage, inspector, current?.id ?? '');

  const answer = (w: Work, option: string, makeRule: boolean, reason?: string) => {
    focusNext.current = true;
    setAt({ index });
    delegate({ type: 'answer', id: w.id, option, makeRule, reason });
  };

  const record = (w: Work) => (
    <WorkRecord
      work={w}
      boundaries={s.boundaries}
      line={words.line}
      rule={w.basis?.kind === 'rule' ? s.rules.find((r) => w.basis?.kind === 'rule' && r.id === w.basis.ruleId) : undefined}
      onRevert={() => delegate({ type: 'revert', id: w.id })}
      onRestore={() => delegate({ type: 'restore', id: w.id })}
    />
  );

  return (
    <div className="delegation">
      {/* The run's own bar, in the chrome under the app's: which sample run
          this is, that it is one, and the way back to its start. */}
      <div className="delegation__runbar">
        <div className="delegation__runbar-inner">
          <nav className="delegation__runs" aria-label="Sample runs">
            {RUNS.map((r) => (
              <a key={r.id} className="delegation__run" href={href({ name: 'delegation', run: r.id })} aria-current={r.id === run ? 'page' : undefined}>
                {r.label}
                <span className="visually-hidden">, {r.kind}</span>
              </a>
            ))}
          </nav>
          <div className="delegation__sim" role="note" aria-label="About this screen">
            <Badge variant="quiet" icon="play" className="delegation__sim-label">
              Simulated
            </Badge>
            <p>A sample run, played back the same way every time. No model runs, and no real repository is touched.</p>
          </div>
          <Button
            size="compact"
            variant="secondary"
            leadingIcon="undo"
            onClick={() => {
              resetDelegation(run);
              setAt({ index: 0 });
              setChosen({});
              setViews({});
              top.current?.focus();
            }}
          >
            Reset the demo
          </Button>
        </div>
      </div>

      <div className="delegation__body">
        <header className="delegation__header">
          <div className="delegation__heading">
            <p className="delegation__by">
              <Icon name="bot" size={16} />
              <span>
                Delegated to {s.brief.agent.name} by {s.brief.by.name} <span aria-hidden="true">·</span> {relativeTime(s.brief.delegatedAt)}
              </span>
            </p>
            <h1 ref={top} className="delegation__title" tabIndex={-1}>
              {s.brief.title}
            </h1>
            <Disclosure className="delegation__request" summary={`${s.brief.by.name.split(' ')[0]}’s request`}>
              <p>
                {s.brief.request} <span className="delegation__request-meta">Last active {s.brief.lastActive}, in <code>{s.brief.repo}</code>.</span>
              </p>
            </Disclosure>
          </div>

          <OutcomeSummary ref={lead} state={s} />
        </header>

        <div className="delegation__notice" data-kind={s.noticeKind} aria-live="polite">
          {s.notice ? (
            <>
              <Icon name={s.noticeKind === 'back' ? 'undo' : s.noticeKind === 'open' ? 'status-inconclusive' : 'status-passed'} size={16} />
              <p>
                <Inline text={s.notice} />
              </p>
              {s.noticeDecision && s.decisions.some((d) => d.id === s.noticeDecision) ? (
                <Button
                  size="compact"
                  variant="secondary"
                  onClick={() => {
                    const el = records.current[s.noticeDecision!];
                    el?.scrollIntoView({ block: 'nearest' });
                    el?.focus();
                  }}
                >
                  See the decision record
                </Button>
              ) : s.noticeRule && s.rules.some((r) => r.id === s.noticeRule && r.status === 'active') ? (
                <Button
                  size="compact"
                  variant="secondary"
                  onClick={() => {
                    bounds.current?.scrollIntoView({ block: 'nearest' });
                    bounds.current?.focus();
                  }}
                >
                  See your rule
                </Button>
              ) : null}
            </>
          ) : null}
        </div>

        {current ? (
          <section className="studio" aria-labelledby="needs-title">
            <div ref={stage} className="studio__stage">
              <DecisionPreview
                work={current}
                option={previewing}
                view={view}
                onViewChange={(v) => setViews((m) => ({ ...m, [current.id]: v }))}
                position={index + 1}
              />
              <DecisionRead work={current} waiting={waitingOn(s, current.id)} onAnswer={(option, makeRule) => answer(current, option, makeRule)} />
            </div>

            <div ref={inspector} className="studio__inspector">
              <div className="studio__head">
                <h2 ref={needs} id="needs-title" className="delegation__h2" tabIndex={-1}>
                  Needs you <span className="delegation__count">{asking.length}</span>
                </h2>
                <div className="studio__pager">
                  <p className="studio__position" aria-live="polite">
                    Decision {index + 1} of {asking.length}
                  </p>
                  {asking.length > 1 ? (
                    <>
                      <IconButton icon="chevron-left" label="Previous decision" disabled={index === 0} onClick={() => go(index - 1)} />
                      <IconButton icon="chevron-right" label="Next decision" tooltip="end" disabled={index === asking.length - 1} onClick={() => go(index + 1)} />
                    </>
                  ) : null}
                </div>
              </div>
              <DecisionRequest
                key={current.id}
                work={current}
                why={current.waitsOn ? whyAsking(s, current) : undefined}
                boundaries={s.boundaries.filter((b) => current.question!.paused.includes(b.n))}
                waiting={waitingOn(s, current.id)}
                preview={preview(current)}
                choice={choice}
                onChoiceChange={(next) => {
                  setChosen((m) => ({ ...m, [current.id]: next }));
                  setViews((m) => ({ ...m, [current.id]: 'proposed' }));
                }}
                onAnswer={(option, makeRule, reason) => answer(current, option, makeRule, reason)}
              />
            </div>
          </section>
        ) : null}

        <div className="delegation__layout">
          <div className="delegation__main">
            {s.decisions.length ? (
              <section className="delegation__section" aria-labelledby="decided-title">
                <h2 id="decided-title" className="delegation__h2">
                  Your decisions <span className="delegation__count">{s.decisions.length}</span>
                </h2>
                <p className="delegation__hint">What you decided, why, and what it left to do. A later change follows one only through a rule you made from it.</p>
                <ul className="delegation__decisions">
                  {[...s.decisions].reverse().map((d) => (
                    <li key={d.id}>
                      <DecisionRecord
                        ref={(el) => {
                          records.current[d.id] = el;
                        }}
                        decision={d}
                        work={s.work.find((w) => w.id === d.from)}
                        rule={d.rule ? s.rules.find((r) => r.id === d.rule) : undefined}
                        all={s.work}
                        onSeeRule={() => {
                          bounds.current?.scrollIntoView({ block: 'nearest' });
                          bounds.current?.focus();
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <OutcomeFacts state={s} />

            <section className="delegation__section delegation__done" aria-labelledby="done-title">
              <h2 id="done-title" className="delegation__h2">
                Completed work <span className="delegation__count">{done.length}</span>
              </h2>
              <p className="delegation__hint">Done on its own unless marked. Open one for what changed, why, and what the checks established.</p>
              <ul className="delegation__records">
                {notable.map((w) => (
                  <li key={w.id}>{record(w)}</li>
                ))}
                {easy.length ? (
                  <li>
                    <Disclosure
                      className="delegation__routine"
                      summary={<RecordHead state="passed" label="Every check passed" title={plural(easy.length, ...words.routine)} where="Every check passed, on the first try" />}
                    >
                      <ul>
                        {easy.map((w) => (
                          <li key={w.id}>{record(w)}</li>
                        ))}
                      </ul>
                    </Disclosure>
                  </li>
                ) : null}
              </ul>
            </section>
          </div>

          <aside className="delegation__aside" aria-label="Boundaries and your rules">
            <Boundaries
              ref={bounds}
              boundaries={s.boundaries}
              by={s.brief.by}
              rules={s.rules}
              work={s.work}
              onEditRule={(id, covers) => delegate({ type: 'edit-rule', id, covers })}
              onRevokeRule={(id) => delegate({ type: 'revoke-rule', id })}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

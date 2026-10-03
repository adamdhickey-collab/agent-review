import { useCallback, useEffect, useRef } from 'react';
import { Badge, Button, Icon } from '../../components';
import { useStore } from '../../app/store';
import { account, activeRule, ruleText, waitingOn, whyAsking, wouldSettle, type Pattern, type Work } from '../../data/delegation';
import { relativeTime } from '../format';
import { OutcomeSummary } from '../OutcomeSummary/OutcomeSummary';
import { DecisionRequest, type RulePreview } from '../DecisionRequest/DecisionRequest';
import { WorkRecord } from '../WorkRecord/WorkRecord';
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
   is said in a visible line that is also a live region. */

function latest(w: Work): string {
  return w.history[w.history.length - 1]?.at ?? '';
}

export function DelegationScreen() {
  const { delegation: s, delegate, resetDelegation } = useStore();
  const a = account(s);
  const needs = useRef<HTMLHeadingElement>(null);
  const lead = useRef<HTMLParagraphElement>(null);
  const top = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef(false);

  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    (needs.current ?? lead.current)?.focus();
  });

  const preview = useCallback(
    (w: Work) =>
      (optionId: string): RulePreview => {
        const pattern = w.question?.pattern;
        if (!pattern || w.question?.kind !== 'intent') return { offer: 'none', settles: [] };
        const current = activeRule(s);
        if (current && current.answer !== optionId) return { offer: 'conflict', settles: [], existing: ruleText(current) };
        const covers: Pattern[] = current ? Array.from(new Set([...current.covers, pattern])) : [pattern];
        const draft = { answer: optionId, covers };
        const settles = wouldSettle(s, draft, w.id).filter((x) => x.id !== w.id);
        return { offer: current ? 'widen' : 'make', text: ruleText(draft), settles };
      },
    [s],
  );

  const done = [...a.made, ...a.reverted, ...a.left].sort((x, y) => latest(y).localeCompare(latest(x)));
  const asking = a.asking;

  return (
    <div className="delegation">
      <div className="delegation__sim" role="note" aria-label="About this screen">
        <Badge tone="neutral" icon="info">
          Simulated
        </Badge>
        <p>A sample run, played back the same way every time. No model is running, and nothing here touches a real repository.</p>
        <Button
          size="compact"
          variant="ghost"
          leadingIcon="undo"
          onClick={() => {
            resetDelegation();
            top.current?.focus();
          }}
        >
          Reset the demo
        </Button>
      </div>

      <div className="delegation__layout">
        <div className="delegation__main">
          <header className="delegation__header">
            <p className="delegation__by">
              <Icon name="bot" size={14} />
              <span>
                Delegated to {s.brief.agent.name} by {s.brief.by.name} <span aria-hidden="true">·</span> {relativeTime(s.brief.delegatedAt)}{' '}
                <span aria-hidden="true">·</span> last active {s.brief.lastActive} <span aria-hidden="true">·</span> <code>{s.brief.repo}</code>
              </span>
            </p>
            <h1 ref={top} className="delegation__title" tabIndex={-1}>
              {s.brief.title}
            </h1>
            <p className="delegation__request">
              <span className="delegation__request-label">The request</span> {s.brief.request}
            </p>
          </header>

          <OutcomeSummary ref={lead} state={s} />

          <p className="delegation__notice" aria-live="polite">
            {s.notice ? <Inline text={s.notice} /> : null}
          </p>

          {asking.length ? (
            <section className="delegation__section" aria-labelledby="needs-title">
              <h2 ref={needs} id="needs-title" className="delegation__h2" tabIndex={-1}>
                Needs you <span className="delegation__count">{asking.length}</span>
              </h2>
              {asking.map((w) => (
                <DecisionRequest
                  key={w.id}
                  work={w}
                  why={w.waitsOn ? whyAsking(s, w) : undefined}
                  boundaries={s.boundaries.filter((b) => w.question!.paused.includes(b.n))}
                  waiting={waitingOn(s, w.id)}
                  preview={preview(w)}
                  onAnswer={(option, makeRule) => {
                    focusNext.current = true;
                    delegate({ type: 'answer', id: w.id, option, makeRule });
                  }}
                />
              ))}
            </section>
          ) : null}

          <section className="delegation__section" aria-labelledby="done-title">
            <h2 id="done-title" className="delegation__h2">
              Completed work <span className="delegation__count">{done.length}</span>
            </h2>
            <p className="delegation__hint">Each was merged under a boundary or a decision of yours. Open one to see what changed, why, and what the checks did and didn’t establish.</p>
            <ul className="delegation__records">
              {done.map((w) => (
                <li key={w.id}>
                  <WorkRecord
                    work={w}
                    boundaries={s.boundaries}
                    rule={w.basis?.kind === 'rule' ? s.rules.find((r) => w.basis?.kind === 'rule' && r.id === w.basis.ruleId) : undefined}
                    onRevert={() => delegate({ type: 'revert', id: w.id })}
                    onRestore={() => delegate({ type: 'restore', id: w.id })}
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="delegation__aside" aria-label="Boundaries and your rules">
          <Boundaries
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
  );
}

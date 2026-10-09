import { forwardRef, useId } from 'react';
import { Badge, Button, Icon } from '../../components';
import { ruleText, type Decision, type Rule, type Work } from '../../data/delegation';
import { plural } from '../format';
import { Inline } from '../Inline';
import './DecisionRecord.css';

/* What a decision left behind, where the card that asked for it was
   (2026-10-09). A person who decides a trade-off is not done when they
   press Apply: the decision has a reason, a cost they accepted, a risk
   that remains, and work it leaves to do, and the next person, or the
   next agent run, needs all of it to know whether the decision still
   holds. So the record says, in order: what was decided and when; what
   the agent did about it, as a checklist of the plan the person read
   before Apply; and the six things a reader asks of a decision they were
   not there for. The reason is marked as the person's words or the
   agent's draft kept as written, because those are not the same evidence.

   The guidance line is honest about reuse. A decision is a record and
   nothing reads it on its own: it is consulted only through a rule the
   person chose to make from it, and the record says whether they did,
   what that rule has settled since, and points at it. Without a rule it
   says the next matching case will ask again.

   It is a record, not an act, so it is not raised (the decision cards are
   the screen's only raised surfaces): a hairline on the surface, like the
   completed work below it. */

export interface DecisionRecordProps {
  decision: Decision;
  /** The change it was made on, for where. */
  work?: Work;
  /** The rule it made, if the person kept it for similar cases. */
  rule?: Rule;
  /** Every change, to name the ones the rule settled. */
  all: Work[];
  onSeeRule?: () => void;
}

const and = (parts: string[]) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`);

export const DecisionRecord = forwardRef<HTMLElement, DecisionRecordProps>(function DecisionRecord({ decision: d, work, rule, all, onSeeRule }, ref) {
  const id = useId();
  const used = (rule?.applied ?? []).map((wid) => all.find((w) => w.id === wid)).filter(Boolean) as Work[];
  return (
    <article ref={ref} className="decided" id={d.id} aria-labelledby={`${id}-title`} tabIndex={-1}>
      <header className="decided__head">
        <Badge icon="user">Decided by you</Badge>
        <span className="decided__when">
          {d.at}
          {work ? (
            <>
              {' '}
              <span aria-hidden="true">·</span> {work.screen}
            </>
          ) : null}
        </span>
      </header>
      <h3 className="decided__title" id={`${id}-title`}>
        {d.direction}
      </h3>
      <p className="decided__question">{d.question}</p>

      <div className="decided__part">
        <p className="decided__label" id={`${id}-did`}>
          What the agent did
        </p>
        <ul className="decided__did" aria-labelledby={`${id}-did`}>
          {d.did.map((step) => (
            <li key={step}>
              <Icon name="status-passed" size={16} />
              <span>
                <Inline text={step} />
              </span>
            </li>
          ))}
          {used.length ? (
            <li>
              <Icon name="status-passed" size={16} />
              <span>
                Applied it to the {plural(used.length, 'change')} your rule covers, on the {and(Array.from(new Set(used.map((w) => w.screen.toLowerCase()))))}.
              </span>
            </li>
          ) : null}
        </ul>
      </div>

      <dl className="decided__facts">
        <div>
          <dt>Your reason</dt>
          <dd>
            {d.reason ? <span className="decided__reason">{d.reason}</span> : <span>None given.</span>}{' '}
            <span className="decided__by">{d.reasonBy === 'draft' ? 'The agent’s draft, kept as written' : 'In your words'}</span>
          </dd>
        </div>
        <div>
          <dt>Accepted trade-off</dt>
          <dd>{d.tradeoff}</dd>
        </div>
        <div>
          <dt>Remaining risk</dt>
          <dd>{d.risk}</dd>
        </div>
        <div>
          <dt>Follow-up</dt>
          <dd className="decided__follow">
            <Icon name="flag" size={16} />
            <span>{d.followUp}</span>
            <Badge tone="warning" className="decided__open">
              Open
            </Badge>
          </dd>
        </div>
        <div>
          <dt>Reusable guidance</dt>
          <dd>
            {rule ? (
              <>
                <p className="decided__rule">
                  <Inline text={ruleText(rule)} />
                </p>
                <p className="decided__used">
                  {rule.status === 'active'
                    ? used.length
                      ? `Kept as your rule. ${plural(used.length, 'later change')} followed it, and each record names this decision.`
                      : 'Kept as your rule. Nothing has matched it yet; the next case that does follows it.'
                    : 'Kept as your rule, since revoked. A matching case asks you again.'}
                </p>
                {onSeeRule ? (
                  <Button size="compact" variant="secondary" onClick={onSeeRule}>
                    See the rule
                  </Button>
                ) : null}
              </>
            ) : (
              <p className="decided__used">Not kept for similar cases. This decision applies to this change only, so the next matching case asks you again.</p>
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
});

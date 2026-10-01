import { Badge, Icon } from '../../components';
import type { Rationale } from '../../data/types';
import './AgentRationale.css';

/* What the agent said it was asked, what it says it did, and what it
   reported changing. In the agent's words, quoted, and set apart from
   the review's own voice: a reviewer should never mistake the agent's
   account for the system's finding. The reported list is what the
   findings are checked against, which is why it is here. */

export function AgentRationale({ rationale, agentName }: { rationale: Rationale; agentName: string }) {
  const r = rationale;
  return (
    <div className="rationale">
      <section className="rationale__block" aria-labelledby="rationale-request">
        <h3 id="rationale-request" className="rationale__label">
          <Icon name="user" size={12} />
          The request
        </h3>
        <blockquote className="rationale__quote">{r.request}</blockquote>
      </section>
      <section className="rationale__block" aria-labelledby="rationale-summary">
        <h3 id="rationale-summary" className="rationale__label">
          <Icon name="bot" size={12} />
          {agentName} says
        </h3>
        <blockquote className="rationale__quote rationale__quote--agent">
          <p>{r.summary}</p>
          {r.decisions.length ? (
            <ul className="rationale__decisions">
              {r.decisions.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          ) : null}
        </blockquote>
      </section>
      <section className="rationale__block" aria-labelledby="rationale-reported">
        <h3 id="rationale-reported" className="rationale__label">
          <Icon name="layers" size={12} />
          As reported by the agent
        </h3>
        <dl className="rationale__reported">
          <div>
            <dt>Reused</dt>
            <dd>{r.reported.reused.length ? r.reported.reused.map((x) => <Badge key={x}>{x}</Badge>) : <span className="rationale__none">none listed</span>}</dd>
          </div>
          <div>
            <dt>Changed, shared</dt>
            <dd>
              {r.reported.changed.length ? (
                r.reported.changed.map((x) => (
                  <Badge key={x} tone="warning">
                    {x}
                  </Badge>
                ))
              ) : (
                <span className="rationale__none">none</span>
              )}
            </dd>
          </div>
          <div>
            <dt>New states</dt>
            <dd>{r.reported.newStates.length ? r.reported.newStates.map((x) => <Badge key={x}>{x}</Badge>) : <span className="rationale__none">none</span>}</dd>
          </div>
          <div>
            <dt>New patterns</dt>
            <dd>{r.reported.newPatterns}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

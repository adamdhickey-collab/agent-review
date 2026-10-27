import { useState, type ReactNode } from 'react';
import { Badge, Button, Icon } from '../../components';
import { href } from '../../app/router';
import { useStore } from '../../app/store';
import { decided, firstOpen, STAGES, stageIndex, stageOf, type StageId } from '../../data/cycle';
import { Define, Delegate, Discover, Evaluate, Explore, Learn, Needs } from './stages';
import './CycleScreen.css';

/* THE DESIGN CYCLE (2026-10-25). One feature, archiving customers in Relay,
   followed through six stages, each its own address under "/cycle". The
   question the screen exists to answer is the one the delegated runs left
   open: if an agent can build the interface, what does the designer spend
   the day doing? So every stage says, before its content, what Adam does in
   it and what the agent does, and asks for one choice that a later stage
   reads (data/cycle.ts has the chain).

   The layout is the desk's idea at the size of a stage: the work itself
   large (the evidence, the brief, a working interface, the findings, the
   build, the outcome) and the person's move beside it, in a raised panel.
   The rail across the top is the stages, each marked done once its choice
   is made. Since 2026-10-26 the order is enforced, because it was not
   being followed: Next walked a reader through four stages without a
   choice, each saying what it would show once one was made, and then
   Delegate sent them back to Evaluate. Now a stage opens once every stage
   before it is decided. The rail links only those; Next waits for the
   stage's move and says so; and an address further on than the reader has
   come shows the stage's question and sends them to the first open one.

   The cycle is the front door (since 2026-10-26), so Discover carries the
   scenario's setup in one line, under its question, where the start screen
   used to spend a page on it.

   Simulated, said once, in the head, beside the scenario's name, rather
   than on every card. */

export function CycleScreen({ stage }: { stage: StageId }) {
  const { cycle, cycleDo } = useStore();
  const at = stageIndex(stage);
  const s = stageOf(stage);
  const prev = STAGES[at - 1];
  const next = STAGES[at + 1];
  const open = firstOpen(cycle);
  const locked = at > open;
  const done = decided(cycle, stage);
  const [resetting, setResetting] = useState(false);

  const body: Record<StageId, ReactNode> = {
    discover: <Discover />,
    define: <Define />,
    explore: <Explore />,
    evaluate: <Evaluate />,
    delegate: <Delegate />,
    learn: <Learn />,
  };

  return (
    <div className="cycle">
      <header className="cycle__head">
        <div className="cycle__scenario">
          <Badge variant="quiet" icon="play">
            Simulated
          </Badge>
          <span>
            A product design cycle · <strong>Archiving customers without losing control</strong>
          </span>
          {resetting ? (
            <span className="cycle__reset" role="group" aria-label="Start over">
              <span>Clear every choice?</span>
              <Button size="compact" variant="ghost" onClick={() => setResetting(false)}>
                Keep them
              </Button>
              <Button
                size="compact"
                variant="danger"
                autoFocus
                onClick={() => {
                  cycleDo({ type: 'reset' });
                  setResetting(false);
                  location.hash = href({ name: 'cycle', stage: 'discover' });
                }}
              >
                Start over
              </Button>
            </span>
          ) : (
            <Button className="cycle__reset-open" size="compact" variant="ghost" leadingIcon="undo" onClick={() => setResetting(true)}>
              Start over
            </Button>
          )}
        </div>
        <nav className="cycle__rail" aria-label="Stages">
          <ol role="list">
            {STAGES.map((st, i) => {
              const made = decided(cycle, st.id);
              const inner = (
                <>
                  <span className="cycle__rail-num" aria-hidden="true">
                    {made ? <Icon name="check" size={12} /> : i + 1}
                  </span>
                  <span className="cycle__rail-name">{st.name}</span>
                  {made ? <span className="visually-hidden">, decided</span> : null}
                </>
              );
              return (
                <li key={st.id}>
                  {i > open ? (
                    <span className="cycle__rail-locked" aria-disabled="true">
                      {inner}
                      <span className="visually-hidden">, opens after {STAGES[open].name}</span>
                    </span>
                  ) : (
                    <a href={href({ name: 'cycle', stage: st.id })} aria-current={st.id === stage ? 'step' : undefined} data-done={made || undefined}>
                      {inner}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      <div className="cycle__intro">
        <p className="cycle__step">
          Stage {at + 1} of {STAGES.length} · {s.name}
        </p>
        <h1 className="cycle__title" tabIndex={-1}>
          {s.question}
        </h1>
        {stage === 'discover' ? (
          <p className="cycle__setup">
            You’re Adam, a product designer, taking one feature in Relay from a support ticket to what ships. An agent does the building. You make one call in each of
            six stages, about three minutes in all.
          </p>
        ) : null}
        <dl className="cycle__roles">
          <div className="cycle__role cycle__role--designer">
            <dt>
              <Icon name="user" size={14} />
              Adam, the designer
            </dt>
            <dd>{s.designer}</dd>
          </div>
          <div className="cycle__role cycle__role--agent">
            <dt>
              <Icon name="bot" size={14} />
              The agent
            </dt>
            <dd>{s.agent}</dd>
          </div>
        </dl>
      </div>

      {locked ? <Needs stage={STAGES[open].id} what={`Start with ${STAGES[open].name}`} description="Each stage opens once you’ve made the call in the one before it." /> : body[stage]}

      <nav className="cycle__pager" aria-label="Stage">
        {prev && at - 1 <= open ? (
          <a className="cycle__pager-link" href={href({ name: 'cycle', stage: prev.id })}>
            <Icon name="arrow-left" size={14} />
            <span>
              <span className="cycle__pager-dir">Back</span> {prev.name}
            </span>
          </a>
        ) : (
          <span />
        )}
        {next && !locked ? (
          done ? (
            <a className="cycle__pager-link cycle__pager-link--next" href={href({ name: 'cycle', stage: next.id })}>
              <span>
                <span className="cycle__pager-dir">Next</span> {next.name}
              </span>
              <Icon name="arrow-right" size={14} />
            </a>
          ) : (
            <p className="cycle__pager-wait">
              <Icon name="lock" size={14} />
              <span>
                {next.name} opens after your move
              </span>
            </p>
          )
        ) : null}
      </nav>
    </div>
  );
}

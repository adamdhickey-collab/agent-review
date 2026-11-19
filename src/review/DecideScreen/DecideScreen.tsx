import { useState } from 'react';
import { Badge, Button, Disclosure, EmptyState, Icon, SegmentedControl, Tabs } from '../../components';
import { href } from '../../app/router';
import { useStore } from '../../app/store';
import { DIRECTIONS, directionOf, STOP_WHEN, STORY_BATCH, type DirectionId, type StopWhen } from '../../data/cycle';
import { cycleActionsFor, loadStops, NOTE, ruleFor, saveStops, SHORT_BATCHES, SHORT_ROWS, TICKET, type BatchId } from '../../data/decide';
import { customers } from '../../product/customers/customers';
import { ArchiveFlow } from '../../product/customers/ArchiveFlow';
import { Choice, Consequence, Product } from '../CycleScreen/stages';
import '../CycleScreen/CycleScreen.css';
import './DecideScreen.css';

/* THE SHORT PATH (2026-11-18): the front door. One question, when should
   Archive stop and ask, in three beats, each a section of one page so the
   whole of it is in view as a reader scrolls (data/decide.ts has why).

     1  What went wrong: the ticket, and the engineering note's one line,
        which says the customer was never lost. The cycle's Discover and
        Define, as setup.
     2  Decide when to pause: the agent's plan, working, on a routine
        cleanup and on the same cleanup with Northside Trucking in it, and
        the one question. The other two fixes are under Compare all three.
     3  What the agent takes forward: the rule the answer writes, the build
        with it to try, the question nothing here can answer, and the whole
        cycle one press away, opened on the brief with the answer in it.

   It is built from the cycle's own parts (the move, a choice, Relay's
   frame) and looks like a stage on purpose: a reader who goes on into the
   cycle should not feel they have changed products. */

const ROWS = customers.filter((c) => SHORT_ROWS.includes(c.id));

function BatchSwitch({ value, onChange }: { value: BatchId; onChange: (b: BatchId) => void }) {
  return (
    <div className="decide__batch">
      <SegmentedControl
        label="Batch"
        value={value}
        onChange={onChange}
        options={(Object.keys(SHORT_BATCHES) as BatchId[]).map((b) => ({ value: b, label: SHORT_BATCHES[b].name }))}
      />
      <p className="decide__batch-says">{SHORT_BATCHES[value].says}</p>
    </div>
  );
}

/** Relay's customer table with a batch selected, as one direction builds archiving. */
function Working({ label, name, batch, onlyWhenActive, run }: { label: string; name: string; batch: BatchId; onlyWhenActive: boolean; run: string }) {
  return (
    <Product label={label}>
      <ArchiveFlow key={`${run}-${batch}`} direction="review" features={{ onlyWhenActive }} customers={ROWS} initialSelection={SHORT_BATCHES[batch].ids} name={name} />
    </Product>
  );
}

function CompareAll() {
  const [open, setOpen] = useState<DirectionId>('undo');
  const [shown, setShown] = useState(false);
  const d = directionOf(open);
  /* Drawn only while open: a closed disclosure's working table would be a
     third copy of Relay in the page, its controls still found by a search
     and a third "Customers" in a screen reader's list of regions. */
  return (
    <Disclosure className="decide__compare" summary="Compare all three fixes" meta="The agent built three. It recommends the review." onToggle={(e) => setShown(e.currentTarget.open)}>
      {shown ? (
      <Tabs variant="options" label="Fixes" tabs={DIRECTIONS.map((x, i) => ({ value: x.id, label: `${i + 1}. ${x.name}` }))} value={open} onChange={setOpen}>
        <div className="decide__fix">
          <p className="cycle__direction-does">{d.does}</p>
          <dl className="cycle__tradeoff">
            <div className="cycle__tradeoff-item cycle__tradeoff-item--gains">
              <dt>
                <Icon name="plus" size={14} />
                Gains
              </dt>
              <dd>{d.gains}</dd>
            </div>
            <div className="cycle__tradeoff-item cycle__tradeoff-item--costs">
              <dt>
                <Icon name="minus" size={14} />
                Costs
              </dt>
              <dd>{d.costs}</dd>
            </div>
          </dl>
          <Product label={`Relay · customers · fix ${DIRECTIONS.indexOf(d) + 1}, working`}>
            <ArchiveFlow key={d.id} direction={d.id} customers={ROWS} initialSelection={STORY_BATCH} name={`fix ${DIRECTIONS.indexOf(d) + 1}`} />
          </Product>
        </div>
      </Tabs>
      ) : null}
    </Disclosure>
  );
}

export function DecideScreen({ initial }: { initial?: StopWhen | null }) {
  const { cycleDo } = useStore();
  const [stops, setStopsState] = useState<StopWhen | null>(() => (initial !== undefined ? initial : loadStops()));
  const [planBatch, setPlanBatch] = useState<BatchId>('routine');
  const [builtBatch, setBuiltBatch] = useState<BatchId>('routine');
  const [run, setRun] = useState(0);

  function decide(when: StopWhen) {
    setStopsState(when);
    saveStops(when);
    setRun((r) => r + 1);
  }

  function startOver() {
    setStopsState(null);
    saveStops(null);
    setPlanBatch('routine');
    setBuiltBatch('routine');
    setRun((r) => r + 1);
  }

  /* The whole cycle, with this answer in it: every earlier stage decided as
     the case study decided it, and the brief sent, so the next screen is the
     brief and the agent's one question. It clears whatever the cycle held. */
  function openCycle() {
    if (!stops) return;
    for (const action of cycleActionsFor(stops)) cycleDo(action);
    location.hash = href({ name: 'cycle', stage: 'delegate' });
  }

  return (
    <div className="cycle decide">
      <header className="decide__head">
        <Badge variant="quiet" icon="play">
          Simulated
        </Badge>
        <span>
          Agent Review · <strong>Archiving customers without losing control</strong>
        </span>
        <span className="decide__head-links">
          {stops ? (
            <Button size="compact" variant="ghost" leadingIcon="undo" onClick={startOver}>
              Start over
            </Button>
          ) : null}
          <a className="decide__whole" href={href({ name: 'cycle', stage: 'discover' })}>
            The whole cycle, six stages
            <Icon name="arrow-right" size={14} />
          </a>
        </span>
      </header>

      <div className="cycle__intro">
        <p className="cycle__step">One decision · about 2 minutes</p>
        <h1 className="cycle__title" tabIndex={-1}>
          When should Archive stop and ask?
        </h1>
        <p className="cycle__setup">
          An agent built bulk archiving for Relay, a customer tool. Its plan reviews every batch before anything is archived. Try a routine cleanup, then add one active customer, and decide when Relay should pause. It’s a simulation: the ticket and the research are written for it, and the archive screen is a working interface.
        </p>
      </div>

      <section className="decide__beat" aria-labelledby="decide-wrong">
        <p className="decide__num">1 of 3</p>
        <h2 id="decide-wrong" className="decide__h2">
          What went wrong
        </h2>
        <div className="decide__wrong">
          <figure className="decide__quote">
            <blockquote className="cycle__ev-quote">{TICKET.says}</blockquote>
            <figcaption className="cycle__ev-kind">
              Support ticket <span>· {TICKET.from}</span>
            </figcaption>
          </figure>
          <figure className="decide__note">
            <p className="cycle__ev-kind">
              <Icon name="code" size={14} />
              Engineering note <span>· {NOTE.from}</span>
            </p>
            <p>{NOTE.says}</p>
          </figure>
        </div>
        <p className="decide__lead">Northside was never lost. One press took a paying customer out with two old accounts, and nothing on the screen named it first.</p>
      </section>

      <section className="decide__beat" aria-labelledby="decide-pause">
        <p className="decide__num">2 of 3</p>
        <h2 id="decide-pause" className="decide__h2">
          Decide when to pause
        </h2>
        {/* The screen first and the move after it, the other way round from a
            stage: here a reader tries both batches before they are asked, and
            on a phone, one column, that is the order they meet them in. */}
        <div className="cycle__work">
          <div className="cycle__main">
            <p className="decide__lead">The agent’s plan, working. Pick a batch and press Archive. In the review, clear a box to keep a customer out.</p>
            <BatchSwitch value={planBatch} onChange={setPlanBatch} />
            <Working label="Relay · customers · the agent’s plan, a review on every batch" name="the agent’s plan" batch={planBatch} onlyWhenActive={false} run={`plan-${run}`} />
            <CompareAll />
          </div>
          <aside className="cycle__move" aria-labelledby="decide-move">
            <div className="cycle__move-head">
              <p className="cycle__move-kicker">
                <Icon name="user" size={14} />
                Your move
              </p>
              <h3 id="decide-move" className="cycle__move-title">
                When should Relay review a batch?
              </h3>
            </div>
            <div className="cycle__move-body">
              <p className="cycle__move-lead">The agent read the brief, which asks for safety, so it reviews every batch. It didn’t read the session notes.</p>
              <ul className="cycle__choices" role="list">
                {(Object.keys(STOP_WHEN) as StopWhen[]).map((w) => (
                  <Choice key={w} name={STOP_WHEN[w].name} says={STOP_WHEN[w].says('review')} recommended={w === 'every'} chosen={stops === w} onChoose={() => decide(w)} />
                ))}
              </ul>
              {stops === 'active' ? (
                <Consequence>A routine cleanup goes through in one press, with Undo. The review appears only when it has someone to name.</Consequence>
              ) : stops === 'every' ? (
                <Consequence>Every cleanup stops, even one with nobody to name. In the simulated sessions, people stopped reading a review they saw every time.</Consequence>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      <section className="decide__beat" aria-labelledby="decide-forward">
        <p className="decide__num">3 of 3</p>
        <h2 id="decide-forward" className="decide__h2">
          What the agent takes forward
        </h2>
        {stops ? (
          <div className="decide__forward">
            <div className="decide__rule">
              <p className="decide__rule-label">
                <Icon name="bot" size={14} />
                The rule the next agent reads before it builds a bulk action
              </p>
              <blockquote className="cycle__rule">{ruleFor(stops)}</blockquote>
            </div>
            <p className="decide__lead">Relay, built with your answer. Try both batches.</p>
            <BatchSwitch value={builtBatch} onChange={setBuiltBatch} />
            <Working label={`Relay · customers · as built, review ${stops === 'active' ? 'only when someone’s active' : 'on every batch'}`} name="as built" batch={builtBatch} onlyWhenActive={stops === 'active'} run={`built-${run}`} />
            <div className="decide__open">
              <h3 className="cycle__h3">Still open</h3>
              <p>Would people notice Northside when the review appears? Nothing here was tested with people. That’s the next study.</p>
            </div>
            <div className="decide__more">
              <Button variant="secondary" trailingIcon="arrow-right" onClick={openCycle}>
                See the brief and the agent’s question
              </Button>
              <span className="decide__more-says">The whole cycle, opened on the brief with your answer in it. It replaces any choices you made there.</span>
            </div>
          </div>
        ) : (
          <EmptyState icon="info" title="Your rule appears here" description="Choose when Relay should review a batch, above, and the agent writes it down." />
        )}
      </section>
    </div>
  );
}

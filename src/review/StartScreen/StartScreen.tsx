import { Badge, Button } from '../../components';
import { href } from '../../app/router';
import { initialDelegation } from '../../data/billing';
import { account } from '../../data/delegation';
import { STAGES } from '../../data/cycle';
import './StartScreen.css';

/* THE FRONT DOOR, SINCE 2026-10-23. Most people who open this arrive from a
   link, have never supervised an agent, and give it a minute. Without a
   screen in front of it, the delegated work met them in the middle of a
   scenario, at full speed.

   So one screen comes before it, and asks nothing but a press. It is a
   transition, not a lesson: that this is simulated and short; the situation
   in one line, as the product's own words put it ("Needs you" is the
   decision's heading on the next screen); who the person is in it and what
   the agent did, counted from the run as it starts, so it cannot disagree
   with the account they meet next; where to begin; and one way in.

   Until 2026-10-24 it also listed the steps and drew a map of the next
   screen. The desk walks a person through the steps itself now, one page at
   a time, so neither was earning its place: the screen says where to start
   and lets the next one do the rest.

   Since 2026-10-25 the way in is the design cycle (data/cycle.ts): the
   question the screen asks is what the designer does all day, and the six
   stages are listed with what Alex does in each, because that list is the
   answer in outline. The two runs are links under the button, for whoever
   came for one moment where an agent stops.

   The billing run was the one the way in opened. The shared table's
   own link goes straight to its run, and so does every address under
   "/runs/": a person who has a link to a run has chosen it. */

const run = initialDelegation();
const { own, asking } = account(run);

export function StartScreen() {
  return (
    <div className="start">
      <p className="start__kicker">
        <Badge variant="quiet" icon="play">
          Simulated
        </Badge>
        <span>About three minutes</span>
      </p>
      <h1 className="start__title" tabIndex={-1}>
        If an agent can build the interface, what does the designer do all day?
      </h1>
      <p className="start__lead">
        You’re {run.brief.by.name}, a product designer. Follow one feature on Relay’s customer table, archiving customers, from a support ticket to what ships and what to
        measure. An agent does the building. You decide what’s worth building, and whether it works.
      </p>
      <ol className="start__stages" role="list">
        {STAGES.map((s, i) => (
          <li key={s.id}>
            <span className="start__num" aria-hidden="true">
              {i + 1}
            </span>
            <span>
              <strong>{s.name}.</strong> {s.designer}
            </span>
          </li>
        ))}
      </ol>
      <div className="start__go">
        <Button variant="primary" trailingIcon="arrow-right" onClick={() => (location.hash = href({ name: 'cycle', stage: 'discover' }))}>
          Explore a product design cycle
        </Button>
      </div>
      <div className="start__or">
        <p>Or go straight to a moment the agent stops:</p>
        <ul role="list">
          <li>
            <a href={href({ name: 'delegation' })}>A cancel link the checks can’t judge</a>
            <span>
              {own.length} changes made, {asking.length} left for you
            </span>
          </li>
          <li>
            <a href={href({ name: 'delegation', run: 'shared-table' })}>A fix in a table 40 screens share</a>
          </li>
        </ul>
      </div>
    </div>
  );
}

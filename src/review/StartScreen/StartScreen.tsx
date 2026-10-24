import { Badge, Button } from '../../components';
import { href } from '../../app/router';
import { initialDelegation } from '../../data/billing';
import { account } from '../../data/delegation';
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

   It is about the billing run, the one the way in opens. The shared table's
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
        <span>About a minute</span>
      </p>
      <h1 className="start__title" tabIndex={-1}>
        A coding agent did most of the work. The rest needs you.
      </h1>
      <p className="start__lead">
        You’re {run.brief.by.name}, a product designer. You asked {run.brief.agent.name} to bring the billing screens onto the design system. It made {own.length} changes
        and left {asking.length} for you.
      </p>
      <p className="start__where">Start with the first decision. The screen takes you through it one step at a time.</p>

      <div className="start__go">
        <Button variant="primary" trailingIcon="arrow-right" onClick={() => (location.hash = href({ name: 'delegation' }))}>
          Start the review
        </Button>
      </div>
    </div>
  );
}

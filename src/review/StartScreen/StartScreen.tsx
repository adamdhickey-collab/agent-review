import { Badge, Button } from '../../components';
import { href } from '../../app/router';
import { initialDelegation } from '../../data/billing';
import { account } from '../../data/delegation';
import { startSteps, type StartStep } from '../DelegationScreen/steps';
import './StartScreen.css';

/* THE FRONT DOOR, SINCE 2026-10-23. Most people who open this arrive from a
   link, have never supervised an agent, and give it a minute. The delegated
   work met them at full speed: a run bar, a job's title, an account, the
   steps, a picture of a product with marks on it and a decision with two
   directions, all on the first screen, and nothing that said which of it was
   theirs to do. Rearranging that screen (FIRST MINUTE, in
   DelegationScreen.tsx) put the question first; it could not say, before the
   person was in it, what the screen is for.

   So one screen comes before it, and asks nothing but a press. In order:
   that this is simulated and short; the situation in one line, as the
   product's own words put it ("Needs you" is the decision's heading on the
   next screen); who the person is in it and what the agent did, counted from
   the run as it starts, so it cannot disagree with the account they meet
   next; what they will do, as the same steps Start here names over the
   workspace (DelegationScreen/steps.ts), each with a line on what it means;
   and one way in. Beside it, where the workspace has two columns, a map of
   that workspace marks where each step happens, so the first look at it is
   a second one.

   The map is a drawing and says nothing the list does not, so a screen
   reader hears its caption and not its shapes. It is not drawn where the
   workspace is one column: there the steps come one under another, Start
   here takes a person to each, and the map would only push the way in down
   a phone.

   It is about the billing run, the one the way in opens. The shared table's
   own link goes straight to its run, and so does every address under
   "/runs/": a person who has a link to a run has chosen it. */

const run = initialDelegation();
const { own, asking } = account(run);
const steps = startSteps(asking[0]);

/* What each step is, in a line: what the person sees, and what pressing it
   does or does not do yet. Said of the screen, not of its layout, because a
   phone and a laptop put the parts in different places. */
const MEANS: Record<StartStep, string> = {
  look: 'The screen the agent changed, with the part in question marked.',
  choose: 'The agent lays out two directions, the main risk of each, and the one it recommends.',
  preview: 'The screen redraws the way your choice would leave it. Nothing is applied yet.',
  apply: 'The agent acts on your answer, and you see what it did.',
};

/* Where each step happens on the next screen, as the map marks it. */
function Pin({ n }: { n: number }) {
  return <span className="start__pin">{n}</span>;
}

function WorkspaceMap() {
  const at = (to: StartStep) => steps.findIndex((s) => s.to === to) + 1;
  return (
    <figure className="start__map">
      <div className="start__map-screen" aria-hidden="true">
        <div className="start__map-bar">
          <span className="start__map-label">Start here</span>
          {steps.map((s, i) => (
            <span key={s.to} className="start__map-step">
              {i + 1}
            </span>
          ))}
        </div>
        <div className="start__map-stage">
          <span className="start__map-head">
            <span className="start__map-label">The screen it changed</span>
            <span className="start__map-toggle">
              <span>Current</span>
              <span data-on>Proposed</span>
              <Pin n={at('preview')} />
            </span>
          </span>
          <div className="start__map-product">
            <span className="start__map-row">
              <span className="start__map-line" />
              <span className="start__map-control" />
            </span>
            <span className="start__map-row">
              <span className="start__map-line" />
              <span className="start__map-control" />
            </span>
            <span className="start__map-row">
              <span className="start__map-line" />
              <span className="start__map-control is-marked">
                <Pin n={at('look')} />
              </span>
            </span>
          </div>
        </div>
        <div className="start__map-inspector">
          <span className="start__map-label">Needs you</span>
          <span className="start__map-line start__map-line--title" />
          <span className="start__map-option">
            <span className="start__map-line" />
            <span className="start__map-line start__map-line--short" />
            <Pin n={at('choose')} />
          </span>
          <span className="start__map-option">
            <span className="start__map-line" />
            <span className="start__map-line start__map-line--short" />
          </span>
          <span className="start__map-apply">
            Apply
            <Pin n={at('apply')} />
          </span>
        </div>
      </div>
      <figcaption className="start__map-caption">The next screen, and where each step happens on it.</figcaption>
    </figure>
  );
}

export function StartScreen() {
  return (
    <div className="start">
      <div className="start__copy">
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
          You asked {run.brief.agent.name} to bring the billing screens onto the design system. It made {own.length} changes and checked each one on its own, then stopped at{' '}
          {asking.length} it couldn’t settle without a person. In this demo you’re {run.brief.by.name}, the product designer who handed it the job.
        </p>

        <section className="start__section" aria-labelledby="start-do">
          <h2 id="start-do" className="start__h2">
            What you’ll do
          </h2>
          <ol className="start__steps" role="list">
            {steps.map((s, i) => (
              <li key={s.to} role="listitem">
                <span className="start__num" aria-hidden="true">
                  {i + 1}
                </span>
                <p>
                  <strong>{s.label}.</strong> {MEANS[s.to]}
                </p>
              </li>
            ))}
          </ol>
          <p className="start__hint">The same steps run across the top of the next screen. Press one and it takes you there.</p>
        </section>

        <div className="start__go">
          <Button variant="primary" trailingIcon="arrow-right" onClick={() => (location.hash = href({ name: 'delegation' }))}>
            Start the review
          </Button>
        </div>
        <p className="start__note">A sample run, played back the same way every time. No model runs, and no real repository is touched.</p>
      </div>

      <WorkspaceMap />
    </div>
  );
}

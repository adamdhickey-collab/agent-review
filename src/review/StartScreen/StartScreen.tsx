import { Badge, Button } from '../../components';
import { href } from '../../app/router';
import { initialDelegation } from '../../data/billing';
import { account } from '../../data/delegation';
import { startSteps, type StartStep } from '../DelegationScreen/steps';
import { useDeskWide } from '../DelegationScreen/deskWide';
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
   workspace (DelegationScreen/steps.ts), each with a few words on what it
   means; and one way in. Beside it, where the next screen is the desk, a
   map of the desk names its parts, so the first look at it is a second
   one.

   It is short because it promises a minute. The first version ran about 190
   words, which is most of that minute spent before the press; it is about
   half that now. The lead is three short sentences, each step says only what
   a person needs before pressing, and two lines went: one saying the steps
   run across the next screen's top, which the map shows, and one saying the
   run is a sample, which the Simulated badge says.

   The map's shapes are a drawing, so a screen reader hears its title and
   the three notes under it and not the shapes. It is drawn only where the
   next screen is the desk (deskWide.ts): under that the workspace is another
   shape, Start here takes a person to each step, and the map would only
   push the way in down the page.

   It is about the billing run, the one the way in opens. The shared table's
   own link goes straight to its run, and so does every address under
   "/runs/": a person who has a link to a run has chosen it. */

const run = initialDelegation();
const { own, asking } = account(run);
const steps = startSteps(asking[0]);

/* What each step is, in a few words: where it happens, or what pressing it
   does or does not do yet. Said of the screen, not of its layout, because a
   phone and a laptop put the parts in different places. */
const MEANS: Record<StartStep, string> = {
  look: 'They’re marked on the screen it changed.',
  choose: 'The agent recommends one and shows each one’s risk.',
  preview: 'Nothing is applied yet.',
  apply: 'The agent acts on your answer.',
};

/* The steps by their first word, as the desk's own tabs name them
   (DelegationScreen.tsx, DeskSteps), so the drawn tabs read as the list. */
const TAB: Record<StartStep, string> = { look: 'Compare', choose: 'Choose', preview: 'Preview', apply: 'Apply' };

/* THE MAP, SINCE 2026-10-24: the desk drawn small, each part named in
   words on the drawing. It used to mark where each step happens with a
   numbered pin, and a person read a number on the picture, found it in
   the list, and read back, three times over, past a row of the same
   numbers along its top. A pin asks for that look; a name does not. So
   each of the desk's three parts says what it is under it, and the
   decision panel carries the steps' own names on its tabs, the words the
   list starts with. Only the steps are numbered, once, in the list and
   on those tabs, as the desk numbers them. */
function DeskMap() {
  return (
    <figure className="start__map">
      <figcaption className="start__map-title">What you’ll see next</figcaption>
      <div className="start__map-desk">
        <div className="start__map-part">
          <div className="start__map-panel start__map-queue" aria-hidden="true">
            <span className="start__map-head">
              Needs you <span className="start__map-count">{asking.length}</span>
            </span>
            {asking.map((w) => (
              <span key={w.id} className="start__map-item">
                <span className="start__map-line" />
                <span className="start__map-line start__map-line--short" />
              </span>
            ))}
          </div>
          <p className="start__map-note">The {asking.length} decisions left for you</p>
        </div>

        <div className="start__map-part">
          <div className="start__map-panel" aria-hidden="true">
            <span className="start__map-head">The screen it changed</span>
            <span className="start__map-product">
              {[0, 1, 2].map((i) => (
                <span key={i} className="start__map-row">
                  <span className="start__map-line" />
                  <span className={i === 2 ? 'start__map-control is-marked' : 'start__map-control'} />
                </span>
              ))}
            </span>
          </div>
          <p className="start__map-note">The changes, marked where they are</p>
        </div>

        <div className="start__map-part">
          <div className="start__map-panel start__map-decision" aria-hidden="true">
            <span className="start__map-band">
              <span className="start__map-line start__map-line--title" />
              <span className="start__map-tabs">
                {steps.map((s, i) => (
                  <span key={s.to} className="start__map-tab" data-on={i === 0 || undefined}>
                    <span className="start__map-step">{i + 1}</span>
                    {TAB[s.to]}
                  </span>
                ))}
              </span>
            </span>
            <span className="start__map-option">
              <span className="start__map-line" />
              <span className="start__map-line start__map-line--short" />
            </span>
            <span className="start__map-next">Next</span>
          </div>
          <p className="start__map-note">Where you take the steps, one at a time</p>
        </div>
      </div>
    </figure>
  );
}

/* `map` draws or leaves out the map whatever the width, for a story that
   shows it at the Storybook's own size; left out, the width decides. */
export function StartScreen({ map }: { map?: boolean }) {
  const wide = useDeskWide();
  const desk = map ?? wide;
  return (
    <div className={desk ? 'start start--desk' : 'start'}>
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
          You’re {run.brief.by.name}, a product designer. You asked {run.brief.agent.name} to bring the billing screens onto the design system. It made {own.length} changes
          and left {asking.length} for you.
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
        </section>

        <div className="start__go">
          <Button variant="primary" trailingIcon="arrow-right" onClick={() => (location.hash = href({ name: 'delegation' }))}>
            Start the review
          </Button>
        </div>
      </div>

      {desk ? <DeskMap /> : null}
    </div>
  );
}

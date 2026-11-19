import { Button, Icon } from '../../components';
import { STAGES } from '../../data/cycle';
import { canNarrate } from './narrate';

/* The tour's way in, featured (2026-11-18): the first thing on Discover
   after the scenario's setup, because most people arrive from the case
   study to watch rather than to work through six stages, and a primary
   button in a row of text read as one option among the screen's controls.
   It is a panel on the accent's tint, the one raised surface in the intro,
   with the stages it plays drawn under it as the bar draws them, so the
   way in previews what it opens. The track is a picture of the tour, not a
   control: it says nothing to a screen reader and takes no press. The
   Button is the one control. */
export function TourFeature({ onStart }: { onStart: () => void }) {
  return (
    <section className="tour-feature" aria-labelledby="tour-feature-title">
      <div className="tour-feature__text">
        <p className="tour-feature__kicker">
          <Icon name="play" size={14} />
          Guided tour · 2½ minutes
        </p>
        <h2 id="tour-feature-title" className="tour-feature__title">
          Watch an agent do the work, and a designer make the decisions
        </h2>
        <p className="tour-feature__says">
          It plays all six stages for you{canNarrate ? ', read aloud' : ''}. Pause it, skip to a stage, or take over at any point.
        </p>
      </div>
      <Button className="tour-feature__go" variant="primary" leadingIcon="play" onClick={onStart}>
        Watch the tour
      </Button>
      <ol className="tour-feature__track" aria-hidden="true">
        {STAGES.map((st, i) => (
          <li key={st.id}>
            <span>
              {i + 1} {st.name}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

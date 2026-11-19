import { Button, Icon } from '../../components';
import { canNarrate } from './narrate';
import { CHAPTERS } from './script';

/* The tour's way in, featured (2026-11-18): the first thing on the short
   path after its setup, because most people arrive from the case study to
   watch before they try, and a primary button in a row of text read as one
   option among the screen's controls. It stood on the cycle's Discover
   until the tour moved to the short path the same day.
   It is a panel on the accent's tint, the one raised surface in the intro,
   with the chapters it plays drawn under it as the bar draws them, so the
   way in previews what it opens. The track is a picture of the tour, not a
   control: it says nothing to a screen reader and takes no press. The
   Button is the one control. */
export function TourFeature({ onStart }: { onStart: () => void }) {
  return (
    <section className="tour-feature" aria-labelledby="tour-feature-title">
      <div className="tour-feature__text">
        <p className="tour-feature__kicker">
          <Icon name="play" size={14} />
          Guided tour · 1½ minutes
        </p>
        <h2 id="tour-feature-title" className="tour-feature__title">
          Watch the decision play out
        </h2>
        <p className="tour-feature__says">
          It presses through all three beats for you{canNarrate ? ', read aloud' : ''}. Pause it, skip ahead, or take over at any point.
        </p>
      </div>
      <Button className="tour-feature__go" variant="primary" leadingIcon="play" onClick={onStart}>
        Watch the tour
      </Button>
      <ol className="tour-feature__track" aria-hidden="true">
        {CHAPTERS.map((name, i) => (
          <li key={name}>
            <span>
              {i + 1} {name}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

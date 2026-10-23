import type { ReactNode } from 'react';
import { Button } from '../../components';
import { CustomerTable } from '../../product/customers/CustomerTable';
import type { Line, Option, Sample, Sketch, SketchRow, Work } from '../../data/delegation';
import './Sketch.css';

/* A screen of the product as the decision preview draws it, on the
   product's surface, in the product's tokens and its components (Button,
   and for the customer list the real screen). The rows come from the
   change's sketch (data/delegation.ts, WHAT THE PREVIEW DRAWS); the element
   in question comes from the change itself: its sample, carrying the class
   names its lines are written against, so the preview can apply those
   lines to it (DecisionPreview). Nothing here styles the element: it is
   unstyled until a line says what it is, which is the point.

   The sketches are drawn, not pictured, and stay readable at any width: a
   row puts its value under its label when there is no room beside it.

   A DRAWING OF A BUTTON IS NOT A BUTTON, SINCE 2026-10-23. The settings
   screen's actions are the system's Buttons, drawn as they draw themselves,
   and until now they could be tabbed to and pressed, and did nothing: the
   most pressable things on a first visit, and none of them part of the
   review. They keep their look, which is what the decision is about, and
   lose their press (Sketch.css), their tab stop, and their say in what a
   screen reader offers, which hears them as unavailable. The customer list
   is the real screen and is meant to be used, so it keeps all three. */

/* What a drawn control carries instead of a press. */
const DRAWN = { tabIndex: -1, 'aria-disabled': true } as const;

/** The last class in a selector, which is the element a line is about: `settings__cancel-subscription` from `.settings__cancel-subscription`, `table` from `.customers .table`. */
function classOf(selector: string): string {
  const all = selector.match(/\.[\w-]+/g);
  return all ? all[all.length - 1].slice(1) : '';
}

/* The element an action-built-by-hand question is about, as it renders.
   Today it is a link built by hand, carrying the class its lines are
   written against, so the preview's declarations draw it: the grey, the
   small size. Proposed, it is what the direction makes it: a quiet Button,
   which carries the same class and so draws exactly what the link drew
   (the variant is the preview's, sketch__quiet, and never the Button's own
   until a direction that adds it is applied); or the system's Button, which
   draws itself, as every other action on the screen does. */
function HandBuilt({ sample, lines, as }: { sample: Sample; lines: Line[]; as?: 'quiet' | 'button' }) {
  const cls = classOf(lines[0]?.selector ?? '');
  if (as === 'button') {
    return (
      <Button size="compact" variant="secondary" {...DRAWN}>
        {sample.action}
      </Button>
    );
  }
  if (as === 'quiet') {
    return (
      <Button size="compact" variant="ghost" className={`sketch__quiet ${cls}`} {...DRAWN}>
        {sample.action}
      </Button>
    );
  }
  return (
    <a href="#" className={`sketch__hand ${cls}`} onClick={(e) => e.preventDefault()} {...DRAWN}>
      {sample.action}
    </a>
  );
}

function Rows({ title, subtitle, rows, focus, twin }: { title: string; subtitle?: string; rows: SketchRow[]; focus?: ReactNode; twin?: string }) {
  return (
    <section className="sketch" aria-label={title}>
      <header className="sketch__head">
        <p className="sketch__title">{title}</p>
        {subtitle ? <p className="sketch__sub">{subtitle}</p> : null}
      </header>
      <ul className="sketch__rows">
        {rows.map((r) => (
          <li key={r.label} className="sketch__row">
            <span className="sketch__what">
              <span className="sketch__label">{r.label}</span>
              {r.meta ? <span className="sketch__meta">{r.meta}</span> : null}
            </span>
            <span className="sketch__value">
              {r.value ? <span>{r.value}</span> : null}
              {r.status ? <span className="sketch__status">{r.status}</span> : null}
              {r.action || (r.focus && focus) ? (
                <span className="sketch__actions">
                  {/* The action the system's Button already draws; the one
                      the question names beside the element asked about is
                      the twin, and the preview marks it. */}
                  {r.action ? (
                    <Button size="compact" variant="secondary" data-twin={twin === r.action ? '' : undefined} {...DRAWN}>
                      {r.action}
                    </Button>
                  ) : null}
                  {r.focus && focus ? (
                    <span className="sketch__focus" data-focus="">
                      {focus}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Meter({ sketch, lines }: { sketch: Extract<Sketch, { kind: 'meter' }>; lines: Line[] }) {
  const share = Math.round((sketch.used / sketch.of) * 100);
  return (
    <section className="sketch" aria-label={sketch.title}>
      <header className="sketch__head">
        <p className="sketch__title">{sketch.title}</p>
        {sketch.subtitle ? <p className="sketch__sub">{sketch.subtitle}</p> : null}
      </header>
      <div className="sketch__meter" data-focus="">
        <p className="sketch__meter-label">
          <span>{sketch.label}</span>
          <span className="sketch__meta">
            {sketch.used} of {sketch.of} {sketch.unit}
          </span>
        </p>
        <span className={`sketch__track ${classOf(lines[0]?.selector ?? '')}`} role="img" aria-label={`${sketch.used} of ${sketch.of} ${sketch.unit} used`}>
          <span className="sketch__fill" style={{ inlineSize: `${share}%` }} />
        </span>
      </div>
    </section>
  );
}

export interface SketchScreenProps {
  work: Work;
  /** The direction being previewed, for what it draws the element as; its declarations come from its lines, applied by the preview. */
  option?: Option;
  /** What each marked element is, from the review: a caption for the element in question and one for its twin, under the screen. */
  captions?: [ReactNode, ReactNode];
}

/** The screen a change is on, with the element in question in place, and its twin marked beside it, or on its own screen beside this one. */
export function SketchScreen({ work, option, captions }: SketchScreenProps) {
  const sketch = work.sketch;
  if (!sketch) return null;
  if (sketch.kind === 'screen') {
    return (
      <div className="sketch-host">
        <div className="sketch-screen" data-screen={sketch.screen}>
          <CustomerTable />
        </div>
      </div>
    );
  }
  if (sketch.kind === 'meter') {
    return (
      <div className="sketch-host">
        <div className="sketch-screen">
          <Meter sketch={sketch} lines={work.lines} />
        </div>
      </div>
    );
  }
  const twin = work.question?.twin;
  const focus = work.sample ? <HandBuilt sample={work.sample} lines={work.lines} as={option?.draws?.as} /> : null;
  return (
    <div className="sketch-host">
      <div className="sketch-screen" data-pair={twin?.sketch ? '' : undefined} data-captions={captions && twin ? '' : undefined}>
        <Rows title={sketch.title} subtitle={sketch.subtitle} rows={sketch.rows} focus={focus} twin={twin && !twin.sketch ? twin.text : undefined} />
        {twin?.sketch?.kind === 'rows' ? <Rows title={twin.sketch.title} subtitle={twin.sketch.subtitle} rows={twin.sketch.rows} twin={twin.text} /> : null}
        {/* The captions are the review's, drawn in the grid the screens are
            drawn in (Sketch.css places them), so what each marked element is
            is read under it. The list is display: contents so its items take
            the grid's cells; the roles say what the box no longer does. */}
        {captions && twin ? (
          <ul className="sketch__captions" aria-label="What each marked element is" role="list">
            <li className="sketch__caption" data-for="decision" data-surface="review" role="listitem">
              {captions[0]}
            </li>
            <li className="sketch__caption" data-for="twin" data-surface="review" role="listitem">
              {captions[1]}
            </li>
          </ul>
        ) : null}
      </div>
    </div>
  );
}

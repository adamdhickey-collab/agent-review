import type { ReactNode } from 'react';
import { Badge, Icon } from '../../components';
import { CustomerTable } from '../../product/customers/CustomerTable';
import type { Line, Option, Sample, Sketch, SketchRow, Twin, Work } from '../../data/delegation';
import './Sketch.css';

/* A screen of the product as the decision preview draws it, on the
   product's surface, in the product's tokens and its components (Badge,
   and for the customer list the real screen). The rows come from the
   change's sketch (data/delegation.ts, WHAT THE PREVIEW DRAWS); the element
   in question comes from the change itself: its sample, carrying the class
   names its lines are written against, so the preview can apply those
   lines to it (DecisionPreview). Nothing here colors the element: it is
   unstyled until a line says what it is, which is the point.

   The sketches are drawn, not pictured, and stay readable at any width: a
   row puts its value under its label when there is no room beside it. */

/** The last class in a selector, which is the element a line is about: `.activity__old` from `.activity__old`, `table` from `.customers .table`. */
function classOf(selector: string): string {
  const all = selector.match(/\.[\w-]+/g);
  return all ? all[all.length - 1].slice(1) : '';
}

/** A direction's label, from what it adds: the text inside the Badge it puts before the value. */
function addedLabel(option?: Option): string | undefined {
  const add = option?.adds?.find((a) => a.header === 'a label');
  return add?.text.match(/>([^<]+)</)?.[1];
}

/* The element a struck-value question is about, as it renders: the old
   value struck through, and the value that replaced it, each carrying the
   class its line is written against. A direction that adds a label shows it
   first. The visually hidden words say what the strike and the arrow say. */
function Struck({ sample, lines, label }: { sample: Sample; lines: Line[]; label?: string }) {
  return (
    <span className="sketch__struck">
      {label ? (
        <Badge icon="swap" className="sketch__added">
          {label}
        </Badge>
      ) : null}
      <s className={classOf(lines[0]?.selector ?? '')}>
        <span className="visually-hidden">was </span>
        {sample.old}
      </s>
      {sample.replacement ? (
        <>
          <Icon name="arrow-right" size={12} className="sketch__arrow" />
          <span className={classOf(lines[1]?.selector ?? '')}>
            <span className="visually-hidden">, now </span>
            {sample.replacement}
          </span>
        </>
      ) : (
        <span className="visually-hidden">, removed</span>
      )}
    </span>
  );
}

function Rows({ title, subtitle, rows, focus, twin }: { title: string; subtitle?: string; rows: SketchRow[]; focus?: ReactNode; twin?: Twin }) {
  return (
    <section className="sketch" aria-label={title}>
      <header className="sketch__head">
        <p className="sketch__title">{title}</p>
        {subtitle ? <p className="sketch__sub">{subtitle}</p> : null}
      </header>
      <ul className="sketch__rows">
        {rows.map((r) => (
          <li key={r.label} className="sketch__row" data-focus={r.focus && !twin ? '' : undefined} data-twin={r.focus && twin ? '' : undefined}>
            <span className="sketch__what">
              <span className="sketch__label">{r.label}</span>
              {r.meta ? <span className="sketch__meta">{r.meta}</span> : null}
            </span>
            <span className="sketch__value">
              {r.focus && focus ? focus : r.value}
              {r.focus && twin ? (
                <>
                  {/* The twin, in the red its own change gave it on its own:
                      the status "Payment failed", --color-danger. */}
                  <span className="sketch__status sketch__status--failed">{twin.text}</span>
                </>
              ) : r.status ? (
                <span className="sketch__status">{r.status}</span>
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
  /** The direction being previewed, for the label it adds; the colors come from its lines, applied by the preview. */
  option?: Option;
}

/** The screen a change is on, with the element in question in place, and its twin's screen beside it when it has one. */
export function SketchScreen({ work, option }: SketchScreenProps) {
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
  const label = addedLabel(option);
  return (
    <div className="sketch-host">
    <div className="sketch-screen" data-pair={twin?.sketch ? '' : undefined}>
      <Rows
        title={sketch.title}
        subtitle={sketch.subtitle}
        rows={sketch.rows}
        focus={work.sample ? <Struck sample={work.sample} lines={work.lines} label={label} /> : null}
      />
      {twin?.sketch?.kind === 'rows' ? <Rows title={twin.sketch.title} subtitle={twin.sketch.subtitle} rows={twin.sketch.rows} twin={twin} /> : null}
    </div>
    </div>
  );
}

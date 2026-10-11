import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Badge, Icon, IconSetContext, SegmentedControl, type SegmentedOption } from '../../components';
import type { Line, Option, Reach, Work } from '../../data/delegation';
import { drawMarkOn } from '../ComponentPreview/mark';
import { Inline } from '../Inline';
import { SketchScreen } from './Sketch';
import './DecisionPreview.css';

/* PREVIEW STUDIO (2026-10-11, later). The delegated work's decision is made
   looking at the interface it changes: this is the large pane on the left of
   the workspace, the inspector on the right holds the decision itself
   (DecisionRequest). It shows the screen the change is on, rendered rather
   than pictured, so a person can read it, select its text and, on the
   customer list, use it.

   Why not ComponentPreview, which renders the review queue's changes: that
   preview compares two branches of a real screen (before and after, at a
   viewport width), from a registry of the experiment's frozen versions. A
   delegated decision has no branches yet, only proposals, and most of its
   screens are not in this repository; it needs the screen as it is, the
   screen as each direction would make it, and the element marked. The two
   share the product's frame (the product's surface, its icon set, a scale
   that fits a wide screen to the column) and the mark (ComponentPreview's
   mark.ts), not a toolbar.

   What makes the picture honest is where its colors come from. The element
   in question is drawn unstyled, carrying the class its lines are written
   against (Sketch.tsx), and the preview writes those lines onto it: the
   change's own `before` values for the screen as it is (the literal
   #b42318, from the old billing app), a direction's `after` values for the
   screen as proposed (var(--color-text-muted), resolved by the product's
   tokens). A token a direction adds (--radius-full) is declared on the
   frame for its preview and nowhere else. So the red in the preview is the
   red the code draws, and teal, the review's color, is only ever the
   annotation around it.

   The toolbar says which screen this is and whether the frame shows the
   interface as it is or as proposed, in words, never by color alone; once a
   direction is selected, a segmented control flips between the two, and the
   proposed view is labelled "Not applied" until it is. That line is a polite
   live region: selecting a direction, or flipping the view, is said once;
   the frame redrawing is not.

   The annotation is a thin accent outline with a small tag, drawn above the
   product in the frame (mark.ts), so the product's own elements are never
   restyled for the review. It is drawn in the light scheme whatever the
   review's theme, because the product under it always is. A twin, the same
   red elsewhere whose meaning was settled, gets a dashed neutral one.

   Under the frame, what the picture can't say: for two reds, what each one
   means and where it comes from; for a shared component, every screen it
   reaches, which of them have a visual baseline, and which move under the
   answer being previewed. */

export type PreviewView = 'current' | 'proposed';

const VIEWS: SegmentedOption<PreviewView>[] = [
  { value: 'current', label: 'Current' },
  { value: 'proposed', label: 'Proposed' },
];

/* How small a fixed-width screen may be drawn before the canvas pans
   instead, as ComponentPreview's MIN_SCALE. */
const MIN_SCALE = 0.5;

export interface DecisionPreviewProps {
  work: Work;
  /** The direction or answer selected in the inspector. One that decides nothing (more evidence) has nothing to preview and is not passed. */
  option?: Option;
  /** Which version the frame shows; proposed only while there is an option. */
  view: PreviewView;
  onViewChange: (view: PreviewView) => void;
  /** Its place among the decisions, for the annotation's tag. */
  position?: number;
}

/* The declarations a version of the screen is made of: the lines and the
   value each takes, and any token a direction adds. */
function versionOf(work: Work, option: Option | undefined): { lines: Line[]; values: string[]; tokens: [string, string][] } {
  if (!option) return { lines: work.lines, values: work.lines.map((l) => l.before), tokens: [] };
  const lines = option.lines ?? work.lines;
  const tokens = (option.adds ?? [])
    .filter((a) => a.file.endsWith('tokens.css'))
    .flatMap((a) => Array.from(a.text.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g), (m) => [m[1], m[2].trim()] as [string, string]));
  /* An answer that leaves the line as written proposes the line as it is. */
  return { lines, values: lines.map((l, i) => option.after[i] ?? l.before), tokens };
}

const fileOf = (path: string) => path.split('/').pop()?.replace(/\.css$/, '.tsx');

export function DecisionPreview({ work, option, view, onViewChange, position = 1 }: DecisionPreviewProps) {
  const id = useId();
  const sketch = work.sketch;
  const q = work.question;
  const shown: PreviewView = option ? view : 'current';
  const reach = q?.kind === 'scope' ? q.reach : undefined;

  /* The fit, as ComponentPreview's: a screen laid out for a minimum width
     (the customer list, 768) is drawn at that width and scaled to the
     canvas's content box; below MIN_SCALE the canvas pans, and is a tab
     stop so a keyboard can pan it. A sketch of rows is fluid and is never
     scaled. */
  const minWidth = sketch?.kind === 'screen' ? sketch.minWidth : 0;
  const canvas = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, pans: false });
  useLayoutEffect(() => {
    const el = canvas.current;
    if (!el || !minWidth) return;
    const measure = () => {
      const pad = getComputedStyle(el);
      const room = el.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight);
      const scale = Math.min(1, Math.max(MIN_SCALE, room / minWidth));
      setFit({ scale, pans: minWidth * scale > room + 0.5 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minWidth]);
  const scaled = minWidth > 0 && fit.scale < 1;

  const frame = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el || !scaled) return;
    const measure = () => setHeight(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scaled, work.id]);

  /* Write the version's declarations onto the screen, and take back the
     last version's first, so flipping between them leaves nothing behind. */
  const written = useRef<{ el: HTMLElement; property: string }[]>([]);
  const key = `${work.id}:${shown}:${option?.id ?? ''}`;
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const version = versionOf(work, shown === 'proposed' ? option : undefined);
    for (const w of written.current) w.el.style.removeProperty(w.property);
    written.current = [];
    const write = (target: HTMLElement, property: string, value: string) => {
      target.style.setProperty(property, value);
      written.current.push({ el: target, property });
    };
    for (const [name, value] of version.tokens) write(el, name, value);
    version.lines.forEach((line, i) => {
      el.querySelectorAll<HTMLElement>(line.selector).forEach((target) => write(target, line.property, version.values[i]));
    });
  }, [work, option, shown]);

  /* The annotations: the element in question, and its twin, marked from
     outside the screen and redrawn whenever the screen under them moves. */
  const mark = useRef<HTMLDivElement>(null);
  const twinMark = useRef<HTMLDivElement>(null);
  const focus = sketch?.kind === 'screen' ? sketch.focus : '[data-focus]';
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    let live = true;
    let queued = 0;
    const draw = () => {
      queued = 0;
      if (!live) return;
      if (mark.current) drawMarkOn(el, mark.current, el.querySelector<HTMLElement>(focus));
      if (twinMark.current) drawMarkOn(el, twinMark.current, el.querySelector<HTMLElement>('[data-twin]'));
    };
    const later = () => {
      if (live && !queued) queued = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(later);
    ro.observe(el);
    const mo = new MutationObserver(later);
    mo.observe(el, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style'] });
    document.fonts.ready.then(later);
    return () => {
      live = false;
      cancelAnimationFrame(queued);
      ro.disconnect();
      mo.disconnect();
    };
  }, [focus, key, scaled]);

  if (!sketch || !q) return null;

  const title = option ? (option.title ?? option.label) : undefined;
  const twin = q.kind === 'intent' ? q.twin : undefined;

  return (
    <section className="studio-preview" aria-labelledby={`${id}-screen`}>
      <div className="studio-preview__bar">
        <p className="studio-preview__screen" id={`${id}-screen`}>
          <Icon name="monitor" size={16} />
          <span className="visually-hidden">Preview of </span>
          <strong>{work.screen}</strong>
          <code className="studio-preview__file">{fileOf(work.file)}</code>
        </p>
        <div className="studio-preview__view">
          {option ? <SegmentedControl label="Preview shows" options={VIEWS} value={shown} onChange={onViewChange} size="compact" /> : null}
          <p className="studio-preview__state" aria-live="polite" data-view={shown}>
            {shown === 'proposed' && title ? (
              <>
                <span className="visually-hidden">The preview shows </span>
                <span className="studio-preview__proposed">
                  Proposed: <Inline text={title} />
                </span>
                <Badge className="studio-preview__unapplied" icon="clock">
                  Not applied
                </Badge>
              </>
            ) : (
              <>
                <span className="visually-hidden">The preview shows the </span>
                Current interface
              </>
            )}
          </p>
        </div>
      </div>

      <div
        className="studio-preview__canvas"
        ref={canvas}
        data-pans={fit.pans || undefined}
        {...(fit.pans ? { tabIndex: 0, role: 'region', 'aria-label': `${work.screen}, scrolls sideways` } : {})}
      >
        <div className="studio-preview__viewport" style={scaled ? { width: `${minWidth * fit.scale}px`, height: `${height * fit.scale}px` } : undefined}>
          <div
            ref={frame}
            className="studio-preview__frame"
            data-surface="product"
            data-view={shown}
            data-scaled={scaled || undefined}
            style={scaled ? { width: `${minWidth}px`, transform: `scale(${fit.scale})` } : undefined}
          >
            <IconSetContext.Provider value="product">
              <SketchScreen work={work} option={shown === 'proposed' ? option : undefined} />
            </IconSetContext.Provider>
            <div ref={mark} className="studio-mark" data-surface="review" data-label={`Decision ${position}`} aria-hidden="true" hidden />
            {twin ? <div ref={twinMark} className="studio-mark studio-mark--twin" data-surface="review" data-label={`Same red: ${twin.means.toLowerCase()}`} aria-hidden="true" hidden /> : null}
          </div>
        </div>
      </div>

      {twin && work.sample ? (
        <ul className="studio-preview__key" aria-label="The two reds">
          <li data-mark="decision">
            <p className="studio-preview__key-head">
              {q.means} <span className="studio-preview__key-where">· {work.screen}</span>
            </p>
            <p>{q.says}</p>
            <p className="studio-preview__key-token">
              <Inline text={`Hard-coded ${work.lines[0]?.before ?? ''}, from the old billing app`} />
            </p>
          </li>
          <li data-mark="twin">
            <p className="studio-preview__key-head">
              {twin.means} <span className="studio-preview__key-where">· {twin.screen}</span>
            </p>
            <p>{twin.says}</p>
            <p className="studio-preview__key-token">
              <Inline text={twin.token} />
            </p>
          </li>
        </ul>
      ) : null}

      {reach ? <ReachMap reach={reach} option={shown === 'proposed' ? option : undefined} /> : null}
    </section>
  );
}

/* Every screen the shared component is on, one square each, grouped by
   area. Two things are drawn, each one way: whether the screen has a
   visual baseline is the square's fill (filled, or hollow), and whether the
   answer being previewed changes it is its color (the accent, or the
   neutral ink); the screen that was asked about is ringed. The squares are
   a picture of the sentence above them, which says the same in words, so
   they are hidden from a screen reader; every screen is named under the
   read's "All 40 screens". */
function ReachMap({ reach, option }: { reach: Reach; option?: Option }) {
  const all = reach.areas.flatMap((a) => a.screens);
  const baseline = all.filter((s) => s.baseline).length;
  const everywhere = Boolean(option?.grants);
  const here = Boolean(option && !option.grants);
  const moves = (s: (typeof all)[number]) => everywhere || (here && s.asked);
  const others = all.length - 1;
  const summary = everywhere
    ? `Proposed: all ${all.length} screens get the change. ${all.length - baseline} of them have no visual baseline.`
    : here
      ? `Proposed: only the ${all.find((s) => s.asked)?.name.toLowerCase() ?? 'screen asked about'} gets the change. The other ${others} keep theirs.`
      : `${all.length} screens draw the shared ${reach.component}. ${baseline} have a visual baseline; ${all.length - baseline} have none.`;
  return (
    <div className="studio-reach" data-moving={everywhere ? 'all' : here ? 'one' : undefined}>
      <p className="studio-reach__summary">{summary}</p>
      <div className="studio-reach__areas" aria-hidden="true">
        {reach.areas.map((a) => (
          <div key={a.area} className="studio-reach__area">
            <span className="studio-reach__name">{a.area}</span>
            <span className="studio-reach__screens">
              {a.screens.map((s) => (
                <span
                  key={s.name}
                  className="studio-reach__screen"
                  title={s.name}
                  data-baseline={s.baseline || undefined}
                  data-asked={s.asked || undefined}
                  data-moves={moves(s) || undefined}
                />
              ))}
            </span>
          </div>
        ))}
      </div>
      <p className="studio-reach__key" aria-hidden="true">
        <span>
          <span className="studio-reach__screen" data-baseline="" /> Visual baseline
        </span>
        <span>
          <span className="studio-reach__screen" /> No baseline
        </span>
        <span>
          <span className="studio-reach__screen" data-asked="" /> Asked about
        </span>
        {option ? (
          <span>
            <span className="studio-reach__screen" data-moves="" data-baseline="" />
            <span className="studio-reach__screen" data-moves="" /> Changes under this answer
          </span>
        ) : null}
      </p>
    </div>
  );
}

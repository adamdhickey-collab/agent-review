import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ErrorState, LoadingState, SegmentedControl, type SegmentedOption } from '../../components';
import type { Reproduce, Screen, Side, Viewport } from '../../data/types';
import { PreviewScreen } from '../preview/screens';
import { drawMark } from './mark';
import './ComponentPreview.css';

/* The affected product UI, rendered, not pictured. The frame is the
   chosen viewport wide and scales to fit the column, so 768 means the
   layout a tablet gets and the overflow it gets. Before and after are
   the two versions of the screen from code: the baseline and the agent's
   branch. A finding puts the frame in the state that shows it, and the
   element it is about is outlined.

   The frame's content is real and operable: a reviewer can tab into it
   and select rows. */

export const VIEWPORTS: SegmentedOption<`${Viewport}`>[] = [
  { value: '1280', label: 'Desktop, 1280', icon: 'monitor', iconOnly: true },
  { value: '1024', label: 'Laptop, 1024', icon: 'tablet', iconOnly: true },
  { value: '768', label: 'Tablet, 768', icon: 'smartphone', iconOnly: true },
];

const SIDES: SegmentedOption<Side>[] = [
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
];

const SCREENS: SegmentedOption<Screen>[] = [
  { value: 'customers', label: 'Customers' },
  { value: 'invoices', label: 'Invoices' },
];

export interface ComponentPreviewProps {
  /** Which change's versions to render: the registry in preview/screens.tsx. */
  changeId?: string;
  /** The state a selected finding asks for; the controls follow it. */
  reproduce?: Reproduce;
  /** Which screens the change touched, for the screen switch. */
  screens?: Screen[];
  /** Something to show above the frame: a caption, a warning. */
  note?: ReactNode;
  /** The branch is still building, or failed to: the frame gives way to the
      region state and says so. */
  status?: { kind: 'loading' } | { kind: 'error'; message: string; detail?: string; onRetry?: () => void };
}

export function ComponentPreview({ changeId, reproduce, screens = ['customers', 'invoices'], note, status }: ComponentPreviewProps) {
  const [screen, setScreen] = useState<Screen>(reproduce?.screen ?? 'customers');
  const [side, setSide] = useState<Side>(reproduce?.side ?? 'after');
  const [viewport, setViewport] = useState<Viewport>(reproduce?.viewport ?? 1280);
  const [selection, setSelection] = useState(reproduce?.withSelection ?? false);

  /* When the finding changes, the controls follow it. Done during render
     (the React pattern for state that depends on a prop) so there is no
     frame showing the old state first. */
  const [followed, setFollowed] = useState(reproduce);
  if (reproduce !== followed) {
    setFollowed(reproduce);
    if (reproduce) {
      setScreen(reproduce.screen);
      setSide(reproduce.side);
      setViewport(reproduce.viewport);
      setSelection(reproduce.withSelection ?? false);
    }
  }

  const column = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = column.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / viewport));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewport]);

  const [height, setHeight] = useState(400);
  const frame = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => setHeight(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [screen, side, viewport, selection]);

  /* The finding's element is marked from outside the screen (mark.ts),
     before paint, and again whenever the screen under it moves: a width,
     fonts arriving, or the reviewer selecting rows in the frame. */
  const mark = useRef<HTMLDivElement>(null);
  const target = reproduce?.target;
  useLayoutEffect(() => {
    const el = frame.current;
    const m = mark.current;
    if (!el || !m) return;
    let live = true;
    let queued = 0;
    const draw = () => {
      queued = 0;
      if (live) drawMark(el, m, target);
    };
    const later = () => {
      if (live && !queued) queued = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(later);
    ro.observe(el);
    const mo = new MutationObserver(later);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    document.fonts.ready.then(later);
    return () => {
      live = false;
      cancelAnimationFrame(queued);
      ro.disconnect();
      mo.disconnect();
    };
  }, [target, changeId, screen, side, viewport, selection]);

  return (
    <div className="preview">
      <div className="preview__bar">
        {screens.length > 1 ? (
          <SegmentedControl label="Screen" options={SCREENS.filter((s) => screens.includes(s.value))} value={screen} onChange={setScreen} size="compact" />
        ) : null}
        <SegmentedControl label="Version" options={SIDES} value={side} onChange={setSide} size="compact" />
        <SegmentedControl label="Viewport width" options={VIEWPORTS} value={`${viewport}`} onChange={(v) => setViewport(Number(v) as Viewport)} size="compact" />
        <span className="preview__dims">
          <code>{viewport}px</code>
          {scale < 1 ? <span className="preview__scale">at {Math.round(scale * 100)}%</span> : null}
        </span>
      </div>
      {note ? <div className="preview__note">{note}</div> : null}
      {status?.kind === 'loading' ? (
        <div className="preview__column">
          <LoadingState title="Building the agent\u2019s branch" description="The preview renders from the branch once its build finishes." />
        </div>
      ) : status?.kind === 'error' ? (
        <div className="preview__column">
          <ErrorState
            title="The agent\u2019s branch did not build"
            description={status.message}
            detail={status.detail}
            action={status.onRetry ? { label: 'Try the build again', onClick: status.onRetry } : undefined}
          />
        </div>
      ) : (
      <div className="preview__column" ref={column} data-side={side}>
        <div className="preview__viewport" style={{ height: `${height * scale}px` }}>
          <div
            ref={frame}
            className="preview__frame"
            style={{ width: `${viewport}px`, transform: `scale(${scale})` }}
            data-target={reproduce?.target}
          >
            <PreviewScreen changeId={changeId} screen={screen} side={side} selection={selection} />
            <div ref={mark} className="preview__mark" aria-hidden="true" hidden />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

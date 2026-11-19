import { useEffect, useLayoutEffect, useRef } from 'react';
import { screenOf, type Arrival, type Route } from './router';
import { useStore } from './store';
import { stageOf } from '../data/cycle';

/* What a route change owes a reader who cannot see the page change. The
   title says which screen this is, so a tab, a history entry and a screen
   reader's page announcement all say something other than "Agent Review".
   Focus goes to the screen's heading when the SCREEN changes, so a
   keyboard or a screen reader starts at the top of the new screen rather
   than on a link that no longer exists; selecting a finding on the same
   change is not a new screen and leaves focus where the reviewer put it.
   The first load is not a change: the browser has already started the
   reader at the top. That is read from the key last seen, not from a
   "first run" flag, because StrictMode runs an effect twice on mount in
   development and a flag set by the first run would send the second one
   to the heading.

   And where the page is. A new screen starts at the top, the way a new
   page does, whatever the last one had been scrolled to; an entry the
   reader goes back or forward to is where they left it, which the router
   kept (app/router.ts, Arrival); a reload is put back where it was, and
   kept there while the page finishes arriving (the web fonts come after
   the first paint and re-wrap its lines), unless the reader takes hold of
   it first. The heading takes focus without
   scrolling: the scroll is decided here, and a focus() that also scrolled
   is what made where a screen arrived depend on where the heading
   happened to be. All of it in a layout effect, before the paint, and so
   inside a view transition's update, where the browser takes its second
   picture. */

const NAME = 'Agent Review';

/* Scrolls to y. On a first paint the page is not finished: it may not be
   tall enough yet, and the web fonts arrive after it and re-wrap its lines,
   which the browser's scroll anchoring follows by moving the page. So,
   asked to settle, it puts the page back each time the page changes height,
   until the reader takes hold of it or two seconds have passed. */
const TAKEOVER = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

function place(y: number, settle = false) {
  window.scrollTo(0, y);
  if (!settle) return;
  const stop = () => {
    grew.disconnect();
    clearTimeout(deadline);
    for (const t of TAKEOVER) window.removeEventListener(t, stop);
  };
  const grew = new ResizeObserver(() => window.scrollTo(0, y));
  const deadline = setTimeout(stop, 2000);
  for (const t of TAKEOVER) window.addEventListener(t, stop, { passive: true });
  grew.observe(document.documentElement);
}

export function useRouteEffects(route: Route, arrival: Arrival) {
  const store = useStore();
  const screen =
    route.name === 'delegation'
      ? route.run === 'shared-table'
        ? 'Delegated work: the shared table'
        : 'Delegated work'
      : route.name === 'cycle'
        ? `Design cycle: ${stageOf(route.stage).name}`
        : route.name === 'queue'
        ? 'Review queue'
        : route.name === 'change'
          ? (store.find(route.id)?.title ?? 'No change with that id')
          : route.name === 'scene'
            ? `Scene: ${route.id}`
            : 'Not found';

  useEffect(() => {
    document.title = `${screen} · ${NAME}`;
  }, [screen]);

  const key = screenOf(route);
  const seen = useRef(key);
  useLayoutEffect(() => {
    const moved = seen.current !== key;
    seen.current = key;
    if (arrival.kind === 'load') {
      if (arrival.scroll !== null) place(arrival.scroll, true);
      return;
    }
    if (arrival.kind === 'traverse' && arrival.scroll !== null) place(arrival.scroll);
    else if (moved) place(0);
    if (moved) document.querySelector<HTMLElement>('#main h1')?.focus({ preventScroll: true });
  }, [arrival, key]);
}

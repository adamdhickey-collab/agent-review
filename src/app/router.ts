import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import type { RunId } from '../data/delegation';

/* A hash router in fifty lines. Four routes, one hook. The hash is the
   state, so a URL names a screen and a finding, and the back button
   works. The delegated work is the front door at "/", and the review queue
   the experiment was built around is at "/queue". A second delegated run,
   the shared table, is at "/runs/shared-table", so it can be linked to
   directly; the billing run stays at "/". A route with parameters beyond an
   id and a finding is when a dependency earns its place. */

export type Route =
  | { name: 'delegation'; run?: RunId }
  | { name: 'queue' }
  | { name: 'change'; id: string; findingId?: string }
  | { name: 'not-found'; path: string };

export function parse(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/' || path === '/runs/billing') return { name: 'delegation' };
  if (path === '/runs/shared-table' || path === '/runs/shared-table/') return { name: 'delegation', run: 'shared-table' };
  if (path === '/queue' || path === '/queue/') return { name: 'queue' };
  const m = path.match(/^\/changes\/([\w-]+)(?:\/findings\/([\w-]+))?\/?$/);
  if (m) return { name: 'change', id: m[1], findingId: m[2] };
  return { name: 'not-found', path };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'delegation':
      return route.run && route.run !== 'billing' ? `#/runs/${route.run}` : '#/';
    case 'queue':
      return '#/queue';
    case 'change':
      return route.findingId ? `#/changes/${route.id}/findings/${route.findingId}` : `#/changes/${route.id}`;
    case 'not-found':
      return `#${route.path}`;
  }
}

export function navigate(route: Route, replace = false) {
  const h = href(route);
  if (replace) history.replaceState(history.state, '', h); /* the same entry, so it keeps its key (below) */
  else location.hash = h;
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/* Where the page is when a screen arrives. The browser puts a page back
   where it was when the reader goes back or forward to it or reloads it,
   and it does that against whatever is on the page at the time. On a
   traversal that is still the screen being left, before React has put the
   other one there, so the position was clamped to the wrong screen's
   height; and the new screen's heading then took focus, which scrolls
   when the heading is out of view and does nothing when it is in view, so
   where the page ended up depended on how far down the last screen it had
   been. On a phone, whose bar is two rows, the heading is in view after a
   small scroll, and a new screen arrived with the bar just above the
   screen and the run tabs cut (2026-10-11).

   So the router keeps the positions itself. Restoration is manual
   (index.html sets it before the first paint, so the browser never scrolls
   a page that is still empty); every history entry carries a key in
   history.state, stamped on arrival when a link made the entry; and where
   each entry was left is kept by its key in sessionStorage, which a reload
   and a restored tab keep and a new tab does not. The route arrives with
   how it was reached, and useRouteEffects says what that owes the reader:
   a new screen starts at the top, an entry gone back to is where it was
   left. */

export type Arrival = {
  /* The first paint (a load, a reload, a tab put back), an entry just made
     (a link, or the same entry with its hash replaced), or one the reader
     went back or forward to. */
  kind: 'load' | 'new' | 'traverse';
  key: string;
  /* Where this entry was left, when it has been left before. */
  scroll: number | null;
};

const POSITIONS = 'agent-review:scroll';
const KEPT = 100;

function positions(): Record<string, number> {
  try {
    const all: unknown = JSON.parse(sessionStorage.getItem(POSITIONS) ?? '{}');
    return all && typeof all === 'object' ? (all as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function remember(key: string, y: number) {
  try {
    const all = positions();
    delete all[key]; /* re-added last, so the oldest keys are the first to go */
    all[key] = y;
    const keys = Object.keys(all);
    for (const old of keys.slice(0, Math.max(0, keys.length - KEPT))) delete all[old];
    sessionStorage.setItem(POSITIONS, JSON.stringify(all));
  } catch {
    /* no storage to keep it in (a private window, a full store): positions last until the next load */
  }
}

function left(key: string): number | null {
  const y = positions()[key];
  return typeof y === 'number' ? y : null;
}

function keyOf(): string | null {
  const s: unknown = history.state;
  return s && typeof s === 'object' && typeof (s as { key?: unknown }).key === 'string' ? (s as { key: string }).key : null;
}

function fresh(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function stamp(key: string) {
  const s: unknown = history.state;
  history.replaceState({ ...(s && typeof s === 'object' ? s : {}), key }, '');
}

/* Which screen a route is. Selecting a finding changes the route and not
   the screen, and so does not move focus (useRouteEffects) or run a
   transition (below). */
export function screenOf(route: Route): string {
  if (route.name === 'delegation' && route.run && route.run !== 'billing') return `delegation:${route.run}`;
  return route.name === 'change' ? `change:${route.id}` : route.name;
}

/* The name a change's title carries in a view transition, in the queue and
   at the head of its own screen. The same name in both places is the whole
   mechanism: the browser pairs them and moves one into the other. */
export function titleTransitionName(id: string): string {
  return `change-title-${id.replace(/[^\w-]/g, '-')}`;
}

type TransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown };

export function useRoute(): { route: Route; arrival: Arrival } {
  const [current, setCurrent] = useState<{ route: Route; arrival: Arrival }>(() => {
    /* An entry with a key has been here before (a reload, a tab put back)
       and may have a position to go back to; one without is new, and the
       effect stamps it. The key is made here rather than there so that the
       state and the entry agree on it. */
    const known = keyOf();
    const arrival: Arrival = known ? { kind: 'load', key: known, scroll: left(known) } : { kind: 'load', key: fresh(), scroll: null };
    return { route: parse(location.hash), arrival };
  });
  const mounted = current.arrival.key;
  useEffect(() => {
    history.scrollRestoration = 'manual';
    let at = mounted; /* the entry the reader is on */
    if (keyOf() !== at) stamp(at);
    let screen = screenOf(parse(location.hash));
    let frame = 0;
    const save = () => remember(at, window.scrollY);
    /* Saved as the page scrolls, a frame at a time, and not at pagehide: by
       then the page being left has lost its web fonts and been re-wrapped,
       and the browser's scroll anchoring has moved it with them (measured
       100px up on a reload of the delegated work). */
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        save();
      });
    };
    const on = () => {
      save(); /* where the entry being left was: the page has not changed yet, and the browser no longer scrolls it */
      const next = parse(location.hash);
      const known = keyOf();
      let arrival: Arrival;
      if (known === at) arrival = { kind: 'new', key: at, scroll: null };
      else if (known) arrival = { kind: 'traverse', key: known, scroll: left(known) };
      else {
        const key = fresh();
        stamp(key);
        arrival = { kind: 'new', key, scroll: null };
      }
      at = arrival.key;
      const moved = screenOf(next) !== screen;
      screen = screenOf(next);
      const doc = document as TransitionDocument;
      /* An enhancement, asked for only when the screen changes, the browser
         can, and the reader has not asked for stillness. flushSync, so the
         new screen is in the page, at the top, when the browser takes its
         second picture. Everywhere else the route just changes, as it
         always did. */
      if (moved && doc.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        doc.startViewTransition(() => flushSync(() => setCurrent({ route: next, arrival })));
      } else {
        setCurrent({ route: next, arrival });
      }
    };
    window.addEventListener('hashchange', on);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('hashchange', on);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [mounted]);
  return current;
}

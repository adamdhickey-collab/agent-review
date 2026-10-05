import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

/* A hash router in fifty lines. Four routes, one hook. The hash is the
   state, so a URL names a screen and a finding, and the back button
   works. The delegated work is the front door at "/", and the review queue
   the experiment was built around is at "/queue". A route with parameters
   beyond an id and a finding is when a dependency earns its place. */

export type Route =
  | { name: 'delegation' }
  | { name: 'queue' }
  | { name: 'change'; id: string; findingId?: string }
  | { name: 'not-found'; path: string };

export function parse(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/') return { name: 'delegation' };
  if (path === '/queue' || path === '/queue/') return { name: 'queue' };
  const m = path.match(/^\/changes\/([\w-]+)(?:\/findings\/([\w-]+))?\/?$/);
  if (m) return { name: 'change', id: m[1], findingId: m[2] };
  return { name: 'not-found', path };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'delegation':
      return '#/';
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
  if (replace) history.replaceState(null, '', h);
  else location.hash = h;
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/* Which screen a route is. Selecting a finding changes the route and not
   the screen, and so does not move focus (useRouteEffects) or run a
   transition (below). */
export function screenOf(route: Route): string {
  return route.name === 'change' ? `change:${route.id}` : route.name;
}

/* The name a change's title carries in a view transition, in the queue and
   at the head of its own screen. The same name in both places is the whole
   mechanism: the browser pairs them and moves one into the other. */
export function titleTransitionName(id: string): string {
  return `change-title-${id.replace(/[^\w-]/g, '-')}`;
}

type TransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown };

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(location.hash));
  useEffect(() => {
    let screen = screenOf(parse(location.hash));
    const on = () => {
      const next = parse(location.hash);
      const moved = screenOf(next) !== screen;
      screen = screenOf(next);
      const doc = document as TransitionDocument;
      /* An enhancement, asked for only when the screen changes, the browser
         can, and the reader has not asked for stillness. flushSync, so the
         new screen is in the page when the browser takes its second
         picture. Everywhere else the route just changes, as it always did. */
      if (moved && doc.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        doc.startViewTransition(() => flushSync(() => setRoute(next)));
      } else {
        setRoute(next);
      }
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

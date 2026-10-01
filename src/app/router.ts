import { useEffect, useState } from 'react';

/* A hash router in forty lines. Three routes, one hook. The hash is the
   state, so a URL names a screen and a finding, and the back button
   works. Nothing here would survive a fourth kind of route; that is when
   a dependency earns its place. */

export type Route =
  | { name: 'queue' }
  | { name: 'change'; id: string; findingId?: string }
  | { name: 'not-found'; path: string };

export function parse(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/') return { name: 'queue' };
  const m = path.match(/^\/changes\/([\w-]+)(?:\/findings\/([\w-]+))?\/?$/);
  if (m) return { name: 'change', id: m[1], findingId: m[2] };
  return { name: 'not-found', path };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'queue':
      return '#/';
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

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(location.hash));
  useEffect(() => {
    const on = () => setRoute(parse(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

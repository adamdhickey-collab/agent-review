import { useEffect, useRef } from 'react';
import { screenOf, type Route } from './router';
import { useStore } from './store';

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
   to the heading. */

const NAME = 'Agent Review';

export function useRouteEffects(route: Route) {
  const store = useStore();
  const screen =
    route.name === 'delegation'
      ? 'Delegated work'
      : route.name === 'queue'
        ? 'Review queue'
        : route.name === 'change'
          ? (store.find(route.id)?.title ?? 'No change with that id')
          : 'Not found';

  useEffect(() => {
    document.title = `${screen} · ${NAME}`;
  }, [screen]);

  const key = screenOf(route);
  const seen = useRef(key);
  useEffect(() => {
    if (seen.current === key) return;
    seen.current = key;
    document.querySelector<HTMLElement>('#main h1')?.focus();
  }, [key]);
}

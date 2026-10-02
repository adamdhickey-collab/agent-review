import { useSyncExternalStore } from 'react';

/* Whether a media query matches, kept current. For the one place the
   markup, not only the styles, has to differ by width: a table cannot
   reflow into a list with CSS and stay a table to a screen reader, so the
   queue renders the list itself below 48rem. Everything else is CSS. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

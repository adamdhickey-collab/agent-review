import { useCallback, useEffect, useState } from 'react';

/* The review's appearance: Light, Dark, or System, chosen in the bar
   (Shell) and remembered. Until a person chooses, it is Dark: a first visit
   is dark whatever the operating system is set to, and the bar shows Dark
   chosen. Choosing Light or Dark puts data-theme on the root and fixes the
   scheme; choosing System takes the attribute off, and the root's own
   color-scheme, "light dark" (app/global.css), lets every light-dark()
   token in tokens.css follow the system live, with nothing listening in
   script.

   The choice is kept where the earlier light/dark toggle kept it
   (localStorage 'agent-review:theme'), so a choice made before System
   existed is read as it was written: 'light' and 'dark' mean what they
   meant, and 'system' is the one new value. Nothing to migrate.

   Dark by default since 2026-10-27, by decision (Adam: "the prototype
   should default to dark mode"); following the system from 2026-10-24,
   so light for most first visits; dark by default from later on
   2026-10-11, following the system when Preview Studio opened that day,
   light from earlier that day, and dark from 2026-10-05.

   index.html applies a remembered Light or Dark, or Dark when nothing is
   remembered, before the first paint, so nobody sees the other first; this hook keeps the
   attribute and the storage in step after that. Storage can throw (a
   private window, a blocked site), and then the choice lasts for the visit.

   The product in the preview frame does not follow it. Its surface is
   always light (app/global.css), because the frame shows Relay as the
   checks measured it, and Relay has one scheme. */

export type Appearance = 'light' | 'dark' | 'system';

export const APPEARANCE_KEY = 'agent-review:theme';

function remembered(): Appearance {
  try {
    const v = localStorage.getItem(APPEARANCE_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'dark';
  } catch {
    return 'dark';
  }
}

export function useTheme(): { appearance: Appearance; setAppearance: (next: Appearance) => void } {
  const [appearance, setChoice] = useState<Appearance>(remembered);

  useEffect(() => {
    const root = document.documentElement;
    if (appearance === 'system') delete root.dataset.theme;
    else root.dataset.theme = appearance;
  }, [appearance]);

  const setAppearance = useCallback((next: Appearance) => {
    try {
      localStorage.setItem(APPEARANCE_KEY, next);
    } catch {
      /* the choice still holds for this visit */
    }
    setChoice(next);
  }, []);

  return { appearance, setAppearance };
}

import { useCallback, useEffect, useState } from 'react';

/* The review's appearance: Light, Dark, or System, chosen in the bar
   (Shell) and remembered. Until a person chooses, it is System, which
   follows the operating system's setting and keeps following it: the root's
   color-scheme is "light dark" (app/global.css), so every light-dark() token
   in tokens.css resolves to whichever the system says, live, with nothing
   listening in script. Choosing Light or Dark puts data-theme on the root,
   which fixes the color-scheme; choosing System takes it off again, so a
   change of the system's setting is followed only while System is chosen.

   The choice is kept where the earlier light/dark toggle kept it
   (localStorage 'agent-review:theme'), so a choice made before System
   existed is read as it was written: 'light' and 'dark' mean what they
   meant, and 'system' is the one new value. Nothing to migrate.

   Since Preview Studio (2026-10-11, later). Before it, the review had a
   default of its own instead of the system's: light from earlier that day,
   dark from 2026-10-05.

   index.html applies a remembered Light or Dark before the first paint, so a
   person who chose dark never sees a light page first; this hook keeps the
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
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
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

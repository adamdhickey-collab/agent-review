import { useCallback, useEffect, useState } from 'react';

/* The review's appearance: Dark, Light, or System, chosen in the bar
   (Shell) and remembered. Until a person chooses, it is Dark: the root's
   color-scheme is dark (app/global.css), so every light-dark() token in
   tokens.css resolves to its dark half, and every first visit sees the same
   thing, which is also what the review's pictures show. Choosing Light or
   System puts data-theme on the root: light fixes the scheme, system sets it
   to "light dark", which follows the operating system's setting live, with
   nothing listening in script. Choosing Dark takes the attribute off again.

   The choice is kept where the earlier light/dark toggle kept it
   (localStorage 'agent-review:theme'), so a choice made before System
   existed is read as it was written: 'light' and 'dark' mean what they
   meant, and 'system' is the one new value. Nothing to migrate.

   Dark by default since 2026-10-11 (later still), by decision; Preview
   Studio opened that day following the system, it was light from earlier
   that day, and dark from 2026-10-05.

   index.html applies a remembered Light or System before the first paint, so
   a person who chose light never sees a dark page first; this hook keeps the
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
    if (appearance === 'dark') delete root.dataset.theme;
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

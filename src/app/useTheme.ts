import { useEffect, useState } from 'react';
import { useMediaQuery } from './useMediaQuery';

/* The review's theme. Light or dark is the reader's system setting until
   they choose one in the bar; a choice is remembered and wins in either
   direction. The choice is one attribute on the root, data-theme, which the
   base stylesheet turns into a color-scheme; every color is
   light-dark(light, dark) in tokens.css, so nothing else has to know.

   The product in the preview frame does not follow it. Its surface is
   always light (app/global.css), because the frame shows Relay as the
   checks measured it.

   index.html applies a remembered choice before the first paint, so a
   reader who chose dark does not see a light page first; this hook keeps
   the attribute and the storage in step after that. Storage can throw (a
   private window, a blocked site), and then the choice lasts for the visit. */

export type Theme = 'light' | 'dark';

const KEY = 'agent-review:theme';

function remembered(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const system: Theme = useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light';
  const [choice, setChoice] = useState<Theme | null>(remembered);
  const theme = choice ?? system;

  useEffect(() => {
    if (choice) document.documentElement.dataset.theme = choice;
    else delete document.documentElement.dataset.theme;
  }, [choice]);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* the choice still holds for this visit */
    }
    setChoice(next);
  };

  return { theme, toggle };
}

import { useEffect, useState } from 'react';

/* The width the desk needs, in the page's own pixels: the window divided by
   the page's zoom (app/scale.css), because a zoomed page lays out narrower
   than the window a media query reads. Under it, the interface's column is
   too narrow for the billing screen's rows to stay on one line. */
export const DESK_REM = 76;

export function useDeskWide() {
  const measure = () => {
    if (typeof window === 'undefined') return false;
    const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return window.innerWidth / zoom >= DESK_REM * rem;
  };
  const [on, setOn] = useState(measure);
  useEffect(() => {
    const change = () => setOn(measure());
    change();
    window.addEventListener('resize', change);
    return () => window.removeEventListener('resize', change);
  }, []);
  return on;
}

import { useEffect, useState, type ReactNode } from 'react';
import { Icon, IconButton, SegmentedControl, type SegmentedOption } from '../../components';
import { href, type Route } from '../../app/router';
import { useTheme, type Appearance } from '../../app/useTheme';
import { opensSheet, useSingleKeys } from '../../app/shortcuts';
import { ShortcutSheet } from '../ShortcutSheet/ShortcutSheet';
import './Shell.css';

/* The chrome: one bar. The product's name, where you are, and who you
   are. Everything else is the screen. Three places: the design cycle (since
   2026-10-25), the delegated work and the reviews, the queue of single
   changes the experiment was built around.
   The product's name goes to the front door, which since 2026-10-26 is the
   design cycle's first stage (until then a start screen, from 2026-10-23).
   The bar is a landmark (header) and the content is main, so a screen
   reader can skip to it.

   On the cycle the bar is quieter still (since 2026-10-26): no places and
   no repository. Most people on the cycle came from a case study for three
   minutes, and "Delegated work" and "Reviews" are a second and third
   product they have no frame for; a guided path keeps one way in and one
   way out, the way a checkout drops a store's navigation. The two runs are
   linked where the cycle ends, in Learn, and every place is still at its
   own address. The project links and the appearance control stay: they
   leave the product or change how it looks, and take nothing from the path.

   The route is the URL's hash, so a link to "#main" would be read as a
   route and replace the screen with "nothing at this address". The skip
   link keeps its href, for a browser that runs no script, and moves focus
   itself.

   The bar is quiet on purpose: it sits on the page's own ground, not on a
   white band, and the place you are in is said by ink and by the line
   under it, the same line a selected tab carries, so the first thing with
   weight on a screen is the screen's own heading. Two places, and two
   links out of the product (the Storybook and the source), which are not
   places in it and so are a second, quieter nav on the right, before the
   appearance control.

   The appearance control is three choices, Light, Dark and System, as the
   system's segmented control: one tab stop, arrow keys between them, each
   an icon with its name as the tooltip and the accessible name. It was a
   single toggle until Preview Studio (2026-10-11, later), when following
   the operating system became the default and a third choice; a toggle
   cannot say "follow the system". The review follows the system until a
   person chooses (app/useTheme.ts).

   The keyboard button opens the list of shortcuts, and so does a question
   mark pressed anywhere a person is not typing (app/shortcuts.ts has the
   rules). The button is the way in that is always there: the key can be
   switched off, and a pointer has no question mark. It is not on a phone's
   bar, where there is no keyboard to have shortcuts for. */

const APPEARANCES: SegmentedOption<Appearance>[] = [
  { value: 'light', label: 'Light', icon: 'sun', iconOnly: true },
  { value: 'dark', label: 'Dark', icon: 'moon', iconOnly: true },
  { value: 'system', label: 'System', icon: 'monitor', iconOnly: true },
];

/* The product's mark, as its favicon draws it: Phosphor's terminal window
   (the agent's icon, fill weight) grown to be the whole tile, with the
   prompt it cut out drawn on it at .15 of Phosphor's 256 grid, centred.
   The corner is an app icon's, 7 of 32, in the drawing's own viewBox. */
export function AppMark() {
  return (
    <svg className="shell__mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect className="shell__mark-tile" width="32" height="32" rx="7" />
      <path
        className="shell__mark-glyph"
        transform="translate(-3.2 -3.2) scale(.15)"
        d="M125,134.25l-40,32a8,8,0,1,1-10-12.5L107.19,128,75,102.25a8,8,0,1,1,10-12.5l40,32a8,8,0,0,1,0,12.5ZM176,168H136a8,8,0,0,1,0-16h40a8,8,0,0,1,0,16Z"
      />
    </svg>
  );
}

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const { appearance, setAppearance } = useTheme();
  const singleKeys = useSingleKeys();
  const [sheet, setSheet] = useState(false);
  const guided = route.name === 'cycle';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!opensSheet(e)) return;
      e.preventDefault();
      setSheet(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="shell" data-surface="review" data-guided={guided || undefined}>
      <a
        className="shell__skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="shell__bar">
        <a className="shell__brand" href={href({ name: 'cycle', stage: 'discover' })} aria-label="Agent Review, start of the design cycle">
          <AppMark />
          <span>Agent Review</span>
        </a>
        <div className="shell__where">
          {guided ? null : (
          <nav className="shell__nav" aria-label="Primary">
            <a href={href({ name: 'cycle', stage: 'discover' })}>
              <span className="shell__long">Design cycle</span>
              <span className="shell__short" aria-hidden="true">
                Cycle
              </span>
            </a>
            <a href={href({ name: 'delegation' })} aria-current={route.name === 'delegation' ? 'page' : undefined}>
              <span className="shell__long">Delegated work</span>
              <span className="shell__short" aria-hidden="true">
                Work
              </span>
            </a>
            <a href="#/queue" aria-current={route.name === 'queue' ? 'page' : undefined}>
              Reviews
            </a>
          </nav>
          )}
          <nav className="shell__links" aria-label="Project links">
            <a href="storybook/" target="_blank" rel="noopener">
              Storybook
              <Icon name="arrow-up-right" size={12} />
            </a>
            <a href="https://github.com/adamdhickey-collab/agent-review" target="_blank" rel="noopener">
              Source
              <Icon name="arrow-up-right" size={12} />
            </a>
          </nav>
        </div>
        <div className="shell__context">
          <IconButton
            className="shell__shortcuts"
            icon="keyboard"
            label="Keyboard shortcuts"
            shortcut={singleKeys ? '?' : undefined}
            aria-keyshortcuts={singleKeys ? 'Shift+/' : undefined}
            aria-haspopup="dialog"
            onClick={() => setSheet(true)}
          />
          <SegmentedControl className="shell__appearance" label="Appearance" options={APPEARANCES} value={appearance} onChange={setAppearance} size="compact" />
          {guided ? null : (
            <span className="shell__repo">
              <Icon name="git-branch" size={14} />
              <code>relay/web</code>
            </span>
          )}
          <span className="shell__user">
            <span className="shell__avatar" aria-hidden="true">
              AH
            </span>
            <span className="visually-hidden">Signed in as </span>
            <span className="shell__user-name">Adam Hickey</span>
          </span>
        </div>
      </header>
      <main id="main" className="shell__main" tabIndex={-1}>
        {children}
      </main>
      <ShortcutSheet open={sheet} onClose={() => setSheet(false)} />
    </div>
  );
}

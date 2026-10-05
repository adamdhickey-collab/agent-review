import { useEffect, useState, type ReactNode } from 'react';
import { Icon, IconButton } from '../../components';
import type { Route } from '../../app/router';
import { useTheme } from '../../app/useTheme';
import { opensSheet, useSingleKeys } from '../../app/shortcuts';
import { ShortcutSheet } from '../ShortcutSheet/ShortcutSheet';
import './Shell.css';

/* The chrome: one bar. The product's name, where you are, and who you
   are. Everything else is the screen. Two places: the delegated work, which
   is the front door, and the reviews, the queue of single changes the
   experiment was built around. The bar is a landmark (header) and
   the content is main, so a screen reader can skip to it.

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
   theme toggle (a pressed button, app/useTheme.ts: pressed is dark).

   The keyboard button opens the list of shortcuts, and so does a question
   mark pressed anywhere a person is not typing (app/shortcuts.ts has the
   rules). The button is the way in that is always there: the key can be
   switched off, and a pointer has no question mark. It is not on a phone's
   bar, where there is no keyboard to have shortcuts for. */

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const singleKeys = useSingleKeys();
  const [sheet, setSheet] = useState(false);

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
    <div className="shell" data-surface="review">
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
        <a className="shell__brand" href="#/" aria-label="Agent Review, the delegated work">
          <span className="shell__mark" aria-hidden="true">
            <Icon name="check" size={14} />
          </span>
          <span>Agent Review</span>
        </a>
        <div className="shell__where">
          <nav className="shell__nav" aria-label="Primary">
            <a href="#/" aria-current={route.name === 'delegation' ? 'page' : undefined}>
              <span className="shell__long">Delegated work</span>
              <span className="shell__short" aria-hidden="true">
                Work
              </span>
            </a>
            <a href="#/queue" aria-current={route.name === 'queue' ? 'page' : undefined}>
              Reviews
            </a>
          </nav>
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
          <IconButton icon="moon" label="Dark theme" pressed={theme === 'dark'} onClick={toggle} />
          <span className="shell__repo">
            <Icon name="git-branch" size={14} />
            <code>relay/web</code>
          </span>
          <span className="shell__user">
            <span className="shell__avatar" aria-hidden="true">
              DW
            </span>
            <span className="visually-hidden">Signed in as </span>
            <span className="shell__user-name">Dana Whitfield</span>
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

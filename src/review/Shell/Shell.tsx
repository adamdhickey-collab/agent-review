import type { ReactNode } from 'react';
import { Icon } from '../../components';
import type { Route } from '../../app/router';
import './Shell.css';

/* The chrome: one bar. The product's name, where you are, and who you
   are. Everything else is the screen. Two places: the delegated work, which
   is the front door, and the reviews, the queue of single changes the
   experiment was built around. The bar is a landmark (header) and
   the content is main, so a screen reader can skip to it.

   The route is the URL's hash, so a link to "#main" would be read as a
   route and replace the screen with "nothing at this address". The skip
   link keeps its href, for a browser that runs no script, and moves focus
   itself. */

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
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
          <a href="storybook/" target="_blank" rel="noopener">
            Storybook
            <Icon name="arrow-up-right" size={12} />
          </a>
          <a href="https://github.com/adamdhickey-collab/agent-review" target="_blank" rel="noopener">
            Source
            <Icon name="arrow-up-right" size={12} />
          </a>
        </nav>
        <div className="shell__context">
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
    </div>
  );
}

import type { ReactNode } from 'react';
import { Icon } from '../../components';
import type { Route } from '../../app/router';
import './Shell.css';

/* The chrome: one bar. The product's name, where you are, and who you
   are. Everything else is the screen. The bar is a landmark (header) and
   the content is main, so a screen reader can skip to it. */

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  return (
    <div className="shell">
      <a className="shell__skip" href="#main">
        Skip to content
      </a>
      <header className="shell__bar">
        <a className="shell__brand" href="#/" aria-label="Agent Review, the review queue">
          <span className="shell__mark" aria-hidden="true">
            <Icon name="check" size={14} />
          </span>
          <span>Agent Review</span>
        </a>
        <nav className="shell__nav" aria-label="Primary">
          <a href="#/" aria-current={route.name === 'queue' ? 'page' : undefined}>
            Queue
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
          <span className="shell__user" aria-label="Signed in as Dana Whitfield">
            <span className="shell__avatar" aria-hidden="true">
              DW
            </span>
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

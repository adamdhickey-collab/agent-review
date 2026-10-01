import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import { Button } from '../Button/Button';
import './States.css';

/* The three states a region has when it has no content: nothing yet,
   not yet, and could not. Each says what happened and what to do, in one
   shape, so a screen never improvises one. The error state is a live
   region: it arrives after the fact, and a screen reader should hear it. */

interface StateBase {
  title: string;
  description?: ReactNode;
  /** Keep it small, for a panel rather than a page. */
  compact?: boolean;
}

export interface EmptyStateProps extends StateBase {
  icon?: IconName;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = 'inbox', title, description, action, compact }: EmptyStateProps) {
  return (
    <div className={['state', compact ? 'state--compact' : ''].filter(Boolean).join(' ')} data-state="empty">
      <Icon name={icon} size={20} className="state__icon" />
      <p className="state__title">{title}</p>
      {description ? <p className="state__desc">{description}</p> : null}
      {action ? (
        <Button variant="secondary" size="compact" onClick={action.onClick} className="state__action">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export interface LoadingStateProps extends StateBase {}

export function LoadingState({ title, description, compact }: LoadingStateProps) {
  return (
    <div className={['state', compact ? 'state--compact' : ''].filter(Boolean).join(' ')} data-state="loading" role="status" aria-live="polite">
      <Icon name="loader" size={20} className="state__icon" />
      <p className="state__title">{title}</p>
      {description ? <p className="state__desc">{description}</p> : null}
    </div>
  );
}

export interface ErrorStateProps extends StateBase {
  /** What to try: a retry, usually. */
  action?: { label: string; onClick: () => void };
  /** The message the system gave, in mono, for someone who can use it. */
  detail?: string;
}

export function ErrorState({ title, description, action, detail, compact }: ErrorStateProps) {
  return (
    <div className={['state', 'state--error', compact ? 'state--compact' : ''].filter(Boolean).join(' ')} data-state="error" role="alert">
      <Icon name="alert" size={20} className="state__icon" />
      <p className="state__title">{title}</p>
      {description ? <p className="state__desc">{description}</p> : null}
      {detail ? <code className="state__detail">{detail}</code> : null}
      {action ? (
        <Button variant="secondary" size="compact" onClick={action.onClick} className="state__action" leadingIcon="undo">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

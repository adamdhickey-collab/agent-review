import type { DetailsHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import './Disclosure.css';

/* A native details/summary, styled. The browser does the state, the
   keyboard and the screen reader; the chevron turns from CSS. Nothing to
   get wrong, which is why there is no custom accordion in this system. */

export interface DisclosureProps extends DetailsHTMLAttributes<HTMLDetailsElement> {
  summary: ReactNode;
  /** A short annotation beside the summary: a count, a status. */
  meta?: ReactNode;
  children: ReactNode;
}

export function Disclosure({ summary, meta, className, children, ...rest }: DisclosureProps) {
  return (
    <details className={['disclosure', className].filter(Boolean).join(' ')} {...rest}>
      <summary className="disclosure__summary">
        <Icon name="chevron-right" size={14} className="disclosure__chevron" />
        <span className="disclosure__title">{summary}</span>
        {meta ? <span className="disclosure__meta">{meta}</span> : null}
      </summary>
      <div className="disclosure__body">{children}</div>
    </details>
  );
}

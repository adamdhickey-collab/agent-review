import { useEffect, useRef } from 'react';
import type { Screen, Side } from '../../data/types';
import { CustomerTable } from '../../product/customers/CustomerTable';
import { InvoiceList } from '../../product/invoices/InvoiceList';

/* Which component renders for a screen and a side. The "before" column is
   the baseline on main; the "after" column is the agent's branch, kept
   verbatim under src/product/<screen>/after/ once the experiment has run
   (see docs/experiment/). Until then the after side renders the
   baseline, and the preview says so. */

let After: { CustomerTable?: typeof CustomerTable; InvoiceList?: typeof InvoiceList } = {};

export function registerAfter(components: typeof After) {
  After = { ...After, ...components };
}

export function hasAfter(screen: Screen): boolean {
  return screen === 'customers' ? Boolean(After.CustomerTable) : Boolean(After.InvoiceList);
}

export interface PreviewScreenProps {
  screen: Screen;
  side: Side;
  /** The screen should start with rows selected, where it supports it. */
  selection?: boolean;
  /** The data-finding value to mark as the target. */
  target?: string;
}

export function PreviewScreen({ screen, side, selection, target }: PreviewScreenProps) {
  const root = useRef<HTMLDivElement>(null);

  /* The target is marked after render, by attribute, so the product
     screens know nothing about findings: they only carry data-finding
     names on the elements a review might point at. */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll('[data-finding].is-target').forEach((n) => n.classList.remove('is-target'));
    if (target) el.querySelector(`[data-finding="${CSS.escape(target)}"]`)?.classList.add('is-target');
  }, [target, screen, side, selection]);

  const Customers = side === 'after' && After.CustomerTable ? After.CustomerTable : CustomerTable;
  const Invoices = side === 'after' && After.InvoiceList ? After.InvoiceList : InvoiceList;

  return (
    <div ref={root} data-screen={screen} data-side={side}>
      {screen === 'customers' ? <Customers key={`${side}-${selection}`} {...(selection ? { initialSelection: ['c_01HZK3', 'c_01HZKF', 'c_01HZKZ'] } : {})} /> : <Invoices />}
    </div>
  );
}

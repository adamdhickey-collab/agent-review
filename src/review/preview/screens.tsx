import { useEffect, useRef, type ComponentType } from 'react';
import type { Screen, Side } from '../../data/types';
import { CustomerTable } from '../../product/customers/CustomerTable';
import { CustomerTable as CustomersBase } from '../../product/customers/history/CustomerTable.base';
import { CustomerTable as CustomersRules } from '../../product/customers/history/CustomerTable.rules';
import { InvoiceList } from '../../product/invoices/InvoiceList';

/* Which component renders for a change, a screen and a side. The versions
   a review compares are the branches, verbatim, frozen under
   src/product/<screen>/history/ when the experiment ran (see
   docs/experiment/); the live screens under src/product/ are whatever
   main is now, which after a review is accepted is the branch merged. A
   change with no registered versions renders the live screens on both
   sides, and the preview says so. */

interface CustomersProps {
  initialSelection?: string[];
}

interface Versions {
  customers: { before: ComponentType<CustomersProps>; after: ComponentType<CustomersProps>; afterVersion: string };
  invoices: { before: ComponentType; after: ComponentType };
}

const VERSIONS: Record<string, Versions> = {
  /* Run 1: the agent with CLAUDE.md and the ui-quality skill in context. */
  'rv-2041': {
    /* The baseline takes no selection prop (it has no selection); the cast says so. */
    customers: { before: CustomersBase as ComponentType<CustomersProps>, after: CustomersRules, afterVersion: 'rules' },
    invoices: { before: InvoiceList, after: InvoiceList },
  },
};

export function registerVersions(changeId: string, versions: Versions) {
  VERSIONS[changeId] = versions;
}

export function hasVersions(changeId: string): boolean {
  return changeId in VERSIONS;
}

export interface PreviewScreenProps {
  changeId?: string;
  screen: Screen;
  side: Side;
  /** The screen should start with rows selected, where it supports it. */
  selection?: boolean;
  /** The data-finding value to mark as the target. */
  target?: string;
}

const SELECTED = ['c_01HZK3', 'c_01HZKF', 'c_01HZKZ'];

export function PreviewScreen({ changeId, screen, side, selection, target }: PreviewScreenProps) {
  const root = useRef<HTMLDivElement>(null);

  /* The target is marked after render, by attribute, so the product
     screens know nothing about findings: they only carry data-finding
     names on the elements a review might point at. */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll('[data-finding].is-target').forEach((n) => n.classList.remove('is-target'));
    if (target) el.querySelector(`[data-finding="${CSS.escape(target)}"]`)?.classList.add('is-target');
  }, [target, screen, side, selection, changeId]);

  const v = changeId ? VERSIONS[changeId] : undefined;
  const Customers = v ? v.customers[side] : CustomerTable;
  const Invoices = v ? v.invoices[side] : InvoiceList;
  const version = v && side === 'after' ? v.customers.afterVersion : 'base';

  return (
    <div ref={root} data-screen={screen} data-side={side} data-version={version}>
      {screen === 'customers' ? <Customers key={`${side}-${selection}`} initialSelection={selection ? SELECTED : undefined} /> : <Invoices />}
    </div>
  );
}

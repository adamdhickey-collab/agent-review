import { useLayoutEffect, useRef, type ComponentType } from 'react';
import type { Screen, Side } from '../../data/types';
import { CustomerTable } from '../../product/customers/CustomerTable';
import { CustomerTable as CustomersBase } from '../../product/customers/history/CustomerTable.base';
import { CustomerTable as CustomersRules } from '../../product/customers/history/CustomerTable.rules';
import { CustomerTable as CustomersNoRules } from '../../product/customers/history/CustomerTable.norules';
import { CustomerTable as CustomersDrift } from '../../product/customers/history/CustomerTable.drift';
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
  /* Run 2: the same request with the rules removed from the agent's context. */
  'rv-2042': {
    customers: { before: CustomersBase as ComponentType<CustomersProps>, after: CustomersNoRules, afterVersion: 'norules' },
    invoices: { before: InvoiceList, after: InvoiceList },
  },
  /* The seeded drift: the four drifts the workflow exists to catch, by hand. */
  'rv-2043': {
    customers: { before: CustomersBase as ComponentType<CustomersProps>, after: CustomersDrift, afterVersion: 'drift' },
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
     names on the elements a review might point at. Marked before paint,
     so the tag never shows in one place and then moves. */
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>('[data-finding].is-target').forEach((n) => {
      n.classList.remove('is-target');
      delete n.dataset.tag;
    });
    const t = target ? el.querySelector<HTMLElement>(`[data-finding="${CSS.escape(target)}"]`) : null;
    if (!t) return;
    t.classList.add('is-target');
    let live = true;
    const place = () => { if (live) placeTag(el, t); };
    place();
    /* The width changes the layout under the tag, and so can the fonts
       arriving. */
    const ro = new ResizeObserver(place);
    ro.observe(el);
    document.fonts.ready.then(place);
    return () => { live = false; ro.disconnect(); };
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

/* The tag naming a finding sits above its element, so it never covers
   what follows it. Above is not always clear: a band that sits flush
   under a heading, like the bulk-action bar, would put the tag over the
   heading. Then it sits on the band's top edge, half in the gap above and
   half in the band's own padding. The stylesheet owns both positions;
   this only tries them in order, measuring the tag where the stylesheet
   put it against every glyph and control on the screen, and keeps the
   first that covers nothing and is not cut off. */
const PLACES = ['above', 'edge'] as const;

function placeTag(screen: HTMLElement, target: HTMLElement) {
  const content = contentRects(screen);
  const clip = clipRect(target);
  for (const place of PLACES) {
    target.dataset.tag = place;
    const { box, words } = tagRect(target);
    if (contains(clip, words) && !content.some((r) => overlaps(r, box))) return;
  }
  target.dataset.tag = PLACES[0];
}

/* Where the tag is, in the page's coordinates: its whole box, and the
   words inside its padding, which are what must stay visible. The
   pseudo-element has no box of its own to ask, but its resolved offsets
   are relative to the target's padding box, in the frame's unscaled
   pixels, and its transform is the rest. */
function tagRect(target: HTMLElement) {
  const a = getComputedStyle(target, '::after');
  const at = target.getBoundingClientRect();
  const scale = target.offsetWidth ? at.width / target.offsetWidth : 1;
  const shift = new DOMMatrix(a.transform === 'none' ? undefined : a.transform);
  const left = at.left + (target.clientLeft + parseFloat(a.left) + shift.e) * scale;
  const top = at.top + (target.clientTop + parseFloat(a.top) + shift.f) * scale;
  const box = { left, top, right: left + parseFloat(a.width) * scale, bottom: top + parseFloat(a.height) * scale };
  const words = {
    left: box.left + parseFloat(a.paddingLeft) * scale,
    top: box.top + parseFloat(a.paddingTop) * scale,
    right: box.right - parseFloat(a.paddingRight) * scale,
    bottom: box.bottom - parseFloat(a.paddingBottom) * scale,
  };
  return { box, words };
}

/* The part of the page the tag can show in: every box between the target
   and the page that hides its overflow, intersected. */
function clipRect(target: HTMLElement): Box {
  let clip: Box = { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity };
  for (let p = target.parentElement; p; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
    const r = p.getBoundingClientRect();
    clip = { left: Math.max(clip.left, r.left), top: Math.max(clip.top, r.top), right: Math.min(clip.right, r.right), bottom: Math.min(clip.bottom, r.bottom) };
  }
  return clip;
}

/* Everything on the screen a tag could cover: each line of text, as the
   glyphs sit rather than as the cell holding them, and each control and
   icon. */
function contentRects(screen: HTMLElement) {
  const rects: DOMRect[] = [];
  const walker = document.createTreeWalker(screen, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue;
    range.selectNodeContents(n);
    rects.push(...range.getClientRects());
  }
  screen.querySelectorAll('input, svg, img').forEach((e) => rects.push(e.getBoundingClientRect()));
  return rects.filter((r) => r.width > 0 && r.height > 0);
}

type Box = { left: number; top: number; right: number; bottom: number };

function overlaps(a: Box, b: Box) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function contains(outer: Box, inner: Box) {
  return inner.left >= outer.left && inner.right <= outer.right && inner.top >= outer.top && inner.bottom <= outer.bottom;
}

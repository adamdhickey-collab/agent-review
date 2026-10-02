/* The finding's mark: a box laid over the part of the target that shows,
   drawn in the preview frame rather than on the target. On the target, it
   was the product's to hide: a section that clips its overflow cut off a
   toolbar's outline on three sides and its tag entirely, and a sticky
   table head painted over a bar's lower edge. In the frame, above the
   screen, nothing in the product can, and the product's own elements are
   never restyled for a review. */

type Box = { left: number; top: number; right: number; bottom: number };

/* Draws the mark over the element named `target`, or hides it when there
   is none on the screen (a finding with no element, or one the reviewer
   has since changed the screen away from). */
export function drawMark(frame: HTMLElement, mark: HTMLElement, target: string | undefined) {
  const el = target ? frame.querySelector<HTMLElement>(`[data-finding="${CSS.escape(target)}"]`) : null;
  const seen = el ? visibleRect(el, frame) : null;
  if (!seen) {
    mark.hidden = true;
    delete mark.dataset.tag;
    return;
  }
  /* The frame is scaled to fit its column, and the mark is inside it, so
     the mark's box is in the frame's own unscaled pixels. */
  const f = frame.getBoundingClientRect();
  const scale = frame.offsetWidth ? f.width / frame.offsetWidth : 1;
  mark.hidden = false;
  mark.style.left = `${(seen.left - f.left) / scale - frame.clientLeft}px`;
  mark.style.top = `${(seen.top - f.top) / scale - frame.clientTop}px`;
  mark.style.width = `${(seen.right - seen.left) / scale}px`;
  mark.style.height = `${(seen.bottom - seen.top) / scale}px`;
  placeTag(frame, mark);
}

/* The part of the element the screen lets a reader see: its box, cut by
   every box between it and the frame that hides its overflow. */
function visibleRect(el: HTMLElement, frame: HTMLElement): Box | null {
  const r = el.getBoundingClientRect();
  let box: Box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  for (let p = el.parentElement; p && p !== frame; p = p.parentElement) box = clipBy(box, p);
  return box.right > box.left && box.bottom > box.top ? box : null;
}

/* The tag naming a finding sits above the mark, so it never covers what
   follows the element. Above is not always clear: a band that sits flush
   under a heading, like the bulk-action bar, would put the tag over the
   heading. Then it sits on the mark's top edge, half in the gap above and
   half in the band's own padding. The stylesheet owns both positions;
   this only tries them in order, measuring the tag where the stylesheet
   put it against every glyph and control on the screen, and keeps the
   first that covers nothing and is not cut off. */
const PLACES = ['above', 'edge'] as const;

function placeTag(frame: HTMLElement, mark: HTMLElement) {
  const content = contentRects(frame);
  let clip: Box = { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity };
  for (let p = mark.parentElement; p; p = p.parentElement) clip = clipBy(clip, p);
  for (const place of PLACES) {
    mark.dataset.tag = place;
    const { box, words } = tagRect(mark);
    if (contains(clip, words) && !content.some((r) => overlaps(r, box))) return;
  }
  mark.dataset.tag = PLACES[0];
}

/* Where the tag is, in the page's coordinates: its whole box, and the
   words inside its padding, which are what must stay visible. The
   pseudo-element has no box of its own to ask, but its resolved offsets
   are relative to the mark, in the frame's unscaled pixels, and its
   transform is the rest. */
function tagRect(mark: HTMLElement) {
  const a = getComputedStyle(mark, '::after');
  const at = mark.getBoundingClientRect();
  const scale = mark.offsetWidth ? at.width / mark.offsetWidth : 1;
  const shift = new DOMMatrix(a.transform === 'none' ? undefined : a.transform);
  const left = at.left + (parseFloat(a.left) + shift.e) * scale;
  const top = at.top + (parseFloat(a.top) + shift.f) * scale;
  const box = { left, top, right: left + parseFloat(a.width) * scale, bottom: top + parseFloat(a.height) * scale };
  const words = {
    left: box.left + parseFloat(a.paddingLeft) * scale,
    top: box.top + parseFloat(a.paddingTop) * scale,
    right: box.right - parseFloat(a.paddingRight) * scale,
    bottom: box.bottom - parseFloat(a.paddingBottom) * scale,
  };
  return { box, words };
}

/* Everything on the screen a tag could cover: each line of text, as the
   glyphs sit rather than as the cell holding them, and each control and
   icon. */
function contentRects(frame: HTMLElement) {
  const rects: DOMRect[] = [];
  const walker = document.createTreeWalker(frame, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue;
    range.selectNodeContents(n);
    rects.push(...range.getClientRects());
  }
  frame.querySelectorAll('input, svg, img').forEach((e) => rects.push(e.getBoundingClientRect()));
  return rects.filter((r) => r.width > 0 && r.height > 0);
}

/* A box cut by an element, if that element hides its overflow. */
function clipBy(box: Box, p: HTMLElement): Box {
  const cs = getComputedStyle(p);
  if (cs.overflowX === 'visible' && cs.overflowY === 'visible') return box;
  const r = p.getBoundingClientRect();
  return { left: Math.max(box.left, r.left), top: Math.max(box.top, r.top), right: Math.min(box.right, r.right), bottom: Math.min(box.bottom, r.bottom) };
}

function overlaps(a: Box, b: Box) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function contains(outer: Box, inner: Box) {
  return inner.left >= outer.left && inner.right <= outer.right && inner.top >= outer.top && inner.bottom <= outer.bottom;
}

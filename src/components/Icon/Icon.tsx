import type { SVGProps } from 'react';

/* The icon set, drawn inline so an icon is one element with no request
   behind it. Drawn on a 24 grid, currentColor, with a stroke set for the
   size it is shown at (STROKE, below). Every icon is decorative by default
   (aria-hidden); a component that needs the icon to carry meaning gives it
   a `label`, which renders a <title>.

   Two drawings live here. PATHS is the line set, for everything that is
   an action or an object. STATUS, below it, is the handful of marks that
   say how something went, and those are drawn solid, on their own grid. */

const PATHS = {
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  minus: 'M5 12h14',
  plus: 'M12 5v14M5 12h14',
  'chevron-down': 'm6 9 6 6 6-6',
  'chevron-right': 'm9 6 6 6-6 6',
  'chevron-left': 'm15 6-6 6 6 6',
  'arrow-left': 'M19 12H5m7-7-7 7 7 7',
  'arrow-right': 'M5 12h14m-7-7 7 7-7 7',
  'corner-up-left': 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v5',
  external: 'M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5',
  alert: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  info: 'M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  'circle-check': 'm9 12 2 2 4-4M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  'circle-x': 'm15 9-6 6m0-6 6 6M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  circle: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  loader: 'M12 2v4m0 12v4M4.9 4.9l2.8 2.8m8.6 8.6 2.8 2.8M2 12h4m12 0h4M4.9 19.1l2.8-2.8m8.6-8.6 2.8-2.8',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  code: 'm16 18 6-6-6-6M8 6l-6 6 6 6',
  layers: 'm12 2 10 5-10 5L2 7l10-5Zm-10 10 10 5 10-5M2 17l10 5 10-5',
  search: 'M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  dots: 'M12 12h.01M19 12h.01M5 12h.01',
  filter: 'M22 3H2l8 9.5V19l4 2v-8.5L22 3Z',
  play: 'm6 4 14 8-14 8V4Z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z',
  'git-branch': 'M6 3v12m12-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12-12a9 9 0 0 1-9 9',
  contrast: 'M12 2a10 10 0 1 0 0 20V2Z M22 12a10 10 0 0 1-10 10',
  ruler: 'M21.3 15.3 8.7 2.7a1 1 0 0 0-1.4 0L2.7 7.3a1 1 0 0 0 0 1.4l12.6 12.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4ZM7.5 10.5l2-2m1 5 2-2m1 5 2-2',
  bot: 'M12 8V4H8m8 0h-4M4 12a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6Zm-2 2v2m20-2v2M9 15h.01M15 15h.01',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m12-14a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  clock: 'M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  columns: 'M12 3v18M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z',
  smartphone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm5 16h.01',
  monitor: 'M3 4h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm5 16h8m-4-4v4',
  tablet: 'M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 16h.01',
  'arrow-up-right': 'M7 17 17 7M7 7h10v10',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z',
  send: 'm22 2-7 20-4-9-9-4 20-7Zm0 0L11 13',
  undo: 'M3 7v6h6M3 13a9 9 0 1 0 3-6.7L3 9',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z',
  'message-question': 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2ZM9.6 8.4a2.4 2.4 0 1 1 3.3 2.2c-.6.3-.9.7-.9 1.3M12 14.2h.01',
} as const;

/* The line set's stroke, by the size it is shown at. It was one stroke,
   1.75 on the 24 grid, at every size, which scales with the icon: 1.17px
   at 16, 1.02px at 14 and 0.88px at 12. Most of the line set is shown at
   14 and 12 (a compact Button's icon, a Badge's, the shell's), so most of
   it was a hairline in a muted ink, and the delegated work's "Reset the
   demo" was the one a reader named: a ring of 1px in grey on a grey strip.
   The status marks met the same problem first and were redrawn for their
   size (STATUS, below); these keep their drawings and take a stroke that
   lands near 1.5px wherever they are shown: 1.5px at 16, 1.46px at 14,
   1.67px at 20, and 1.25px at 12, where 1.5px would close up a glyph that
   small. Measured by rendering every name at every size in the Icon's
   AllIcons story before and after; no drawing changed. */
const STROKE: Record<NonNullable<IconProps['size']>, number> = { 12: 2.5, 14: 2.5, 16: 2.25, 20: 2 };

/* The status marks: what a check answered, and how much a finding matters.
   They are read at 14 and 16px, often with no word beside them (a queue
   row is five of them in a line), and the line set is the wrong drawing
   for that. A 24-grid outline at 14px puts a 1.75 stroke down as 1.02px
   and the tick inside its ring as 3.5px across; passed and failed are then
   the same thin ring, told apart by a speck and a colour.

   So these are drawn for the size they are used at: a 16 grid, a solid
   shape in the state's ink, and the mark cut out of it, 1.7 wide. The cut
   is a real hole (one path, even-odd), not a white mark, so it takes the
   colour of whatever the icon sits on: a selected row, a tinted badge.

   One shape per state, so the state survives without its colour: a disc
   passed, a triangle wants a look, an octagon stops, an open arc is still
   running, an empty dashed ring did not run. A note is a disc with an i.
   The outline circle-check, circle-x, alert and info stay in the line set
   for the places that draw them large (an empty state, a region's error). */
const DISC = 'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Z';
const TRIANGLE = 'M9.04 2.3l5.9 10.1a1.2 1.2 0 0 1-1.04 1.8H2.1a1.2 1.2 0 0 1-1.04-1.8l5.9-10.1a1.2 1.2 0 0 1 2.08 0Z';
const OCTAGON =
  'M5.5 1.1h5a.6.6 0 0 1 .42.18l3.8 3.8a.6.6 0 0 1 .18.42v5a.6.6 0 0 1-.18.42l-3.8 3.8a.6.6 0 0 1-.42.18h-5a.6.6 0 0 1-.42-.18l-3.8-3.8a.6.6 0 0 1-.18-.42v-5a.6.6 0 0 1 .18-.42l3.8-3.8a.6.6 0 0 1 .42-.18Z';
const CUT_CHECK = 'M4.15 8.95 6.35 11.15a.85.85 0 0 0 1.22-.02l4.3-4.6a.85.85 0 0 0-1.24-1.16L6.93 9.33 5.35 7.75a.85.85 0 0 0-1.2 1.2Z';
const CUT_BANG = 'M7.15 6.1a.85.85 0 0 1 1.7 0v3.3a.85.85 0 0 1-1.7 0ZM8 10.8a.95.95 0 1 1 0 1.9a.95.95 0 1 1 0-1.9Z';
const CUT_CROSS =
  'M8 6.8 6.35 5.15a.85.85 0 0 0-1.2 1.2L6.8 8 5.15 9.65a.85.85 0 0 0 1.2 1.2L8 9.2l1.65 1.65a.85.85 0 0 0 1.2-1.2L9.2 8l1.65-1.65a.85.85 0 0 0-1.2-1.2Z';
const CUT_INFO = 'M8 3.95a.95.95 0 1 1 0 1.9a.95.95 0 1 1 0-1.9ZM7.15 7.6a.85.85 0 0 1 1.7 0v3.5a.85.85 0 0 1-1.7 0Z';

const STATUS_SOLID = {
  'status-passed': DISC + CUT_CHECK,
  'status-changed': TRIANGLE + CUT_BANG,
  'status-failed': OCTAGON + CUT_CROSS,
  'status-note': DISC + CUT_INFO,
} as const;

/* The three states that are not an answer are not solid: they are rings,
   which is the difference a reader should see first. Inconclusive is the
   one that ran: a whole ring, with a question mark where an answer would
   be, against skipped's dashed and empty one. */
const STATUS_RING = ['status-running', 'status-skipped', 'status-inconclusive'] as const;

type SolidName = keyof typeof STATUS_SOLID;
type RingName = (typeof STATUS_RING)[number];

export type IconName = keyof typeof PATHS | SolidName | RingName;

export const ICON_NAMES = [...Object.keys(PATHS), ...Object.keys(STATUS_SOLID), ...STATUS_RING] as IconName[];

const isSolid = (name: IconName): name is SolidName => name in STATUS_SOLID;
const isRing = (name: IconName): name is RingName => (STATUS_RING as readonly string[]).includes(name);

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Accessible name. Without one the icon is decorative and hidden. */
  label?: string;
  size?: 12 | 14 | 16 | 20;
}

export function Icon({ name, label, size = 16, className, ...rest }: IconProps) {
  const spins = name === 'loader' || name === 'status-running';
  const shared = {
    width: size,
    height: size,
    'aria-hidden': label ? undefined : true,
    role: label ? 'img' : undefined,
    focusable: 'false' as const,
    className: ['icon', spins ? 'icon--spin' : '', className].filter(Boolean).join(' '),
    'data-icon': name,
    ...rest,
  };
  const title = label ? <title>{label}</title> : null;

  if (isSolid(name)) {
    return (
      <svg viewBox="0 0 16 16" fill="currentColor" {...shared}>
        {title}
        <path fillRule="evenodd" d={STATUS_SOLID[name]} />
      </svg>
    );
  }

  if (isRing(name)) {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" {...shared}>
        {title}
        {name === 'status-running' ? (
          <>
            <circle cx={8} cy={8} r={6} strokeWidth={2} opacity={0.25} />
            <path d="M8 2a6 6 0 0 1 6 6" strokeWidth={2} />
          </>
        ) : name === 'status-inconclusive' ? (
          <>
            <circle cx={8} cy={8} r={6} strokeWidth={1.7} />
            <path d="M6.3 6.4a1.75 1.75 0 1 1 2.5 1.55c-.5.25-.8.55-.8 1.1v.2M8 11.15h.01" strokeWidth={1.5} strokeLinejoin="round" />
          </>
        ) : (
          <circle cx={8} cy={8} r={6} strokeWidth={1.7} strokeDasharray="2.55 2.16" />
        )}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE[size]}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...shared}
    >
      {title}
      <path d={PATHS[name]} />
    </svg>
  );
}

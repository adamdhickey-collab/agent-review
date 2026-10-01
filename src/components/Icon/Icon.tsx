import type { SVGProps } from 'react';

/* The icon set, drawn inline so an icon is one element with no request
   behind it. 16 on a 24 grid, 1.75 stroke, currentColor. Every icon is
   decorative by default (aria-hidden); a component that needs the icon to
   carry meaning gives it a `label`, which renders a <title>. */

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
  'circle-dot': 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 12h.01',
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
} as const;

export type IconName = keyof typeof PATHS;

export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Accessible name. Without one the icon is decorative and hidden. */
  label?: string;
  size?: 12 | 14 | 16 | 20;
}

export function Icon({ name, label, size = 16, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      focusable="false"
      className={['icon', name === 'loader' ? 'icon--spin' : '', className].filter(Boolean).join(' ')}
      data-icon={name}
      {...rest}
    >
      {label ? <title>{label}</title> : null}
      <path d={PATHS[name]} />
    </svg>
  );
}

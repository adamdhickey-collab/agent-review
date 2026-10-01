/* The token names, typed, read from tokens.css at build time by the token
   lint and at runtime by Agent Review when it names a deviation. This file
   holds no values: tokens.css is the single source, and a value quoted in
   TypeScript would be a second one.

   Grouped the way a reviewer thinks about them, so a finding can say "a
   spacing token exists for this" rather than "a token exists". */

export const TOKEN_GROUPS = {
  type: [
    '--font-ui', '--font-mono',
    '--text-xs', '--text-sm', '--text-md', '--text-lg', '--text-xl',
    '--leading-tight', '--leading-ui', '--leading-body',
    '--weight-regular', '--weight-medium', '--weight-semibold',
    '--tracking-caps',
  ],
  space: ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-8'],
  control: ['--control-height', '--control-height-compact', '--control-padding-x', '--control-padding-x-compact'],
  shape: ['--radius-sm', '--radius-md', '--border-width'],
  ground: ['--color-canvas', '--color-surface', '--color-surface-sunken', '--color-surface-hover'],
  line: ['--color-border', '--color-border-control'],
  ink: ['--color-text', '--color-text-secondary', '--color-text-muted', '--color-text-on-accent'],
  accent: ['--color-accent', '--color-accent-hover', '--color-accent-subtle'],
  meaning: [
    '--color-success', '--color-success-subtle',
    '--color-warning', '--color-warning-subtle',
    '--color-danger', '--color-danger-subtle',
  ],
  diff: ['--color-diff-add', '--color-diff-add-ink', '--color-diff-remove', '--color-diff-remove-ink'],
  elevation: ['--shadow-menu', '--color-scrim'],
  focus: ['--focus-ring-color', '--focus-ring-width', '--focus-ring-offset'],
  motion: ['--motion-fast', '--motion-base', '--motion-ambient', '--ease'],
} as const;

export type TokenGroup = keyof typeof TOKEN_GROUPS;
export type TokenName = (typeof TOKEN_GROUPS)[TokenGroup][number];

export const TOKEN_NAMES: readonly TokenName[] = Object.values(TOKEN_GROUPS).flat();

/** Which group a token belongs to, for a finding that wants to say so. */
export function tokenGroup(name: string): TokenGroup | undefined {
  for (const [group, names] of Object.entries(TOKEN_GROUPS)) {
    if ((names as readonly string[]).includes(name)) return group as TokenGroup;
  }
  return undefined;
}

/** The spacing scale in pixels, for a finding that maps a literal onto it.
    These are the values in tokens.css read back, not a second declaration:
    the lint checks the two agree. */
export const SPACE_PX: Record<(typeof TOKEN_GROUPS.space)[number], number> = {
  '--space-1': 4,
  '--space-2': 8,
  '--space-3': 12,
  '--space-4': 16,
  '--space-5': 20,
  '--space-6': 24,
  '--space-8': 32,
};

/** The nearest spacing token to a pixel value, and whether it is exact. A
    deviation report uses this to say "10px: no token; 8 (--space-2) or
    12 (--space-3)". */
export function nearestSpace(px: number): { exact: TokenName | null; below: TokenName | null; above: TokenName | null } {
  const entries = Object.entries(SPACE_PX) as [TokenName, number][];
  const exact = entries.find(([, v]) => v === px)?.[0] ?? null;
  const below = entries.filter(([, v]) => v < px).at(-1)?.[0] ?? null;
  const above = entries.find(([, v]) => v > px)?.[0] ?? null;
  return { exact, below, above };
}

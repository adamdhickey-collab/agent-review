import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from '../components/Button/Button';
import { TOKEN_GROUPS, type TokenGroup, type TokenName } from './tokens';

/* Read a token's value the way the browser resolved it, rather than quoting
   tokens.css a second time. tokens.ts holds no values on purpose. */
function useTokenValues(names: readonly TokenName[]): Record<string, string> {
  const [values] = useState<Record<string, string>>(() => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(names.map((n) => [n, style.getPropertyValue(n).trim()]));
  });
  return values;
}

const name: CSSProperties = { fontSize: 'var(--text-sm)' };
const value: CSSProperties = { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' };
const heading: CSSProperties = { fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' };
const section: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' };

const COLOR_GROUPS: TokenGroup[] = ['ground', 'line', 'ink', 'accent', 'meaning', 'diff'];
const COLOR_NAMES: TokenName[] = COLOR_GROUPS.flatMap((g) => [...TOKEN_GROUPS[g]]);

function Swatches() {
  const values = useTokenValues(COLOR_NAMES);
  return (
    <div style={section}>
      {COLOR_GROUPS.map((group) => (
        <section key={group}>
          <h2 style={heading}>{group}</h2>
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))', gap: 'var(--space-3)' }}>
            {TOKEN_GROUPS[group].map((n) => (
              <li key={n} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <span
                  aria-hidden="true"
                  style={{ height: 'var(--space-8)', borderRadius: 'var(--radius-sm)', background: `var(${n})`, boxShadow: 'inset 0 0 0 var(--border-width) var(--color-border)' }}
                />
                <code style={name}>{n}</code>
                <code style={value}>{values[n] ?? ''}</code>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const SPACE_NAMES = TOKEN_GROUPS.space;

function SpacingScale() {
  const values = useTokenValues(SPACE_NAMES);
  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {SPACE_NAMES.map((n) => (
        <li key={n} style={{ display: 'grid', gridTemplateColumns: '8rem 4rem 1fr', alignItems: 'center', gap: 'var(--space-3)' }}>
          <code style={name}>{n}</code>
          <code style={value}>{values[n] ?? ''}</code>
          <span aria-hidden="true" style={{ display: 'block', height: 'var(--space-3)', width: `var(${n})`, background: 'var(--color-accent)', borderRadius: 'var(--radius-sm)' }} />
        </li>
      ))}
    </ul>
  );
}

const SIZE_NAMES = ['--text-xs', '--text-sm', '--text-md', '--text-lg', '--text-xl'] as const satisfies readonly TokenName[];
const WEIGHT_NAMES = ['--weight-regular', '--weight-medium', '--weight-semibold'] as const satisfies readonly TokenName[];

function TypeSpecimens() {
  const values = useTokenValues([...SIZE_NAMES, ...WEIGHT_NAMES, '--font-ui', '--font-mono']);
  return (
    <div style={section}>
      <section>
        <h2 style={heading}>Size</h2>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {SIZE_NAMES.map((n) => (
            <li key={n} style={{ display: 'grid', gridTemplateColumns: '8rem 4rem 1fr', alignItems: 'baseline', gap: 'var(--space-3)' }}>
              <code style={name}>{n}</code>
              <code style={value}>{values[n] ?? ''}</code>
              <span style={{ fontSize: `var(${n})`, lineHeight: 'var(--leading-ui)' }}>Twelve customers, three past due, one archived this week.</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 style={heading}>Weight</h2>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {WEIGHT_NAMES.map((n) => (
            <li key={n} style={{ display: 'grid', gridTemplateColumns: '8rem 4rem 1fr', alignItems: 'baseline', gap: 'var(--space-3)' }}>
              <code style={name}>{n}</code>
              <code style={value}>{values[n] ?? ''}</code>
              <span style={{ fontWeight: `var(${n})` }}>Twelve customers, three past due, one archived this week.</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 style={heading}>Family</h2>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <li style={{ display: 'grid', gridTemplateColumns: '8rem 1fr', gap: 'var(--space-3)' }}>
            <code style={name}>--font-ui</code>
            <span>Everything a person wrote: labels, names, findings.</span>
          </li>
          <li style={{ display: 'grid', gridTemplateColumns: '8rem 1fr', gap: 'var(--space-3)' }}>
            <code style={name}>--font-mono</code>
            <code>Everything a machine wrote: e4f1a9c, --space-3, GET /api/reviews 502</code>
          </li>
        </ul>
      </section>
    </div>
  );
}

function Radii() {
  const values = useTokenValues(TOKEN_GROUPS.shape);
  return (
    <ul style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
      {(['--radius-sm', '--radius-md'] as const).map((n) => (
        <li key={n} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span
            aria-hidden="true"
            style={{ width: '6rem', height: '4rem', borderRadius: `var(${n})`, border: 'var(--border-width) solid var(--color-border-control)', background: 'var(--color-surface)' }}
          />
          <code style={name}>{n}</code>
          <code style={value}>{values[n] ?? ''}</code>
        </li>
      ))}
      <li style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <span aria-hidden="true" style={{ width: '6rem', height: '4rem', borderTop: 'var(--border-width) solid var(--color-border-control)' }} />
        <code style={name}>--border-width</code>
        <code style={value}>{values['--border-width'] ?? ''}</code>
      </li>
    </ul>
  );
}

function Shadow() {
  const values = useTokenValues(TOKEN_GROUPS.elevation);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'flex-start', padding: 'var(--space-4) 0' }}>
      <div style={{ width: '14rem', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', boxShadow: 'var(--shadow-menu)' }}>
        <ul style={{ display: 'flex', flexDirection: 'column' }}>
          {['Approve', 'Request changes', 'Archive'].map((item) => (
            <li key={item} style={{ padding: 'var(--space-1) var(--space-2)' }}>{item}</li>
          ))}
        </ul>
      </div>
      <code style={name}>--shadow-menu</code>
      <code style={value}>{values['--shadow-menu'] ?? ''}</code>
    </div>
  );
}

function FocusRing() {
  const values = useTokenValues(TOKEN_GROUPS.focus);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
      <Button variant="primary">Approve change</Button>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {TOKEN_GROUPS.focus.map((n) => (
          <li key={n} style={{ display: 'grid', gridTemplateColumns: '10rem 1fr', gap: 'var(--space-3)' }}>
            <code style={name}>{n}</code>
            <code style={value}>{values[n] ?? ''}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

const meta = {
  title: 'System/Tokens',
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The token layer, read back from the browser: every value shown here is getComputedStyle on the root, not a second copy of tokens.css. One light canvas, one accent, color for meaning only; a 4px spacing grid; four text sizes with 13 as the body because the product is read at arm\'s length for hours; two radii; one shadow, for a menu; one focus ring every control inherits. This page is what Agent Review names a deviation against, so a token that is not here is a token the system does not have.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Colors: Story = { render: () => <Swatches /> };

export const Spacing: Story = { render: () => <SpacingScale /> };

export const Type: Story = { render: () => <TypeSpecimens /> };

export const RadiiAndBorder: Story = { name: 'Radii', render: () => <Radii /> };

export const ShadowMenu: Story = { name: 'Shadow', render: () => <Shadow /> };

export const Focus: Story = {
  render: () => <FocusRing />,
  parameters: {
    docs: { description: { story: 'Tabs to the sample button so the ring is visible. It is one outline, offset so it never touches the control\'s own border, drawn by the base stylesheet on every interactive element.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Approve change' })).toHaveFocus();
  },
};

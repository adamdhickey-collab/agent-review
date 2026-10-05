import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import { Icon, ICON_NAMES, IconSetContext, REVIEW_PX, type IconProps, type IconSet } from './Icon';

/* Every icon at the four steps it is shown at, in the review's family and
   in the product's set, so the two can be compared and a name added to one
   and not the other is seen. */

const SIZES: NonNullable<IconProps['size']>[] = [12, 14, 16, 20];

const meta = {
  title: 'System/Icon',
  component: Icon,
  args: { name: 'undo' },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'An icon, inline SVG and currentColor, decorative unless it has a label. The review draws one family, Phosphor, in two weights: solid for what carries meaning or state, bold for chrome and direction (family.ts, written by scripts/icons.mjs). The product, Relay, keeps the hand-drawn line set and status marks it was measured with, and gets them from IconSetContext, which the preview frame provides. `size` names a step (12, 14, 16, 20); the review draws each a step larger, because its icons are solid shapes with air inside the grid and the old sizes read as small.',
      },
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

function Sheet({ set, children }: { set: IconSet; children?: ReactNode }) {
  return (
    <IconSetContext.Provider value={set}>
      <table style={{ borderCollapse: 'collapse', color: 'var(--color-text)' }}>
        <thead>
          <tr>
            <th scope="col" style={{ textAlign: 'left', padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Name
            </th>
            {SIZES.map((s) => (
              <th key={s} scope="col" style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                {set === 'review' ? `${s} → ${REVIEW_PX[s]}px` : `${s}px`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ICON_NAMES.map((name) => (
            <tr key={name}>
              <th scope="row" style={{ textAlign: 'left', padding: 'var(--space-1) var(--space-3)', fontWeight: 'var(--weight-regular)' }}>
                <code style={{ fontSize: 'var(--text-sm)' }}>{name}</code>
              </th>
              {SIZES.map((s) => (
                <td key={s} style={{ padding: 'var(--space-1) var(--space-3)', textAlign: 'center' }}>
                  <Icon name={name} size={s} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {children}
    </IconSetContext.Provider>
  );
}

export const Family: Story = {
  render: () => <Sheet set="review" />,
  parameters: {
    docs: { description: { story: 'Every icon in the review’s family at the four steps, with the pixels each is drawn at. Solid icons are the ones that carry meaning or state; bold line icons are chrome and direction. Read them against each other: one corner radius, one weight per kind, one visual size.' } },
  },
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByText('undo').closest('tr')!;
    const widths = Array.from(row.querySelectorAll('svg')).map((svg) => Number(svg.getAttribute('width')));
    await expect(widths).toEqual(SIZES.map((s) => REVIEW_PX[s]));
    const all = Array.from(canvasElement.querySelectorAll('svg'));
    await expect(all.length).toBe(ICON_NAMES.length * SIZES.length);
    for (const svg of all) {
      await expect(['fill', 'bold']).toContain(svg.getAttribute('data-weight'));
      await expect(svg.style.getPropertyValue('--icon-size')).toBe(`${svg.getAttribute('width')}px`);
    }
  },
};

export const ProductSet: Story = {
  render: () => <Sheet set="product" />,
  parameters: {
    docs: { description: { story: 'The set Relay is drawn with, in the preview frame and the product’s own stories: a line set on a 24 grid with a stroke chosen per size, and the status marks on a 16 grid. Unchanged. The frame is pixel-compared in the visual baselines, so an icon here is part of what the checks measured.' } },
  },
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByText('undo').closest('tr')!;
    const strokes = Array.from(row.querySelectorAll('svg')).map((svg) => Number(svg.getAttribute('stroke-width')) * (Number(svg.getAttribute('width')) / 24));
    for (const w of strokes) await expect(w).toBeGreaterThanOrEqual(1.25);
    await expect(Array.from(row.querySelectorAll('svg')).map((svg) => Number(svg.getAttribute('width')))).toEqual(SIZES);
  },
};

export const StatusMarks: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center', color: 'var(--color-text)' }}>
      {(['status-passed', 'status-changed', 'status-failed', 'status-note', 'status-inconclusive', 'status-skipped', 'status-running'] as const).map((n) => (
        <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <Icon name={n} size={16} />
          {n.replace('status-', '')}
        </span>
      ))}
    </div>
  ),
  parameters: {
    docs: { description: { story: 'How something went, one shape per state so it survives without its colour: a disc passed, a triangle wants a look, an octagon stops, a disc with an i is a note, a ring with a question mark ran and could not answer, a dashed ring did not run, an open arc is running. The first four are solid; the rings are the bold line weight, which is the difference a reader should see first.' } },
  },
};

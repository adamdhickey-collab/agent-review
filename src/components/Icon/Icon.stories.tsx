import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Icon, ICON_NAMES, type IconProps } from './Icon';

/* The line set at the four sizes it is shown at, so the stroke each size
   takes can be seen beside the others and against the text it sits in. */

const SIZES: NonNullable<IconProps['size']>[] = [12, 14, 16, 20];
const LINE = ICON_NAMES.filter((n) => !n.startsWith('status-'));

const meta = {
  title: 'System/Icon',
  component: Icon,
  args: { name: 'undo' },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'An icon, inline SVG and currentColor, decorative unless it has a label. The line set is drawn on a 24 grid and takes a stroke for the size it is shown at, so it lands near 1.5px everywhere (1.25px at 12, where more would close a glyph up). The status-* marks are a second drawing, solid on a 16 grid; TestStatus has them in use.',
      },
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AtEverySize: Story = {
  render: () => (
    <table style={{ borderCollapse: 'collapse', color: 'var(--color-text)' }}>
      <thead>
        <tr>
          <th scope="col" style={{ textAlign: 'left', padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Name
          </th>
          {SIZES.map((s) => (
            <th key={s} scope="col" style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              {s}px
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {LINE.map((name) => (
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
  ),
  parameters: {
    docs: { description: { story: 'Every line icon at 12, 14, 16 and 20. The stroke is set per size rather than scaled with the drawing: one 1.75 stroke on the 24 grid was a 1px line at 14, which is where most of these are shown.' } },
  },
  play: async ({ canvasElement }) => {
    const reset = within(canvasElement).getByText('undo').closest('tr')!;
    const widths = Array.from(reset.querySelectorAll('svg')).map((svg) => Number(svg.getAttribute('stroke-width')) * (Number(svg.getAttribute('width')) / 24));
    for (const w of widths) await expect(w).toBeGreaterThanOrEqual(1.25);
  },
};

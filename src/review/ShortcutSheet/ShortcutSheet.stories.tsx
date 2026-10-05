import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SHORTCUTS, setSingleKeys, singleKeysOn } from '../../app/shortcuts';
import { ShortcutSheet } from './ShortcutSheet';

const meta = {
  title: 'Review/ShortcutSheet',
  component: ShortcutSheet,
  args: { open: true, onClose: fn() },
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The list of keyboard shortcuts, in the browser’s own modal dialog: the focus trap, Escape, the inert page behind it and focus returned to where it was are the platform’s. What it lists is app/shortcuts.ts, which is also what answers the keys, so the list is the behaviour. Under the list: the switch for single-key shortcuts (WCAG 2.1.4 asks for one), and the plain statement that a decision has no shortcut.',
      },
    },
  },
} satisfies Meta<typeof ShortcutSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement.ownerDocument.body).getByRole('dialog', { name: 'Keyboard shortcuts' });
    /* Every shortcut the app answers is a row, and nothing else is. */
    await expect(dialog.querySelectorAll('.shortcuts__row').length).toBe(SHORTCUTS.length);
    for (const s of SHORTCUTS) await expect(within(dialog).getByText(s.does)).toBeInTheDocument();
    await expect(within(dialog).getByText(/have no shortcut/)).toBeInTheDocument();
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  parameters: { docs: { description: { story: 'The sheet in the dark theme, with axe on the keycaps and the muted lines.' } } },
};

export const SwitchOffSingleKeys: Story = {
  parameters: {
    docs: { description: { story: 'Unchecks the switch, which turns the question mark, J and K off for this person and remembers it, then checks it again so the next story starts as a person would.' } },
  },
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement.ownerDocument.body).getByRole('dialog', { name: 'Keyboard shortcuts' });
    const box = within(dialog).getByRole('checkbox', { name: /Single-key shortcuts/ });
    await expect(box).toBeChecked();
    await userEvent.click(within(dialog).getByText(/Single-key shortcuts/));
    await expect(box).not.toBeChecked();
    await expect(singleKeysOn()).toBe(false);
    await userEvent.click(within(dialog).getByText(/Single-key shortcuts/));
    await expect(singleKeysOn()).toBe(true);
    setSingleKeys(true);
  },
};

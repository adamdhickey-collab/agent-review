import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { setSingleKeys } from '../../app/shortcuts';
import { Shell } from './Shell';

const meta = {
  title: 'Review/Shell',
  component: Shell,
  args: {
    route: { name: 'delegation' },
    children: <p style={{ padding: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>The screen goes here.</p>,
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The chrome: one quiet bar on the page’s own ground. The place you are in is said by its ink and by the line under it, the line a selected tab carries, with no filled shape, so the first thing with weight on a screen is the screen’s heading. The theme toggle is a pressed button: pressed is dark. Until it is pressed the theme is the reader’s system setting; a choice is remembered. This story, like the app, follows the system setting until the toggle is used.',
      },
    },
  },
} satisfies Meta<typeof Shell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnTheDelegatedWork: Story = {
  play: async ({ canvasElement }) => {
    const here = within(canvasElement).getByRole('link', { name: 'Delegated work' });
    await expect(here).toHaveAttribute('aria-current', 'page');
  },
};

export const OnTheReviews: Story = {
  args: { route: { name: 'queue' } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: 'Reviews' })).toHaveAttribute('aria-current', 'page');
  },
};

export const ThemeToggle: Story = {
  parameters: {
    docs: { description: { story: 'Presses the toggle twice. Each press flips aria-pressed, writes the choice to the root as data-theme, and with it the color-scheme every token reads. The remembered choice is cleared at the end so the next story starts from the system setting.' } },
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.ownerDocument.documentElement;
    const toggle = within(canvasElement).getByRole('button', { name: 'Dark theme' });
    const wasDark = toggle.getAttribute('aria-pressed') === 'true';
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', String(!wasDark));
    await expect(root.dataset.theme).toBe(wasDark ? 'light' : 'dark');
    await expect(getComputedStyle(root).colorScheme).toBe(wasDark ? 'light' : 'dark');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-pressed', String(wasDark));
    await expect(root.dataset.theme).toBe(wasDark ? 'dark' : 'light');
    localStorage.removeItem('agent-review:theme');
  },
};

export const LinksOutAreQuieter: Story = {
  parameters: {
    docs: { description: { story: 'The Storybook and the source are not places in the product, so they are their own nav, on the right, in regular weight and muted ink with no line. The places are the two on the left. Neither the toggle, pressed, nor the avatar carries the accent: the bar asks nothing.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const places = canvas.getByRole('navigation', { name: 'Primary' });
    const links = canvas.getByRole('navigation', { name: 'Project links' });
    await expect(within(places).getAllByRole('link').length).toBe(2);
    await expect(within(places).getByRole('link', { name: 'Delegated work' })).toBeInTheDocument();
    await expect(within(places).getByRole('link', { name: 'Reviews' })).toBeInTheDocument();
    await expect(within(links).getAllByRole('link').map((a) => a.textContent)).toEqual(['Storybook', 'Source']);
    for (const a of within(links).getAllByRole('link')) await expect(a).toHaveAttribute('target', '_blank');
    const resolve = (token: string) => {
      const probe = canvasElement.ownerDocument.createElement('i');
      probe.style.color = `var(${token})`;
      canvasElement.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    };
    const avatar = canvasElement.querySelector('.shell__avatar') as HTMLElement;
    await expect(getComputedStyle(avatar).color).not.toBe(resolve('--color-accent'));
    await expect(getComputedStyle(avatar).color).toBe(resolve('--color-text-secondary'));
  },
};

export const ShortcutsFromTheKeyboard: Story = {
  parameters: {
    docs: { description: { story: 'A question mark, pressed with nothing in particular focused, opens the list of shortcuts; Escape closes it. Then the keyboard button in the bar opens it, its close button closes it, and focus is back on the button that opened it. The button’s tooltip carries the key.' } },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = within(canvasElement).getByRole('button', { name: 'Keyboard shortcuts' });
    await expect(trigger).toHaveAttribute('data-tooltip', 'Keyboard shortcuts (?)');
    await expect(trigger).toHaveAttribute('aria-keyshortcuts', 'Shift+/');
    await expect(body.queryByRole('dialog')).toBeNull();

    await userEvent.keyboard('?');
    await expect(body.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect(body.queryByRole('dialog')).toBeNull();

    await userEvent.click(trigger);
    const dialog = body.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await expect(body.queryByRole('dialog')).toBeNull();
    await expect(trigger).toHaveFocus();
  },
};

export const SingleKeysSwitchedOff: Story = {
  parameters: {
    docs: { description: { story: 'With single-key shortcuts switched off, a question mark does nothing and the button no longer advertises it; the button still opens the list. The switch is put back at the end.' } },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    setSingleKeys(false);
    try {
      const trigger = await within(canvasElement).findByRole('button', { name: 'Keyboard shortcuts' });
      await expect(trigger).toHaveAttribute('data-tooltip', 'Keyboard shortcuts');
      await expect(trigger).not.toHaveAttribute('aria-keyshortcuts');
      await userEvent.keyboard('?');
      await expect(body.queryByRole('dialog')).toBeNull();
      await userEvent.click(trigger);
      await expect(body.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
      await userEvent.keyboard('{Escape}');
    } finally {
      setSingleKeys(true);
    }
  },
};

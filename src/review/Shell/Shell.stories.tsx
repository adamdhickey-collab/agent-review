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
          'The chrome: one bar on the chrome’s ground over the page, with the product’s mark on a tile of the accent. The place you are in is said in the accent, the word and the line under it, the line a selected tab carries, with no filled shape, so the first thing with weight on a screen is the screen’s heading. The appearance control is three choices, Light, Dark and System, as the system’s segmented control. The review is dark until a person chooses, and a choice is remembered.',
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

/* On the design cycle the bar is a guided path's (since 2026-10-26): the
   product's mark, the project links and the appearance, and no places and no
   repository, so the cycle has one way in and one way out. */
export const OnTheCycle: Story = {
  args: { route: { name: 'cycle', stage: 'discover' } },
  parameters: {
    docs: {
      description: {
        story:
          'The bar on the design cycle: no places and no repository. Most people on the cycle came from a case study for three minutes, and the delegated work and the reviews are products they have no frame for. The runs are linked where the cycle ends.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('navigation', { name: 'Primary' })).toBeNull();
    await expect(canvas.queryByText('relay/web')).toBeNull();
    await expect(canvas.getByRole('link', { name: 'Agent Review, start of the design cycle' })).toHaveAttribute('href', '#/cycle/discover');
  },
};

export const Appearance: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Light, Dark and System, one tab stop with arrow keys between them, each an icon named by its tooltip. A first visit is System: nothing on the root, whose own color-scheme is "light dark", every token following the operating system live, so it is light unless the system is set to dark. Choosing Light or Dark puts data-theme on the root and remembers it; choosing System takes the attribute off and remembers that. Following the system since 2026-10-24; dark by default from later on 2026-10-11, following the system when Preview Studio opened, and it was a light/dark toggle before. The remembered choice is cleared at the end, and the Storybook’s own theme put back, so the next story starts as it should.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.ownerDocument.documentElement;
    const canvas = within(canvasElement);
    const before = root.dataset.theme;
    try {
      /* The Storybook's decorator puts its own theme on the root; a first
         visit has nothing there, and the app's root follows the system on
         its own. */
      delete root.dataset.theme;
      const group = await canvas.findByRole('radiogroup', { name: 'Appearance' });
      /* A first visit follows the system. */
      await expect(within(group).getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true');
      await expect(root.dataset.theme).toBeUndefined();
      await expect(getComputedStyle(root).colorScheme).toBe('light dark');

      await userEvent.click(within(group).getByRole('radio', { name: 'Dark' }));
      await expect(root.dataset.theme).toBe('dark');
      await expect(getComputedStyle(root).colorScheme).toBe('dark');
      await expect(localStorage.getItem('agent-review:theme')).toBe('dark');

      /* Arrow keys move the choice, as in any radio group. */
      await userEvent.keyboard('{ArrowRight}');
      await expect(within(group).getByRole('radio', { name: 'System' })).toHaveFocus();
      await expect(root.dataset.theme).toBeUndefined();
      await expect(getComputedStyle(root).colorScheme).toBe('light dark');
      await expect(localStorage.getItem('agent-review:theme')).toBe('system');

      await userEvent.click(within(group).getByRole('radio', { name: 'Light' }));
      await expect(root.dataset.theme).toBe('light');
      await expect(getComputedStyle(root).colorScheme).toBe('light');
      await expect(localStorage.getItem('agent-review:theme')).toBe('light');
    } finally {
      localStorage.removeItem('agent-review:theme');
      if (before) root.dataset.theme = before;
    }
  },
};

export const AppearanceRemembered: Story = {
  parameters: {
    docs: { description: { story: 'A choice made before System existed is read as it was written: "light" in storage is Light, with nothing to migrate.' } },
  },
  beforeEach: () => {
    localStorage.setItem('agent-review:theme', 'light');
    return () => localStorage.removeItem('agent-review:theme');
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.ownerDocument.documentElement;
    const group = await within(canvasElement).findByRole('radiogroup', { name: 'Appearance' });
    await expect(within(group).getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
    await expect(root.dataset.theme).toBe('light');
  },
};

export const LinksOutAreQuieter: Story = {
  parameters: {
    docs: { description: { story: 'The Storybook and the source are not places in the product, so they are their own nav, on the right, in regular weight and muted ink with no line. The places are the three on the left, and the one you are in is the accent.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const places = canvas.getByRole('navigation', { name: 'Primary' });
    const links = canvas.getByRole('navigation', { name: 'Project links' });
    await expect(within(places).getAllByRole('link').length).toBe(3);
    await expect(within(places).getByRole('link', { name: 'Design cycle' })).toBeInTheDocument();
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
    await expect(getComputedStyle(within(places).getByRole('link', { name: 'Delegated work' })).color).toBe(resolve('--color-accent'));
    for (const a of within(links).getAllByRole('link')) await expect(getComputedStyle(a).color).toBe(resolve('--color-text-muted'));
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

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
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

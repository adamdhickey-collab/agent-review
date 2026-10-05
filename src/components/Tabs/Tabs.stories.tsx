import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Tabs } from './Tabs';

const PANELS: Record<string, string> = {
  findings: 'Five findings across three checks. The accessibility regression is first because it blocks.',
  stories: 'Four stories rendered at three widths, each against its baseline.',
  rationale: 'What the agent said it did, and which rules it says it followed.',
  tokens: 'One deviation: padding 10px 14px, where --space-2 --space-3 exists.',
  visual: 'Three screenshots moved. Two are the feature; one is the invoice list, which the agent did not mention.',
  accessibility: 'A button with no name in the new toolbar.',
  interaction: 'Every control reached by Tab; the archive button has no second step.',
};

const meta = {
  title: 'System/Tabs',
  component: Tabs,
  args: {
    label: 'Review',
    tabs: [
      { value: 'findings', label: 'Findings' },
      { value: 'stories', label: 'Stories' },
      { value: 'rationale', label: 'Rationale' },
    ],
    value: 'findings',
    onChange: () => {},
    children: null,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <Tabs {...args} value={value} onChange={setValue}>
        <p style={{ padding: 'var(--space-3) var(--space-2)' }}>{PANELS[value]}</p>
      </Tabs>
    );
  },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'Tabs over one region, the WAI pattern: a tablist with one tab stop, arrow keys to move between tabs, and a panel labelled by its tab. A tab can carry a count, which is where "Findings 5" lives, so the number is part of the tab and not a badge beside it. The tabs own nothing but the choice; the screen owns what each panel shows.',
      },
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCounts: Story = {
  args: {
    tabs: [
      { value: 'findings', label: 'Findings', count: 5 },
      { value: 'stories', label: 'Stories', count: 4 },
      { value: 'rationale', label: 'Rationale' },
    ],
  },
};

export const ManyTabs: Story = {
  args: {
    tabs: [
      { value: 'findings', label: 'Findings', count: 5 },
      { value: 'stories', label: 'Stories', count: 4 },
      { value: 'rationale', label: 'Rationale' },
      { value: 'tokens', label: 'Tokens', count: 1 },
      { value: 'visual', label: 'Visual', count: 3 },
      { value: 'accessibility', label: 'Accessibility', count: 1 },
      { value: 'interaction', label: 'Interaction' },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: { description: { story: 'Seven tabs in a 480px frame, to show what the tablist does when it runs out of room. It has no wrap and no scroll of its own, so the row continues past the frame\'s edge.' } },
  },
};

export const KeyboardArrows: Story = {
  parameters: {
    docs: { description: { story: 'Focuses the selected tab and presses ArrowRight. Selection and focus move together, and the panel is the next tab\'s.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('tab', { selected: true }).focus();
    await userEvent.keyboard('{ArrowRight}');
    const stories = canvas.getByRole('tab', { name: 'Stories' });
    await expect(stories).toHaveAttribute('aria-selected', 'true');
    await expect(stories).toHaveFocus();
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Four stories rendered');
  },
};

/* The review's surface, on a wrapper: the Storybook marks a story's surface
   by where it lives (System stories have none), so a story about a surface
   says so itself. */
export const OnTheReviewSurface: Story = {
  args: {
    tabs: [
      { value: 'findings', label: 'Findings', count: 5 },
      { value: 'stories', label: 'Stories', count: 4 },
      { value: 'rationale', label: 'Rationale' },
    ],
  },
  decorators: [(Story) => <div data-surface="review"><Story /></div>],
  parameters: {
    docs: { description: { story: 'On the review’s surface the current tab is ink, with an ink line and a neutral count, as the bar’s current place is. Where you are is not something you are being asked to do, and the accent is kept for that. The product’s tabs keep the accent (Default, above).' } },
  },
  play: async ({ canvasElement }) => {
    const probe = canvasElement.ownerDocument.createElement('i');
    probe.style.color = 'var(--color-text)';
    canvasElement.appendChild(probe);
    const ink = getComputedStyle(probe).color;
    probe.remove();
    const selected = within(canvasElement).getByRole('tab', { selected: true });
    await expect(getComputedStyle(selected).borderBottomColor).toBe(ink);
  },
};

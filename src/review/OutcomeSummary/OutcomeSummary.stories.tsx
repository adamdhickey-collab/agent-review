import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { initialDelegation } from '../../data/billing';
import { account, pixelsOf, play, type DelegationState } from '../../data/delegation';
import { OutcomeFacts, OutcomeSummary } from './OutcomeSummary';

const start = initialDelegation();
const withRule = play(start, { type: 'answer', id: 'cancel-action', option: 'quiet', makeRule: true });
const quiet = play(
  withRule,
  { type: 'answer', id: 'meter-radius', option: 'add', makeRule: false },
  { type: 'answer', id: 'remove-card', option: 'quiet', makeRule: false },
);
const mixed = play(quiet, { type: 'revert', id: 'remove-seats' });
const left = play(withRule, { type: 'answer', id: 'meter-radius', option: 'leave', makeRule: false }, { type: 'answer', id: 'remove-card', option: 'quiet', makeRule: false });

const meta = {
  title: 'Review/OutcomeSummary',
  component: OutcomeSummary,
  args: { state: start },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '44rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The account a delegated run opens on, built to be read at a glance: whether anything needs the person, then a bar of where the literals the lint reported are now (merged, waiting on the person’s decisions, taken back). That is the whole of OutcomeSummary, a few lines. What the checks established, each check as a large Badge with its count and a line each for what is unresolved and for scope, is OutcomeFacts, which the delegated work puts after the decisions and not between the title and them. Every figure is counted from the work, never carried. When nothing needs the person, the lead says so first: the quiet state is the result the screen is for.',
      },
    },
  },
} satisfies Meta<typeof OutcomeSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NeedsYou: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('7 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
    await expect(canvas.getByText('26 of 36')).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('26 merged10 waiting on your 2 decisions');
    await expect(canvas.queryByText(/Axe: 6 of 7/)).toBeNull();
  },
};

/* The two halves, since 2026-10-23: the delegated work draws the sentence
   over the workspace and the tiles and bar under it (OutcomeSummary.tsx,
   THE SENTENCE AT THE TOP). */
export const LeadAlone: Story = {
  args: { part: 'lead' },
  parameters: { docs: { description: { story: 'The sentence alone, as the delegated work draws it over the decision: how the run went and how many decisions need the person, and nothing else.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('7 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
    await expect(canvas.queryByRole('list', { name: 'How the work was handled' })).toBeNull();
    await expect(canvas.queryByRole('list', { name: 'Where the literals are' })).toBeNull();
  },
};

export const CountsAlone: Story = {
  args: { part: 'counts' },
  parameters: { docs: { description: { story: 'The tiles and the bar alone, as the delegated work draws them first in the rest of the run, under the decision: the evidence for the sentence, counted the same way.' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText('7 changes made and checked. 2 decisions need you.')).toBeNull();
    await expect(canvas.getByRole('region', { name: 'How the run went' })).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'How the work was handled' })).toHaveTextContent('7 proceeded on its own1 needs your judgment · 3 more wait on it1 needs your approval');
    await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('26 merged10 waiting on your 2 decisions');
  },
};

/* The modes as tiles, since 2026-10-09: one per mode, the count as the
   headline and what it counts under it, so these stories read the tiles as
   well as the line's text, which is unchanged. */
export const Settled: Story = {
  args: { state: withRule },
  parameters: { docs: { description: { story: 'The first question answered with a rule. A fourth tile, settled by you, arrives with the first answer, and the four share the row.' } } },
  play: async ({ canvasElement }) => {
    const modes = within(canvasElement).getByRole('list', { name: 'How the work was handled' });
    await expect(modes).toHaveTextContent('7 proceeded on its own1 needs your judgment1 needs your approval3 settled by you');
    await expect(within(modes).getAllByRole('listitem')).toHaveLength(4);
  },
};

/* WHAT THE SCREEN SHOWS, A REGRESSION (2026-10-12). After "Keep the red for
   now" was applied with a rule, the account said the merged changes "moved
   no pixel" while the visual baselines badge under it said 4 changed. The
   sentence is counted from the same results now, and this holds the two to
   each other on every path a person can take through the first decision,
   with and without a rule, rather than to any wording: whatever the badge
   counts as changed, the sentence counts as changing the screen, and it
   only says none moved when the badge says none changed. */
const paths: [string, DelegationState][] = [
  ['as found', start],
  ['its own change, with a rule', play(start, { type: 'answer', id: 'cancel-action', option: 'own-change', makeRule: true })],
  ['its own change, once', play(start, { type: 'answer', id: 'cancel-action', option: 'own-change', makeRule: false })],
  ['quiet variant, with a rule', withRule],
  ['quiet variant, once', play(start, { type: 'answer', id: 'cancel-action', option: 'quiet', makeRule: false })],
  ['every decision made', quiet],
  ['a change reverted', mixed],
];

export const WhatTheScreenShows: Story = {
  render: () => (
    <div>
      {paths.map(([name, state]) => (
        <section key={name} aria-label={name} data-path>
          <OutcomeSummary state={state} />
          <OutcomeFacts state={state} />
        </section>
      ))}
    </div>
  ),
  parameters: {
    /* Seven accounts on one page, on purpose: each is the same named
       section, which axe reads as a duplicate landmark. The app shows one. */
    a11y: { test: 'error', config: { rules: [{ id: 'landmark-unique', enabled: false }] } },
    docs: { description: { story: 'The account after each way through the first decision, with and without a rule, and after every decision and a revert. The sentence about pixels agrees with the visual baselines badge on each: the same count changed, and “none moved a pixel” only where nothing did.' } },
  },
  play: async ({ canvasElement }) => {
    const sections = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-path]'));
    await expect(sections).toHaveLength(paths.length);
    for (const [i, section] of sections.entries()) {
      const name = section.getAttribute('aria-label');
      /* The badge counts every change the checks ran on, a reverted one
         too; the sentence is about what is merged. A reverted change whose
         baselines moved is the one difference allowed, and it is counted
         from the state rather than assumed. */
      const reverted = pixelsOf(account(paths[i][1]).reverted).moved.length;
      const share = section.querySelector('.outcome__share')!.textContent ?? '';
      const visual = within(section).getByText(/^Visual baselines:/).textContent ?? '';
      const changed = Number(/(\d+) changed/.exec(visual)?.[1] ?? 0);
      const passed = Number(/(\d+) of \d+ passed/.exec(visual)?.[1] ?? 0);
      const moved = Number(/(\d+) changed what the screen shows/.exec(share)?.[1] ?? 0);
      await expect({ name, moved }).toEqual({ name, moved: changed - reverted });
      await expect({ name, none: share.includes('none moved a pixel') }).toEqual({ name, none: changed - reverted === 0 });
      if (changed) await expect({ name, still: share.includes(`${passed} change${passed === 1 ? '' : 's'} moved no pixel`) }).toEqual({ name, still: true });
    }
  },
};

export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  parameters: { docs: { description: { story: 'The account in a 360px column, as on a phone. Four tiles across would leave each a word wide, so each mode is a row: the mark and count, then the words, the held changes under them. The account’s own width decides, not the window’s.' } } },
  play: async ({ canvasElement }) => {
    const modes = within(canvasElement).getByRole('list', { name: 'How the work was handled' });
    await expect(modes).toHaveTextContent('7 proceeded on its own1 needs your judgment · 3 more wait on it1 needs your approval');
    await expect(modes.scrollWidth).toBeLessThanOrEqual(modes.clientWidth);
    const [own, asks] = within(modes).getAllByRole('listitem');
    await expect(asks.getBoundingClientRect().top).toBeGreaterThan(own.getBoundingClientRect().top);
  },
};

export const Facts: Story = {
  render: (args) => <OutcomeFacts state={args.state} />,
  parameters: {
    docs: { description: { story: 'What the checks established and what they could not, the three rows the delegated work shows after the decisions: each check with its count, the first try that failed and was fixed, the check that stayed inconclusive and what it could not measure, and the scope. Nothing in it was shortened by being moved here.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Axe: 6 of 7 passed, 1 inconclusive')).toBeInTheDocument();
    await expect(canvas.getByText(/A first try in the plan card failed two checks and was fixed\./)).toBeInTheDocument();
    await expect(canvas.getByText(/Axe couldn’t measure whether a label in the usage meter clears 4\.5:1/)).toBeInTheDocument();
    await expect(canvas.getByText(/Every change was made under its own boundaries\./)).toBeInTheDocument();
  },
};

export const Quiet: Story = {
  args: { state: quiet },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Nothing needs your attention.')).toBeInTheDocument();
    await expect(within(canvasElement).getByText('12 changes made and checked. Completed work is below.')).toBeInTheDocument();
  },
};

export const WithAReversal: Story = {
  args: { state: mixed },
  parameters: { docs: { description: { story: 'Quiet, with one change reverted by the person: the account says so, and that the lint reports its two literals again.' } } },
  render: (args) => (
    <>
      <OutcomeSummary state={args.state} />
      <OutcomeFacts state={args.state} />
    </>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/1 change reverted by you\./)).toBeInTheDocument();
    await expect(within(canvasElement).getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('34 merged2 reverted or left by you');
  },
};

export const WithALineLeft: Story = {
  args: { state: left },
  parameters: { docs: { description: { story: 'Quiet, with one line the person chose to leave as written: the scope sentence no longer mentions a change past the boundary, because none was made.' } } },
  render: (args) => <OutcomeFacts state={args.state} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/1 line left as written, by you\./)).toBeInTheDocument();
  },
};

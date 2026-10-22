import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { ReactNode } from 'react';
import { StoreProvider } from '../../app/store';
import { DANAS_REASON, initialDelegation } from '../../data/billing';
import { initialTableRun } from '../../data/table';
import { account, play, type DelegationState } from '../../data/delegation';
import { DelegationScreen } from './DelegationScreen';

/* Each story opens the screen on a point in the loop, reached by playing
   actions through the same reducer the app uses, so a story can never show
   a state the app cannot reach. TheWholeLoop presses through it instead,
   from the start to the quiet state, and asserts each state change. */

const start = initialDelegation();
const withRule = play(start, { type: 'answer', id: 'cancel-action', option: 'quiet', makeRule: true });
const answeredOnce = play(start, { type: 'answer', id: 'cancel-action', option: 'own-change', makeRule: false });
const quiet = play(
  withRule,
  { type: 'answer', id: 'meter-radius', option: 'add', makeRule: false },
  { type: 'answer', id: 'remove-card', option: 'quiet', makeRule: true },
);

function inStore(state: DelegationState) {
  return (Story: () => ReactNode) => (
    <StoreProvider delegation={state}>
      <Story />
    </StoreProvider>
  );
}

const meta = {
  title: 'Review/DelegationScreen',
  component: DelegationScreen,
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The front door: work an agent was handed, and what came of it. It opens on an account of the run, not a queue: what was done, how it was checked, what is unresolved, and whether the agent stayed inside its boundaries. Then, since Preview Studio, a workspace for what needs the person: the screen the decision changes, rendered large on the left with the element marked and what the agent read under it, and the decision on the right in an inspector, one at a time with a way to the others. Then the decisions made and the completed work, each open to what changed, why, on what authority, what the checks did and did not establish, and a revert. Beside it, the boundaries and the rules the person has made. When nothing needs the person, the account says so and the decisions section is not there. The run is simulated: sample data played back through one reducer (data/delegation.ts), the same way every time.',
      },
    },
  },
} satisfies Meta<typeof DelegationScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initial: Story = {
  decorators: [inStore(start)],
  parameters: {
    docs: { description: { story: 'The run as the person finds it: seven changes made and checked, two decisions, three changes held behind the first. The totals are counted from the work, and the work accounts for every literal the lint reported. Of the seven, the three with something to look at (an inconclusive check, a fix after a failed first try, a red chosen by meaning) are rows of their own; the four routine swaps are folded into one row.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const a = account(start);
    await expect(a.total).toBe(start.brief.literals);
    await expect(a.made.length).toBe(7);
    await expect(a.valuesMade + a.literalsLeft).toBe(start.brief.literals);
    await expect(canvas.getByText('7 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('26 merged10 waiting on your 2 decisions');
    await expect(canvas.getByRole('list', { name: 'How the work was handled' })).toHaveTextContent('7 proceeded on its own1 needs your judgment · 3 more wait on it1 needs your approval');
    await expect(canvas.queryByText(/settled by you/)).toBeNull();
    await expect(canvas.getByRole('heading', { name: /Needs you/ })).toHaveTextContent('2');
    await expect(canvas.getByRole('heading', { name: /Completed work/ })).toHaveTextContent('7');
    await expect(canvas.getByText(/3 changes are held until you decide/)).toBeInTheDocument();
    await expect(canvas.getByText('Simulated')).toBeInTheDocument();
    await expect(canvas.getByText('4 routine swaps')).toBeInTheDocument();
    await expect(canvas.queryByText('On its own')).toBeNull();
  },
};

export const AfterARule: Story = {
  decorators: [inStore(withRule)],
  parameters: {
    docs: { description: { story: 'The first question answered with the recommended direction, a quiet variant, and made a rule. The rule settled the two waiting changes it covers and is listed under the boundaries with what it has done. Removing a card is close to the rule but outside it, so it asks, and says so.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('10 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('33 merged3 waiting on your 2 decisions');
    await expect(canvas.getByRole('list', { name: 'How the work was handled' })).toHaveTextContent('7 proceeded on its own1 needs your judgment1 needs your approval3 settled by you');
    await expect(canvas.getByRole('button', { name: 'See the decision record' })).toBeInTheDocument();
    const record = canvas.getByRole('article', { name: 'Add a quiet variant' });
    await expect(record).toHaveTextContent(/Your reason.*The agent’s draft, kept as written/);
    await expect(record).toHaveTextContent('Accepted trade-offA job that changes nothing visible, over a system with no way to make an action hard to find.');
    await expect(record).toHaveTextContent(/Follow-up.*Decide with whoever owns it how easy “Cancel subscription” should be to find\..*Open/);
    await expect(record).toHaveTextContent(/Kept as your rule\. 2 later changes followed it/);
    await expect(canvas.getByText(/Follow-up from your decision at 14:26: decide with whoever owns it/)).toBeInTheDocument();
    /* The case outside the rule is the second decision. */
    await userEvent.click(canvas.getByRole('button', { name: 'Next decision' }));
    await expect(canvas.getByText(/Close to your rule, but outside it/)).toBeInTheDocument();
    await expect(canvas.getAllByText('Your rule')).toHaveLength(2);
    await expect(canvas.getByText('Active')).toBeInTheDocument();
  },
};

export const AnsweredOnce: Story = {
  decorators: [inStore(answeredOnce)],
  parameters: {
    docs: { description: { story: 'Dana’s direction, given once. A one-time answer does not become standing permission, so the three changes that were waiting each ask, and each says why: the same question was answered once, for another change.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('8 changes made and checked. 4 decisions need you.')).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('29 merged7 waiting on your 4 decisions');
    /* One decision at a time: the three that were waiting are the second to
       the fourth, and each says why it asks. */
    await expect(canvas.getByText('Decision 1 of 4')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Previous decision' })).toBeDisabled();
    for (let n = 2; n <= 4; n++) {
      await userEvent.click(canvas.getByRole('button', { name: 'Next decision' }));
      await expect(canvas.getByText(`Decision ${n} of 4`)).toBeInTheDocument();
      await expect(canvas.getByText(/A one-time decision doesn’t carry over to another change/)).toBeInTheDocument();
    }
    await expect(canvas.getByRole('button', { name: 'Next decision' })).toBeDisabled();
    await expect(canvas.getByRole('article', { name: 'Make it a Button in its own change' })).toHaveTextContent(/Not kept for similar cases\./);
    await expect(canvas.getByText('No rules yet')).toBeInTheDocument();
  },
};

export const Quiet: Story = {
  decorators: [inStore(quiet)],
  parameters: {
    docs: { description: { story: 'Nothing needs the person. The account says so first, and the decisions section is not there at all. The completed work, and the one result that stayed inconclusive, are still there to read.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Nothing needs your attention.')).toBeInTheDocument();
    await expect(canvas.queryByRole('heading', { name: /Needs you/ })).toBeNull();
    await expect(canvas.getByRole('heading', { name: /Completed work/ })).toHaveTextContent('12');
    await expect(canvas.getByText('All 36')).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('36 merged');
    await expect(canvas.getByRole('list', { name: 'How the work was handled' })).toHaveTextContent('7 proceeded on its own0 need your judgment0 need your approval5 settled by you');
  },
};

export const TheWholeLoop: Story = {
  decorators: [inStore(start)],
  parameters: {
    docs: {
      description: {
        story:
          'Presses through the loop from the start: inspect work the agent did on its own; decide the first question against the recommendation and make the decision a rule; see the rule settle two changes and the case outside it pause; widen the rule, which settles that case; revert one change the rule made; revoke the rule; allow the new token once; and arrive at the quiet state. Each step asserts the counts, the statuses and what the person can do next.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Inspect a change the agent chose by meaning', async () => {
      const failed = Array.from(canvasElement.querySelectorAll<HTMLDetailsElement>('.record')).find((r) => r.textContent?.includes('The failed-payment red'))!;
      await userEvent.click(within(failed).getByText(/The failed-payment red/));
      await expect(failed.open).toBe(true);
      await expect(within(failed).getByText(/What no check establishes:/)).toBeVisible();
      await expect(within(failed).getByRole('button', { name: 'Revert this change' })).toBeVisible();
    });

    await step('Decide against the recommendation, and make the decision a rule', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /^Select and preview\s+Make it a Button in its own change$/ }));
      await expect(canvas.getByText('If you apply “Make it a Button in its own change”, the agent will:')).toHaveFocus();
      /* Selecting it previews it, and says so, and says the preview is the change it opens. */
      await expect(canvas.getByText(/Proposed:/)).toHaveTextContent('Proposed: Make it a Button in its own change');
      await expect(canvas.getByText('Not applied')).toBeInTheDocument();
      await expect(canvas.getByText('As its own change will draw it')).toBeInTheDocument();
      const apply = canvas.getByRole('button', { name: 'Apply' });
      await userEvent.click(canvas.getByText('Use this decision for similar cases'));
      await expect(canvas.getByText(/It settles now:/).closest('p')).toHaveTextContent('2 changes that match, on the plan card');
      await userEvent.click(apply);
      await expect(canvas.getByText(/Decided: make it a button in its own change, and made a rule\. The agent applied it and recorded your reason\. Your rule settled 2 waiting changes\. 1 change is asking now\./)).toBeInTheDocument();
      await expect(canvas.getByRole('heading', { name: /Needs you/ })).toHaveFocus();
      await expect(canvas.getByText('10 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
    });

    await step('The case outside the rule pauses, and says why', async () => {
      await expect(canvas.getByText('Decision 1 of 2')).toBeInTheDocument();
      await userEvent.click(canvas.getByRole('button', { name: 'Next decision' }));
      await expect(canvas.getByText(/Close to your rule, but outside it/)).toBeInTheDocument();
      await expect(canvas.getByRole('heading', { name: /Keep “Remove card” looking as it does/ })).toBeInTheDocument();
      await expect(canvas.getByRole('list', { name: 'What each marked element is' })).toHaveTextContent(/Hand-built action · Billing settings\s*Small gray text, built by hand\./);
    });

    await step('Widen the rule, and it settles that case', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
      await userEvent.click(canvas.getByText('An action that removes something the customer set up'));
      await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
      await expect(canvas.getByText(/Rule saved\. Your rule settled 1 waiting change\./)).toBeInTheDocument();
      await expect(canvas.getByText('11 changes made and checked. 1 decision needs you.')).toBeInTheDocument();
      await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('35 merged1 waiting on your decision');
    });

    await step('Revert one change the rule made, and the history keeps both', async () => {
      const seats = Array.from(canvasElement.querySelectorAll<HTMLDetailsElement>('.record')).find((r) => r.textContent?.includes('“Remove seats” on the plan card'))!;
      seats.open = true;
      await userEvent.click(within(seats).getByRole('button', { name: 'Revert this change' }));
      await expect(seats.dataset.status).toBe('reverted');
      await expect(within(seats).getByRole('button', { name: 'Restore it' })).toHaveFocus();
      await expect(within(seats).getByText(/puts the literals back/)).toBeInTheDocument();
      await expect(canvas.getByText(/1 change reverted by you\./)).toBeInTheDocument();
      await expect(canvas.getByText(/The lint reports its 2 literals again\./)).toBeInTheDocument();
      await expect(canvas.getByRole('list', { name: 'Where the literals are' })).toHaveTextContent('33 merged1 waiting on your decision2 reverted or left by you');
    });

    await step('Revoke the rule; what it made stays', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Revoke' }));
      await expect(canvas.getByRole('button', { name: 'Revoke the rule' })).toHaveFocus();
      await userEvent.click(canvas.getByRole('button', { name: 'Revoke the rule' }));
      await expect(canvas.getByText('Revoked')).toBeInTheDocument();
      await expect(canvas.getByText(/It no longer applies/)).toHaveFocus();
      await expect(canvas.queryByRole('button', { name: 'Edit' })).toBeNull();
      await expect(canvas.getAllByText('Your rule')).toHaveLength(3);
    });

    await step('Allow the new token once, and reach the quiet state', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Add --radius-full, this once' }));
      await expect(canvas.queryByText('Also use this answer for similar cases')).toBeNull();
      await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
      await waitFor(() => expect(canvas.getByText('Nothing needs your attention.')).toBeInTheDocument());
      await expect(canvas.getByText('Nothing needs your attention.').closest('p')).toHaveFocus();
      await expect(canvas.getByText('Allowed once')).toBeInTheDocument();
      await expect(canvas.getByRole('heading', { name: /Completed work/ })).toHaveTextContent('12');
    });

    await step('Reset puts the run back at its start', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Reset the demo' }));
      await expect(canvas.getByText('7 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
      await expect(canvas.getByRole('heading', { level: 1 })).toHaveFocus();
    });
  },
};

/* The direction the agent did not recommend, kept as a rule, with the
   person's own reason, which carries the one thing the agent could not
   know: as real a decision as the recommended one, with its own work and
   its own record. */
const ownChange = play(start, { type: 'answer', id: 'cancel-action', option: 'own-change', makeRule: true, reason: DANAS_REASON });

export const ItsOwnChange: Story = {
  decorators: [inStore(ownChange)],
  parameters: {
    docs: {
      description: {
        story:
          'The direction the agent did not recommend, chosen and kept as a rule, in the person’s own words. Nothing about it is an error: the agent moved the link’s values onto tokens and left it as built, wrote the exception down with an end date, and opened the change that makes it a Button, and the record says what was accepted, what is still a risk, and that the reason is the person’s. The two changes the rule covers followed it, and each of their records names the decision.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('10 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
    const record = canvas.getByRole('article', { name: 'Make it a Button in its own change' });
    await expect(record).toHaveTextContent(/Your reasonThe gray link is from a retention test last year.*In your words/);
    await expect(record).toHaveTextContent('Accepted trade-offA system with no way to make an action hard to find, over finishing every control in this job.');
    await expect(record).toHaveTextContent(/Remaining risk“Cancel subscription” stays hard to find until its own change ships, on Oct 15\./);
    await expect(record).toHaveTextContent(/Wrote the exception down, ending Oct 15\./);
    await expect(record).toHaveTextContent(/never gets a quiet variant: it stays as built/);
    await expect(canvas.getByText(/Follow-up from your decision at 14:26: make “Cancel subscription” a Button in its own change, by Oct 15/)).toBeInTheDocument();
    const rule = canvasElement.querySelector('.rule') as HTMLElement;
    await expect(rule).toHaveTextContent(/WhyThe gray link is from a retention test last year/);
    const downgrade = Array.from(canvasElement.querySelectorAll<HTMLDetailsElement>('.record')).find((r) => r.textContent?.includes('“Downgrade plan” on the plan card'))!;
    downgrade.open = true;
    await expect(downgrade).toHaveTextContent(/Followed your rule, from your decision at 14:26 \(make it a button in its own change\)/);
    await expect(downgrade).toHaveTextContent(/docs\/design-system\/exceptions\.md/);
  },
};

export const Dark: Story = {
  decorators: [inStore(start)],
  globals: { theme: 'dark' },
  parameters: {
    docs: { description: { story: 'The delegated work in the dark theme. Every color is light-dark(light, dark) in tokens.css, so the theme is one color-scheme and no component knows about it; axe runs on this story as on every other, which is what holds each ink to 4.5:1 on each dark ground.' } },
  },
  play: async ({ canvasElement }) => {
    await expect(getComputedStyle(canvasElement.ownerDocument.documentElement).colorScheme).toBe('dark');
    await expect(within(canvasElement).getByText('7 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
  },
};

export const DecisionFirst: Story = {
  decorators: [inStore(start)],
  parameters: {
    docs: { description: { story: 'The order a person who has something to decide wants: the account in one sentence, the tiles and a bar, then the workspace, the decision’s screen first and the inspector beside it, and only then the evidence for the sentence (the checks, what is unresolved, the scope) and the completed work. The inspector is the one raised surface on the screen: the preview, the read, the completed work and the boundaries are flat panels, an edge and no shadow, and the strip’s “Simulated” is in the ink, not the accent.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const before = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const lead = canvas.getByText('7 changes made and checked. 2 decisions need you.');
    const preview = canvas.getByRole('region', { name: 'Preview of Billing settings BillingSettings.tsx' });
    const needs = canvas.getByRole('heading', { name: /Needs you/ });
    const checks = canvas.getByRole('list', { name: 'Checks run on every change' });
    const done = canvas.getByRole('heading', { name: /Completed work/ });
    await expect(before(lead, preview)).toBe(true);
    await expect(before(preview, needs)).toBe(true);
    await expect(before(needs, checks)).toBe(true);
    await expect(before(checks, done)).toBe(true);
    await expect(canvas.getByText('Decision 1 of 2')).toBeInTheDocument();
    /* Unresolved is below the decisions, not gone. */
    await expect(canvas.getByText(/Axe couldn’t measure/)).toBeInTheDocument();
    /* One decision at a time, in the one raised panel. */
    await expect(canvasElement.querySelectorAll('.studio__inspector .ask').length).toBe(1);
    await expect(getComputedStyle(canvasElement.querySelector('.studio__inspector') as Element).boxShadow).not.toBe('none');
    for (const flat of ['.studio-preview', '.delegation__records', '.bounds']) {
      await expect(getComputedStyle(canvasElement.querySelector(flat) as Element).boxShadow).toBe('none');
    }
    /* Simulated is ink, not the accent. */
    const probe = canvasElement.ownerDocument.createElement('i');
    canvasElement.appendChild(probe);
    probe.style.color = 'var(--color-accent)';
    const accent = getComputedStyle(probe).color;
    probe.remove();
    await expect(getComputedStyle(canvas.getByText('Simulated')).color).not.toBe(accent);
  },
};

/* PREVIEW STUDIO: each direction selected, in each theme. Selecting a
   direction previews it on the left, labelled as proposed and not applied,
   and opens the plan on the right; nothing changes until Apply. */
const selectThen = (title: string) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await expect(canvas.getByText('Current interface')).toBeInTheDocument();
  await userEvent.click(canvas.getByRole('button', { name: new RegExp(`^Select and preview\\s+${title}$`) }));
  await expect(canvas.getByRole('button', { name: new RegExp(`^Selected\\s+${title}$`) })).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas.getByText(/Proposed:/)).toHaveTextContent(`Proposed: ${title}`);
  await expect(canvas.getByText('Not applied')).toBeInTheDocument();
  await expect(canvas.getByRole('radio', { name: 'Proposed' })).toHaveAttribute('aria-checked', 'true');
  await expect(canvas.getByText(`If you apply “${title}”, the agent will:`)).toHaveFocus();
  /* Proposed is not applied: the account has not moved. */
  await expect(canvas.getByText('7 changes made and checked. 2 decisions need you.')).toBeInTheDocument();
};

export const QuietSelected: Story = {
  decorators: [inStore(start)],
  parameters: { docs: { description: { story: 'The recommended direction selected: in the preview, “Cancel subscription” as a quiet Button, which looks exactly as the link did, and the plan, the reason and Apply in the inspector.' } } },
  play: selectThen('Add a quiet variant'),
};

export const OwnChangeSelected: Story = {
  decorators: [inStore(start)],
  parameters: { docs: { description: { story: 'The other direction selected: in the preview, “Cancel subscription” as the system’s Button, the way its own change will draw it, which the preview says; and its own plan and reason.' } } },
  play: selectThen('Make it a Button in its own change'),
};

export const OwnChangeSelectedDark: Story = {
  decorators: [inStore(start)],
  globals: { theme: 'dark' },
  parameters: { docs: { description: { story: 'The same, in the dark theme. The product in the preview stays light, as Relay does.' } } },
  play: selectThen('Make it a Button in its own change'),
};

export const SwitchingKeepsTheWork: Story = {
  decorators: [inStore(start)],
  parameters: {
    docs: { description: { story: 'Going to the other decision and back finds the direction as it was left selected, and the preview with it; and the view a person flipped to (current or proposed) is kept per decision.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Select and preview\s+Make it a Button in its own change$/ }));
    await userEvent.click(canvas.getByRole('radio', { name: 'Current' }));
    await expect(canvas.getByText('Current interface')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Next decision' }));
    await expect(canvas.getByRole('heading', { name: 'Add a token for a fully round corner?' })).toBeInTheDocument();
    await expect(canvas.getByText('Current interface')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Previous decision' }));
    await expect(canvas.getByRole('button', { name: /^Selected\s+Make it a Button in its own change$/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('radio', { name: 'Current' })).toHaveAttribute('aria-checked', 'true');
  },
};

/* START HERE: the one line over the workspace that names the task, and
   follows the person through it. The current step is the list's current
   step, and the ones before it are marked done in words a screen reader
   hears, not only by their check. */
export const StartHere: Story = {
  decorators: [inStore(start)],
  parameters: {
    docs: { description: { story: 'The first decision, before anything is chosen: “Start here”, then compare the two actions, choose a direction, preview it, and apply it, the first current. Selecting a direction marks the first three done and makes Apply current. After the first decision is applied, the line over the next one says “Next”.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cue = canvas.getByRole('region', { name: 'Start here' });
    const current = () => cue.querySelector('[aria-current="step"]');
    await expect(within(cue).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['1Compare the two actions', '2Choose a direction', '3Preview it', '4Apply it']);
    await expect(current()).toHaveTextContent('Compare the two actions');
    await userEvent.click(canvas.getByRole('button', { name: /^Select and preview\s+Make it a Button in its own change$/ }));
    await expect(current()).toHaveTextContent('Apply it');
    await expect(cue.querySelectorAll('[data-done]')).toHaveLength(3);
    await expect(cue).toHaveTextContent('Choose a direction (done)');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(canvas.getByRole('region', { name: 'Next' })).toBeInTheDocument());
    await expect(canvas.queryByRole('region', { name: 'Start here' })).toBeNull();
  },
};

/* The second run: the shared table. A permission boundary rather than
   missing intent, and three answers that end differently. */
const table = initialTableRun();
const tableApproved = play(table, { type: 'answer', id: 'table-rows', option: 'shared', makeRule: false });

export const SharedTable: Story = {
  args: { run: 'shared-table' },
  decorators: [inStore(table)],
  parameters: {
    docs: {
      description: {
        story:
          'The second sample run, a permission boundary. Asked to fix a cramped customer table, the agent made two fixes on that screen on its own and stopped at the third: the fix that fits is one line in the shared Table that forty screens draw, and changing a shared component is outside this delegation. The strip names the run on screen and links to the other.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const a = account(table);
    await expect(a.total).toBe(table.brief.literals);
    await expect(canvas.getByText('2 changes made and checked. 1 decision needs you.')).toBeInTheDocument();
    await expect(canvas.getByRole('list', { name: 'Where the fixes are' })).toHaveTextContent('2 merged1 waiting on your decision');
    const runs = canvas.getByRole('navigation', { name: 'Sample runs' });
    await expect(within(runs).getByRole('link', { name: /Shared table/ })).toHaveAttribute('aria-current', 'page');
    await expect(within(runs).getByRole('link', { name: /Quiet cancel/ })).toHaveAttribute('href', '#/');
    await expect(canvas.getByText('Needs approval')).toBeInTheDocument();
    await expect(canvas.getByText(/One stopped at the edge: the fix is in a shared component\./)).toBeInTheDocument();
    await expect(canvas.getByText('2 routine fixes')).toBeInTheDocument();
  },
};

export const SharedTableThreeAnswers: Story = {
  args: { run: 'shared-table' },
  decorators: [inStore(table)],
  parameters: {
    docs: {
      description: {
        story:
          'Each answer ends differently. More evidence decides nothing: the question comes back with what the agent found. Approving the shared change is allowed once, merges, and leaves the screens nobody has looked at in the account. Keeping the fix on the screen merges a local override, leaves the other screens as they were, says so, and can be kept as a rule scoped to the customer screens, with where it applies, why, and who made it.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Ask for more evidence: nothing is decided, and the question comes back', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Show me the 40 screens' }));
      await expect(canvas.getByText(/Nothing decided yet\./)).toBeInTheDocument();
      await expect(canvas.getByRole('heading', { name: /Needs you/ })).toHaveFocus();
      await expect(canvas.getByRole('list', { name: 'What is known' })).toHaveTextContent(/On 5, a panel of fixed height now cuts off the last row/);
      await expect(canvas.queryByRole('button', { name: 'Show me the 40 screens' })).toBeNull();
      await expect(canvas.getByText('2 changes made and checked. 1 decision needs you.')).toBeInTheDocument();
    });

    await step('Approving offers no rule, and says whose permission a standing one needs', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Approve, this once' }));
      await expect(canvas.queryByText('Also use this answer for similar cases')).toBeNull();
      await expect(canvas.getByText(/only its owner, Priya Raman/)).toBeInTheDocument();
      await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    });

    await step('Keep it to the screen, as a rule for the customer screens', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Fix this screen only' }));
      await userEvent.click(canvas.getByText('Also use this answer for similar cases'));
      await expect(canvas.getByText(/You can revoke it under the boundaries/)).toBeInTheDocument();
      await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
      await waitFor(() => expect(canvas.getByText('Nothing needs your attention.')).toBeInTheDocument());
      await expect(canvas.getByText(/Answered, and made a rule\./)).toBeInTheDocument();
      await expect(canvas.getByText(/The other 39 screens keep their tighter rows/)).toBeInTheDocument();
      await expect(canvas.getByRole('list', { name: 'Where the fixes are' })).toHaveTextContent('3 merged');
    });

    await step('The rule says where it applies and why, and can be revoked, not widened', async () => {
      const rule = canvasElement.querySelector('.rule') as HTMLElement;
      await expect(rule).toHaveTextContent(/Applies toThe customer screens/);
      await expect(rule).toHaveTextContent(/WhyA shared component is its owner’s to change/);
      await expect(rule).toHaveTextContent(/Made by you/);
      await expect(within(rule).queryByRole('button', { name: 'Edit' })).toBeNull();
      await expect(within(rule).getByRole('button', { name: 'Revoke' })).toBeInTheDocument();
    });

    await step('Reset puts this run back at its start', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Reset the demo' }));
      await expect(canvas.getByText('2 changes made and checked. 1 decision needs you.')).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: 'Show me the 40 screens' })).toBeInTheDocument();
    });
  },
};

export const SharedTableApproved: Story = {
  args: { run: 'shared-table' },
  decorators: [inStore(tableApproved)],
  parameters: {
    docs: {
      description: {
        story:
          'The shared change approved once, without more evidence. It merged and is marked allowed once; the visual check says it changed rather than passed, and the account lists the 28 screens nobody has looked at as unresolved, rather than calling the change verified.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Nothing needs your attention.')).toBeInTheDocument();
    await expect(canvas.getByText('Allowed once')).toBeInTheDocument();
    await expect(canvas.getByText('Visual baselines: 2 of 3 passed, 1 changed')).toBeInTheDocument();
    await expect(canvas.getByText(/28 screens draw the taller rows and have no visual baseline\. Nobody has looked at them\./)).toBeInTheDocument();
    await expect(canvas.getByText(/One went past them because you allowed it, once\./)).toBeInTheDocument();
  },
};

export const SharedTableApproveSelected: Story = {
  args: { run: 'shared-table' },
  decorators: [inStore(table)],
  parameters: {
    docs: {
      description: {
        story:
          'The shared change selected, before Apply: the preview’s taller rows on the customer list and all forty screens marked as changing, the 28 without a visual baseline among them; the inspector’s confirmation, with no rule to make and whose permission a standing one would need.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Approve, this once' }));
    await expect(canvas.getByText(/Proposed:/, { selector: '.studio-preview__proposed' })).toHaveTextContent('Proposed: All 40 screens');
    await expect(canvas.getByText('Proposed: all 40 screens get the change. 28 of them have no visual baseline.')).toBeInTheDocument();
    await expect(canvas.getByText(/only its owner, Priya Raman \(Design systems\), can give/)).toBeInTheDocument();
    await expect(canvas.queryByRole('checkbox', { name: /similar cases/ })).toBeNull();
    await expect(canvas.getByText('2 changes made and checked. 1 decision needs you.')).toBeInTheDocument();
  },
};

export const SharedTableDark: Story = {
  args: { run: 'shared-table' },
  decorators: [inStore(table)],
  globals: { theme: 'dark' },
  parameters: { docs: { description: { story: 'The permission decision in the dark theme.' } } },
  play: async ({ canvasElement }) => {
    await expect(getComputedStyle(canvasElement.ownerDocument.documentElement).colorScheme).toBe('dark');
    await expect(within(canvasElement).getByText('Needs approval')).toBeInTheDocument();
  },
};

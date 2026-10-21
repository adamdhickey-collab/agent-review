import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { initialDelegation } from '../../data/billing';
import { initialTableRun } from '../../data/table';
import { find, play, type Work } from '../../data/delegation';
import { DecisionPreview, type PreviewView } from './DecisionPreview';

/* The decision preview, on its own: the screen a decision changes, drawn on
   the product's surface, with the element marked. A story picks the change
   and the direction selected in the inspector; the view (current or
   proposed) is the preview's own control, so the stories hold it in state
   the way the screen does. */

const start = initialDelegation();
const table = initialTableRun();
const cancel = find(start, 'cancel-action') as Work;
const meter = find(start, 'meter-radius') as Work;
const rows = find(table, 'table-rows') as Work;
const card = find(play(start, { type: 'answer', id: 'cancel-action', option: 'quiet', makeRule: true }), 'remove-card') as Work;

function Stateful({ work, optionId, initial = 'proposed' }: { work: Work; optionId?: string; initial?: PreviewView }) {
  const [view, setView] = useState<PreviewView>(initial);
  const option = work.question?.options.find((o) => o.id === optionId && !o.asks);
  return <DecisionPreview work={work} option={option} view={view} onViewChange={setView} />;
}

const meta = {
  title: 'Review/DecisionPreview',
  component: Stateful,
  args: { work: cancel },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The large pane of the delegated work’s workspace (Preview Studio): the screen a decision changes, rendered on the product’s surface in the product’s tokens and components, never pictured. The element in question is drawn unstyled and the preview writes its lines onto it: the change’s own values for the screen as it is (the literals #6a6a76 and 0.75rem), a selected direction’s for the screen as proposed; a direction that changes the markup (a quiet Button, the system’s Button) is drawn as that. The toolbar names the screen and says, in words, whether this is the current interface or a proposal, not applied, and when a proposal draws a later change rather than this one; a thin accent outline marks the decision, a dashed one its twin. Under the frame, what each marked element is, or every screen a shared component reaches.',
      },
    },
  },
} satisfies Meta<typeof Stateful>;

export default meta;
type Story = StoryObj<typeof meta>;

/* How an element is drawn, as the browser resolved it. */
const ink = (el: Element | null) => (el ? getComputedStyle(el).color : '');
const size = (el: Element | null) => (el ? getComputedStyle(el).fontSize : '');
const MUTED = 'rgb(106, 106, 118)'; /* #6a6a76, the product's muted ink and the literal the old billing app typed */
const CANCEL = '.settings__cancel-subscription';

export const Current: Story = {
  parameters: {
    docs: { description: { story: 'Nothing selected: billing settings as they are. Every action is the system’s Button except “Cancel subscription”, a link built by hand, small and grey, which is the question; teal is only the annotation, a solid outline on the link and a dashed one on “Change plan”. Under the screen, a caption for each, led by the tag its mark carries. No view control yet, because there is nothing to compare.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Current interface')).toBeInTheDocument();
    await expect(canvas.queryByRole('radiogroup', { name: 'Preview shows' })).toBeNull();
    const link = canvasElement.querySelector(CANCEL)!;
    await expect(link.tagName).toBe('A');
    await expect(ink(link)).toBe(MUTED);
    await expect(size(link)).toBe('12px');
    await expect(canvas.getByRole('button', { name: 'Change plan' })).toHaveAttribute('data-twin');
    /* The captions, under the screen, each led by its mark's own tag. */
    const marked = canvas.getByRole('list', { name: 'What each marked element is' });
    await expect(marked).toHaveTextContent(/^Decision 1\s*Hand-built action · Billing settings\s*Small grey text, built by hand\. The system would make it a Button\.\s*A link built by hand, from the old billing app/);
    await expect(marked).toHaveTextContent(/The system’s Button\s*System Button · Billing settings\s*Every other action on the billing settings is the system’s Button\.\s*<Button variant="secondary">$/);
    const [decision, twinCap] = within(marked).getAllByRole('listitem');
    await expect(within(decision).getByText('Decision 1')).toHaveClass('studio-tag');
    await expect(within(twinCap).getByText('The system’s Button')).toHaveAttribute('data-tone', 'twin');
    await waitFor(() => expect(canvasElement.querySelector('.studio-mark')).not.toHaveAttribute('hidden'));
    await expect(canvasElement.querySelector('.studio-mark')).toHaveAttribute('data-label', 'Decision 1');
    await expect(getComputedStyle(canvasElement.querySelector('.studio-preview__frame')!).colorScheme).toBe('light');
  },
};

export const QuietVariant: Story = {
  args: { optionId: 'quiet' },
  parameters: {
    docs: { description: { story: 'The recommended direction, proposed: “Cancel subscription” is a Button now, a quiet one, and it looks exactly as the link did: the same ink and size, from the direction’s own lines, in the same box. That sameness is the point and the risk. Flipping to Current puts the link back, and nothing on the screen moves.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Proposed:/)).toHaveTextContent('Proposed: Add a quiet variant');
    await expect(canvas.getByText('Not applied')).toBeInTheDocument();
    const quiet = canvasElement.querySelector(CANCEL)!;
    await expect(quiet.tagName).toBe('BUTTON');
    await expect(quiet).toHaveClass('sketch__quiet');
    await expect(ink(quiet)).toBe(MUTED);
    await expect(size(quiet)).toBe('12px');
    const proposed = quiet.getBoundingClientRect();
    await userEvent.click(canvas.getByRole('radio', { name: 'Current' }));
    await expect(canvas.getByText('Current interface')).toBeInTheDocument();
    const link = canvasElement.querySelector(CANCEL)!;
    await expect(link.tagName).toBe('A');
    const current = link.getBoundingClientRect();
    await expect(Math.abs(current.width - proposed.width)).toBeLessThan(1);
    await expect(Math.abs(current.height - proposed.height)).toBeLessThan(1);
  },
};

export const ItsOwnChange: Story = {
  args: { optionId: 'own-change' },
  parameters: {
    docs: { description: { story: 'The other direction, proposed: “Cancel subscription” as the system’s Button, beside the others, the way its own change will draw it, which the toolbar says beside “Not applied”, because this change leaves the link as built. Flipping to Current puts the link back.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Proposed:/)).toHaveTextContent('Proposed: Make it a Button in its own change');
    await expect(canvas.getByText('As its own change will draw it')).toBeInTheDocument();
    await expect(canvasElement.querySelector(CANCEL)).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Cancel subscription' })).toHaveClass('btn--secondary');
    await userEvent.click(canvas.getByRole('radio', { name: 'Current' }));
    await expect(canvasElement.querySelector(CANCEL)?.tagName).toBe('A');
  },
};

export const RemoveCard: Story = {
  args: { work: card, optionId: 'quiet' },
  parameters: {
    docs: { description: { story: 'The case close to the rule and outside it, on the same screen: “Remove card”, built by hand the same way, beside “Update card”, which the system’s Button draws; proposed as a quiet Button.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Billing settings', { selector: 'strong' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Update card' })).toHaveAttribute('data-twin');
    await expect(canvasElement.querySelector('.settings__remove-card')).toHaveClass('sketch__quiet');
  },
};

export const NewToken: Story = {
  args: { work: meter, optionId: 'add' },
  parameters: {
    docs: { description: { story: 'The meter’s round ends, a line no token has the value of. Proposed, the direction’s token is declared on the frame for the preview alone, so var(--radius-full) draws the same round end the literal does: nothing moves, as the agent said.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const track = canvasElement.querySelector('.meter__track')!;
    await expect(getComputedStyle(track).borderTopLeftRadius).toBe('999px');
    await userEvent.click(canvas.getByRole('radio', { name: 'Current' }));
    await expect(getComputedStyle(track).borderTopLeftRadius).toBe('999px');
  },
};

export const SharedTable: Story = {
  args: { work: rows },
  parameters: {
    docs: { description: { story: 'The customer list, drawn as itself, the whole table marked; under it every screen the shared Table is on, by area, filled where it has a visual baseline and hollow where it has none, the one asked about ringed.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('40 screens draw the shared Table. 12 have a visual baseline; 28 have none.')).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('.studio-reach__areas .studio-reach__screen')).toHaveLength(40);
    await expect(canvasElement.querySelectorAll('.studio-reach__areas [data-baseline]')).toHaveLength(12);
    await expect(getComputedStyle(canvasElement.querySelector('.table tbody tr > :nth-child(2)')!).paddingTop).toBe('8px');
  },
};

export const SharedTableThisScreenOnly: Story = {
  args: { work: rows, optionId: 'local' },
  parameters: {
    docs: { description: { story: 'Keeping the fix on the screen asked about: the customer list’s rows taller, from the answer’s own line, and only its square marked as changing.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(getComputedStyle(canvasElement.querySelector('.table tbody tr > :nth-child(2)')!).paddingTop).toBe('12px');
    await expect(canvas.getByText('Proposed: only the customer list gets the change. The other 39 keep theirs.')).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('.studio-reach__areas [data-moves]')).toHaveLength(1);
  },
};

export const SharedTableApprovedOnce: Story = {
  args: { work: rows, optionId: 'shared' },
  parameters: {
    docs: { description: { story: 'Approving the shared change once: the same taller rows here, and every one of the forty squares marked as changing, the 28 without a baseline among them.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(getComputedStyle(canvasElement.querySelector('.table tbody tr > :nth-child(2)')!).paddingTop).toBe('12px');
    await expect(canvas.getByText('Proposed: all 40 screens get the change. 28 of them have no visual baseline.')).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('.studio-reach__areas [data-moves]')).toHaveLength(40);
  },
};

export const Dark: Story = {
  args: { optionId: 'quiet' },
  globals: { theme: 'dark' },
  parameters: {
    docs: { description: { story: 'The review dark, the product under it still light, because Relay has one scheme; the annotation is drawn in the light scheme for the same reason, where the dark theme’s pale teal would not be seen on white.' } },
  },
  play: async ({ canvasElement }) => {
    await expect(getComputedStyle(canvasElement.ownerDocument.documentElement).colorScheme).toBe('dark');
    await expect(getComputedStyle(canvasElement.querySelector('.studio-preview__frame')!).colorScheme).toBe('light');
    await expect(getComputedStyle(canvasElement.querySelector('.studio-mark')!).colorScheme).toBe('light');
  },
};

export const Narrow: Story = {
  args: { work: rows },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '22rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    /* The customer list is drawn at the 768 it is laid out for and scaled to
       the column, so its controls are smaller here than they are; the rule
       is off for this story, as for ComponentPreview's (rule 11), and the
       screen's own stories hold them at their real size. */
    a11y: { test: 'error', options: { rules: { 'target-size': { enabled: false } } } },
    docs: { description: { story: 'In a phone’s column the customer list is drawn at its 768 and scaled down to half, the smallest it goes, and the canvas pans sideways, a tab stop a keyboard can pan; the page itself never gets wider.' } },
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(within(canvasElement).getByRole('region', { name: 'Customer list, scrolls sideways' })).toBeInTheDocument());
    await expect(canvasElement.querySelector('.studio-preview__frame')).toHaveAttribute('data-scaled');
  },
};

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
const red = find(start, 'activity-red') as Work;
const meter = find(start, 'meter-radius') as Work;
const rows = find(table, 'table-rows') as Work;
const removed = find(play(start, { type: 'answer', id: 'activity-red', option: 'separate', makeRule: true }), 'invoice-removed') as Work;

function Stateful({ work, optionId, initial = 'proposed' }: { work: Work; optionId?: string; initial?: PreviewView }) {
  const [view, setView] = useState<PreviewView>(initial);
  const option = work.question?.options.find((o) => o.id === optionId && !o.asks);
  return <DecisionPreview work={work} option={option} view={view} onViewChange={setView} />;
}

const meta = {
  title: 'Review/DecisionPreview',
  component: Stateful,
  args: { work: red },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'The large pane of the delegated work’s workspace (Preview Studio): the screen a decision changes, rendered on the product’s surface in the product’s tokens, never pictured. The element in question is drawn unstyled and the preview writes its lines onto it: the change’s own values for the screen as it is (the literal #b42318), a selected direction’s for the screen as proposed. The toolbar names the screen and says, in words, whether this is the current interface or a proposal, not applied; a thin accent outline marks the decision, a dashed one its twin. Under the frame, what each red means, or every screen a shared component reaches.',
      },
    },
  },
} satisfies Meta<typeof Stateful>;

export default meta;
type Story = StoryObj<typeof meta>;

/* The color an element is drawn in, as the browser resolved it. */
const ink = (el: Element | null) => (el ? getComputedStyle(el).color : '');
const RED = 'rgb(180, 35, 24)'; /* #b42318, the product's danger and the hard-coded literal */
const MUTED = 'rgb(106, 106, 118)'; /* #6a6a76, the product's muted ink */

export const Current: Story = {
  parameters: {
    docs: { description: { story: 'Nothing selected: the billing activity as it is, beside the payment history. The old plan and “Payment failed” are the same red, which is the question; teal is only the annotation. Under each screen, in its own column, a caption led by the tag its mark carries says what that red means. No view control yet, because there is nothing to compare.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Current interface')).toBeInTheDocument();
    await expect(canvas.queryByRole('radiogroup', { name: 'Preview shows' })).toBeNull();
    const old = canvasElement.querySelector('.activity__old');
    await expect(ink(old)).toBe(RED);
    await expect(ink(canvasElement.querySelector('.sketch__status--failed'))).toBe(RED);
    await expect(canvasElement.querySelector('.sketch__added')).toBeNull();
    /* The captions, under their screens, each led by its mark's own tag. */
    const reds = canvas.getByRole('list', { name: 'The two reds' });
    await expect(reds).toHaveTextContent(/^Decision 1\s*Replaced value · Billing activity\s*Red means this value was replaced\.\s*Hard-coded #b42318, from the old billing app/);
    await expect(reds).toHaveTextContent(/Same red: failure\s*Failure · Payment history\s*Red means something went wrong\.\s*--color-danger$/);
    const [decision, twinCap] = within(reds).getAllByRole('listitem');
    await expect(within(decision).getByText('Decision 1')).toHaveClass('studio-tag');
    await expect(within(twinCap).getByText('Same red: failure')).toHaveAttribute('data-tone', 'twin');
    await waitFor(() => expect(canvasElement.querySelector('.studio-mark')).not.toHaveAttribute('hidden'));
    await expect(canvasElement.querySelector('.studio-mark')).toHaveAttribute('data-label', 'Decision 1');
    await expect(getComputedStyle(canvasElement.querySelector('.studio-preview__frame')!).colorScheme).toBe('light');
  },
};

export const SeparateTheMeanings: Story = {
  args: { optionId: 'separate' },
  parameters: {
    docs: { description: { story: 'The recommended direction, proposed: the old plan neutral (the product’s muted ink, from the direction’s own line) with the “Replaced” label; the failure still red. The toolbar says it is proposed and not applied. Flipping to Current puts the red back and takes the label away.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Proposed:/)).toHaveTextContent('Proposed: Separate the meanings');
    await expect(canvas.getByText('Not applied')).toBeInTheDocument();
    await expect(ink(canvasElement.querySelector('.activity__old'))).toBe(MUTED);
    await expect(ink(canvasElement.querySelector('.sketch__status--failed'))).toBe(RED);
    await expect(canvasElement.querySelector('.sketch__added')).toHaveTextContent('Replaced');
    await userEvent.click(canvas.getByRole('radio', { name: 'Current' }));
    await expect(canvas.getByText('Current interface')).toBeInTheDocument();
    await expect(ink(canvasElement.querySelector('.activity__old'))).toBe(RED);
    await expect(canvasElement.querySelector('.sketch__added')).toBeNull();
  },
};

export const KeepTheRed: Story = {
  args: { optionId: 'keep' },
  parameters: {
    docs: { description: { story: 'The other direction, proposed: the old plan stays red and gains the same “Replaced” label; the failure stays red. The two reds are still the same red, now told apart by the word.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Proposed:/)).toHaveTextContent('Proposed: Keep the red for now');
    await expect(ink(canvasElement.querySelector('.activity__old'))).toBe(RED);
    await expect(ink(canvasElement.querySelector('.sketch__status--failed'))).toBe(RED);
    await expect(canvasElement.querySelector('.sketch__added')).toHaveTextContent('Replaced');
  },
};

export const RemovedValue: Story = {
  args: { work: removed, optionId: 'separate' },
  parameters: {
    docs: { description: { story: 'A held change of the same question on another screen: the invoice’s removed line item, struck through with nothing replacing it, proposed neutral with its “Removed” label.' } },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Invoice detail', { selector: 'strong' })).toBeInTheDocument();
    await expect(ink(canvasElement.querySelector('.invoice__line--removed'))).toBe(MUTED);
    await expect(canvasElement.querySelector('.sketch__added')).toHaveTextContent('Removed');
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
  args: { optionId: 'separate' },
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

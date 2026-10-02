import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { bulkActionsWithRules } from '../../data/scenario';
import { ReturnPanel } from './ReturnPanel';

const findings = bulkActionsWithRules.findings;

/* What the screen includes by default: every finding that has a
   correction and is not a note. The notes can be added by hand. */
const returnable = findings.filter((f) => f.correction.length > 0).map((f) => f.id);
const defaults = findings.filter((f) => f.correction.length > 0 && f.severity !== 'note').map((f) => f.id);

const meta = {
  title: 'Review/ReturnPanel',
  component: ReturnPanel,
  args: { findings, initiallyIncluded: new Set(defaults), onSend: fn(), onClose: fn() },
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'Return to agent. The reviewer chooses findings, each contributes its correction and its rule to one message, and the reviewer edits the whole before sending. The text is what the agent receives, so it is precise on purpose: which component, which prop, which file, which story to add. A free text box would ask the reviewer to write that from memory, and most would not. Editing the message marks it edited and offers a way back to the composed text, so a reviewer can change a word without losing the structure. Nothing can be sent while the message is empty. It is a dialog, over a scrim: focus moves in and stays in, Escape closes it, and focus goes back to where it was. Once the message has been edited, Escape, the scrim and Cancel ask before closing, because closing would lose the reviewer’s own words: the footer becomes the question, with Keep editing beside Discard and close.',
      },
    },
  },
} satisfies Meta<typeof ReturnPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'The scenario’s findings with the screen’s default selection: the five blocking and decision findings checked, the note unchecked, the message composed from the five.' } },
  },
};

export const NothingIncluded: Story = {
  args: { initiallyIncluded: new Set<string>() },
  parameters: {
    docs: { description: { story: 'No finding chosen. The message is empty with a placeholder that says what to do, and Send is disabled until there is something to send.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox', { name: 'Message to the agent' })).toHaveValue('');
    await expect(canvas.getByRole('button', { name: 'Send to agent' })).toBeDisabled();
  },
};

export const Edited: Story = {
  parameters: {
    docs: { description: { story: 'Types a line onto the end of the composed message. The label gains an "edited" marker and a reset to the composed text appears under the box.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole('textbox', { name: 'Message to the agent' });
    await userEvent.type(box, '\n\nAlso add a Narrow story for the selected state.');
    await expect(canvas.getByText('edited')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Reset to the composed message' })).toBeInTheDocument();
    await expect((box as HTMLTextAreaElement).value).toContain('Also add a Narrow story');
  },
};

export const AllIncluded: Story = {
  args: { initiallyIncluded: new Set(returnable) },
  parameters: {
    docs: { description: { story: 'Every returnable finding checked, the note included: six of six, and a six-point message.' } },
  },
};

export const FocusStaysInside: Story = {
  parameters: {
    docs: { description: { story: 'Tabs forward more times than the dialog has controls, then backward the same number. Focus wraps at both ends and is never on the page behind, which would still be operable under an aria-modal dialog.' } },
  },
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole('dialog');
    for (let i = 0; i < 24; i += 1) {
      await userEvent.tab();
      await expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let i = 0; i < 24; i += 1) {
      await userEvent.tab({ shift: true });
      await expect(dialog.contains(document.activeElement)).toBe(true);
    }
  },
};

export const EscapeClosesWhenUnedited: Story = {
  parameters: {
    docs: { description: { story: 'Nothing of the reviewer’s own to lose, so Escape closes at once and asks nothing.' } },
  },
  play: async ({ args }) => {
    await userEvent.keyboard('{Escape}');
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

export const AsksBeforeDiscardingEdits: Story = {
  parameters: {
    docs: { description: { story: 'Types a line, then presses Escape. The footer becomes the question and focus lands on Discard and close; nothing has closed. Escape again means keep editing, and focus returns to the message with the typed line still there.' } },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole('textbox', { name: 'Message to the agent' }) as HTMLTextAreaElement;
    await userEvent.type(box, ' My own words.');
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByText('Discard your edits to the message?')).toBeInTheDocument();
    await expect(args.onClose).not.toHaveBeenCalled();
    await expect(canvas.getByRole('button', { name: 'Discard and close' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByText('Discard your edits to the message?')).not.toBeInTheDocument();
    await expect(box).toHaveFocus();
    await expect(box.value).toContain('My own words.');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Discard and close' }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

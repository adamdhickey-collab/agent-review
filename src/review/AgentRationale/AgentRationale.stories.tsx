import type { Meta, StoryObj } from '@storybook/react-vite';
import { bulkActionsWithRules } from '../../data/scenario';
import type { Rationale } from '../../data/types';
import { AgentRationale } from './AgentRationale';

const minimal: Rationale = {
  request: 'Rename the Archive action to Close account.',
  summary: 'Renamed the menu item and its confirmation title.',
  decisions: [],
  reported: { reused: [], changed: [], newStates: [], newPatterns: 'none' },
};

/* A request of about four hundred characters: the kind a person writes
   when they paste the ticket in. */
const longRequest: Rationale = {
  ...bulkActionsWithRules.rationale,
  request:
    'Add bulk actions to the customer table using the existing component system. A person should be able to select several customers at once, see how many are selected, and archive or export them in one step without leaving the table. Keep the existing sorting and the toolbar as they are, use the Checkbox for the selection column with a select-all in the header, and make sure the new state has stories so it is covered by the visual run and by axe before it ships.',
};

const meta = {
  title: 'Review/AgentRationale',
  component: AgentRationale,
  args: { rationale: bulkActionsWithRules.rationale, agentName: bulkActionsWithRules.agent.name },
  parameters: {
    a11y: { test: 'error' },
    docs: {
      description: {
        component:
          'What the agent was asked, what it says it did, and what it reported changing: three blocks, each in the agent’s own words and quoted, so a reviewer never mistakes the agent’s account for the system’s finding. The request is the first thing, because a review of a change starts with whether the change is the one that was asked for. The reported list at the end is what the findings are checked against: an agent that says it reused Checkbox and changed nothing shared, beside a visual finding that the shared Button moved, is the gap the review exists to show. An empty list says "none" in words rather than leaving a blank row.',
      },
    },
  },
} satisfies Meta<typeof AgentRationale>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'The bulk-actions rationale: the request, a summary with four listed decisions, and a reported list that names one shared change and two new states.' } },
  },
};

export const Minimal: Story = {
  args: { rationale: minimal },
  parameters: {
    docs: { description: { story: 'A one-line rename: no decisions listed, nothing reused or changed. Each empty list says so rather than vanishing, so the shape of the block is the same for every change.' } },
  },
};

export const LongRequest: Story = {
  args: { rationale: longRequest },
  parameters: {
    docs: { description: { story: 'A request of four hundred characters, the length of a pasted ticket. The quote wraps at the column’s measure and stays a quote.' } },
  },
};

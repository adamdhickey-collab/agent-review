import { customers, type Customer } from '../product/customers/customers';
import { NO_FEATURES, STORY_BATCH, initialCycle, outcomeOf, type DirectionId } from './cycle';

/* THE QUICK PATH (2026-11-22): the scenario, the three fixes and the
   decision, for someone who has a minute and not the six stages.

   It is the design cycle's own material, read rather than replayed: the
   same customers, the same batch (STORY_BATCH), the same three working
   directions (product/customers/ArchiveFlow.tsx) and the same rule Learn
   offers to save. Nothing here touches the cycle's state. The decision
   shown is Adam's, the one the case study argues for, so the quick path
   never records a choice as the visitor's.

   Three roles, one word each, here and in the case study: the coding agent
   builds from the rules it is given; the designer, Adam, sets the rules,
   compares what was built and decides the behavior; the account manager is
   the person in Relay who selects customers and archives them. */

/** The eight customers the case study's lists show, in its order. */
const ROWS = ['c_01HZKB', 'c_01HZKV', 'c_01HZKJ', 'c_01HZL3', 'c_01HZLB', 'c_01HZK3', 'c_01HZK7', 'c_01HZKN'];

export const QUICK_CUSTOMERS: Customer[] = ROWS.map((id) => customers.find((c) => c.id === id)).filter((c): c is Customer => !!c);

/** The mistake: a trial, a churned customer, and Northside Trucking, active and paying. */
export const RISKY_BATCH = STORY_BATCH;

/** A routine cleanup: nobody active in it. */
export const ROUTINE_BATCH = ['c_01HZKV', 'c_01HZL3', 'c_01HZLB'];

export interface Fix {
  id: DirectionId;
  name: string;
  does: string;
  tradeoff: string;
}

/** The three fixes, by the short names the case study uses. Each is one of ArchiveFlow's directions, unchanged. */
export const FIXES: readonly Fix[] = [
  { id: 'undo', name: 'Undo afterward', does: 'Archive immediately and provide Undo.', tradeoff: 'Cleanup stays fast. Someone has to notice the mistake.' },
  { id: 'confirm', name: 'Confirm first', does: 'Ask for confirmation before archiving and identify the active customer.', tradeoff: 'Names the risk. Adds a confirmation to every cleanup.' },
  { id: 'review', name: 'Review the batch', does: 'Show the selected customers and let someone adjust the selection before archiving.', tradeoff: 'Lets someone adjust the selection. Makes every cleanup longer.' },
];

/** The decision as the cycle would build it: the review, only when the batch holds an active customer. */
export const DECISION = { direction: 'review' as const, features: { onlyWhenActive: true } };

/** The rule the decision becomes, in the words Learn saves it in. */
export const DECISION_RULE =
  outcomeOf({ ...initialCycle(), direction: 'review', stops: 'active', required: { ...NO_FEATURES, 'names-active': true, 'only-active': true } })?.guidance ?? '';

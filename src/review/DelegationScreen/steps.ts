import type { Work } from '../../data/delegation';

/* The steps a decision asks for, in the order the workspace asks for them.
   Start here names them over the workspace (DelegationScreen.tsx), and the
   desk, from 76rem, over its decision panel, each by its first word
   (DeskSteps): Compare, Choose, Preview, Apply. Kept in one place so the two
   can never disagree. A trade-off is compared, chosen, previewed and
   applied; any other question is looked at, answered and applied. */
export type StartStep = 'look' | 'choose' | 'preview' | 'apply';

export function startSteps(work: Work): { label: string; to: StartStep }[] {
  const q = work.question!;
  const tradeoff = q.options.some((o) => o.benefits);
  return tradeoff
    ? [
        { label: q.start ?? 'Compare the directions', to: 'look' },
        { label: 'Choose a direction', to: 'choose' },
        { label: 'Preview it', to: 'preview' },
        { label: 'Apply it', to: 'apply' },
      ]
    : [
        { label: q.kind === 'scope' ? (q.reach ? 'See what the fix reaches' : 'See what it would change') : 'Compare the readings', to: 'look' },
        { label: 'Choose an answer', to: 'choose' },
        { label: 'Apply it', to: 'apply' },
      ];
}

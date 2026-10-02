# Working in this repository

This is a React component system, the product (Relay) built from it, and
Agent Review, the tool a person uses to review UI that an agent changed.

**Before changing anything under `src/` that renders, read
`skills/ui-quality/SKILL.md` and work inside it.** It is twelve rules,
each with the command that checks it. The reviewer reads your change
against those rules, and the checks run in CI.

## Layout

```
src/tokens/        the token layer (tokens.css) and its typed names (tokens.ts)
src/components/    the system; import from src/components/index.ts
src/product/       Relay's screens: the customer table, the invoice list
src/review/        Agent Review's own screens
src/data/          the review scenario
src/app/           the shell, the router, the base stylesheet
skills/            the rules an agent reads
docs/              exploration, the experiment, decisions (PROJECT.md at the root)
tests/             Playwright visual baselines, the 768 overflow check and the phone check
```

## Commands

```bash
npm run dev            # the app at http://localhost:5173/agent-review/
npm run storybook      # the Storybook at http://localhost:6006/
npm run check          # typecheck, lint, token lint, story tests (with axe)
npm run test:visual    # Playwright screenshots against tests/__screenshots__
npm run build          # dist/, with the Storybook under dist/storybook/
```

## Storybook over MCP

With the Storybook running, its MCP server is at `http://localhost:6006/mcp`
(`.mcp.json` registers it). Use it to find the story for a component
before changing the component, and to run a story's tests after.

## Conventions

- One directory per component, holding the component, its stylesheet and
  its stories. Plain CSS, class names `block__element--modifier`, every
  value a token.
- State lives in ARIA where ARIA has a word for it (`aria-selected`,
  `aria-pressed`, `aria-sort`, `aria-checked`), and in an `is-*` class
  only when it does not.
- A screen owns data and behaviour; a component owns markup and states.
- Commit messages say what changed for a reader, in a sentence.

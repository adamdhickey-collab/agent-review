# Exploration: three information architectures

Pencil was not available in this environment (no application, no MCP server),
so this is the lightweight equivalent: three wireframes of the Agent Review
change-detail screen, drawn by hand as SVG in code. Each is a 1440x900
greyscale frame with real labels and one accent reserved for the selected or
primary element. They compare structure, not finish.

All three show one scenario, an agent asked to add bulk actions to Relay's
customer table, with the same seven findings.

## A. Visual-diff-first (`visual-diff-first.svg`)

The before/after preview takes about 70% of the width under a thin top bar
with the decision buttons. Findings are numbered pins on the after pane,
listed in a narrow right rail.

Optimizes for the designer's first question: what does it look like now.
The whole change is visible at a real width, and a pin lands on the thing it
describes.

Serves best the product designer reviewing a feature they specified.

Tradeoffs. Anything that is not visual has nowhere to land: the token
deviation and the missing story are pins 6 and 7 sitting on the bar by
convention. And the rail is too narrow for evidence; the rule, measurement
and correction get three lines.

## B. Validation-first (`validation-first.svg`)

A ranked findings list is the left spine, about 40% of the width, grouped by
check. The right side is the selected finding's detail: evidence, the rule,
what the system already has, a correction to send back and a preview
thumbnail. The decision bar sits under the list.

Optimizes for triage and the engineer's question: is this blocking, and what
exactly goes back to the agent.

Serves best the reviewer accountable for the merge, who has to act on the
result.

Tradeoffs. The consequence is a thumbnail; seeing a 3.1:1 button in context
means leaving the list. And ranking by severity turns three visual changes
that together describe the feature into three unrelated rows.

## C. Component-first (`component-first.svg`)

The affected components are the left spine, the selected one expanded to its
stories and states. The center is that component's states grid, like a
Storybook canvas, with findings pinned to the state that shows them. The
decision bar is top right.

Optimizes for the design-system question: did the agent reuse what exists,
and does the new thing have the states and story the system requires.

Serves best the design-system owner, who reviews for drift rather than for
the feature.

Tradeoffs. This is a feature review and the feature is only a thumbnail. And
the spine is four items with one that matters, so the before/after
comparison has no home.

## Why the final direction is B's spine with A's evidence in view

The findings list stays as the left column, because it is the only spine
that holds every kind of result at once: a contrast failure, a token value, a
missing story and a layout shift are rows of one ranked list, each with a
checkbox that composes the return message. The right column is A's live
preview rather than B's thumbnail, always visible, before and after.

What joins them is that selecting a finding reproduces it. Each row carries a
viewport width, a side and an element, and on selection the preview sets
that width, shows the before or after side and outlines the element. The
reviewer never leaves the list to see the consequence, which was B's
weakness, and a finding that is not visual still has a row, which was A's.

Component inspection becomes a detail inside a finding ("Button / danger /
compact already covers this", linked to the story) rather than a top-level
mode. Here the component question arises from a finding, not before it, so
C's spine is kept as a link, not a screen.

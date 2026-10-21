# The next validation: observed sessions

**Status: planned, not run.** Nobody has been recruited, no session has been
held, and there are no findings. Everything below is the plan. When sessions
happen, their notes go in `docs/validation/sessions/` and the synthesis in
`docs/validation/findings.md`, and this line changes to say so.

Agent Review has been built and reviewed by its author only. Its two runs are
simulated, and the experiment it grew from (`docs/experiment/`) tested agents
and checks, not people. So every claim about how a person reads this screen
is still a hypothesis. This plan is the cheapest test that could prove one of
them wrong.

## What it is for

Five questions, each a claim the product makes about the person using it:

1. **Understanding.** Can a person say what the agent completed and what is
   still unresolved, from the account alone, without opening a record?
2. **Catching.** Will a person notice a recommendation that is wrong for the
   situation, or an action the agent took past its authority?
3. **Weighing.** Does a person compare the two directions before choosing, or
   take the one marked "Recommended" because it is marked?
4. **Rule scope.** After making a rule, can a person say what it covers, what
   it doesn't, and what revoking it does and doesn't undo?
5. **Reach.** Before allowing a change to a shared component, does a person
   look at what else it reaches, and do they understand who is allowed to
   approve it?

PROJECT.md's list ("What would tell whether this works") is the same
ground; this turns it into tasks.

## Who

Four or five people who already supervise work done by coding agents: product
designers, design engineers or front-end engineers who review or merge an
agent's changes at least weekly. Mix the two roles; at least one person who
owns a shared component library, because task 5 is about authority over one.

Screen for: reviewing agent-written UI changes in their current job, and not
having seen Agent Review or its case study. Exclude anyone who has.

Five is enough to find the misunderstandings that most people hit. It is not
enough to estimate how often anything happens, and nothing from these
sessions will be reported as a rate.

## How

- 45 to 60 minutes, remote, moderated, one person at a time, thinking aloud.
- The deployed prototype at a recorded commit, in the theme the person
  prefers. Reset the demo before each task that needs a fresh run.
- Say at the start that the runs are simulated and nothing they do touches a
  real repository; say nothing about what the screen means.
- Ask before recording. Quote nobody without their permission, and never by
  name.
- The moderator does not explain the screen. When asked "what does this
  mean?", the answer is "what do you think it means?", and the question is
  itself a finding.

## Tasks

Each task has a prompt read aloud, what counts as success, and what to note.
Measures for every task: completed or not, the time to a first action, any
misreading said aloud, and a confidence rating from 1 to 5 asked after.

### 1. What happened (understanding)

**Prompt.** "This is a job someone handed to a coding agent an hour ago. Take
a minute, then tell me what it did and what is left."

**Success.** Says, in their own words, that most changes were made and
checked without anyone, that two decisions are waiting on them, and names at
least one thing that is unresolved (the inconclusive accessibility check).

**Note.** Whether they read the account, the tiles or the bar first; whether
"literals" and "tokens" stop them; whether they think anything has failed.

### 2. Something wrong (catching)

**Prompt.** "Look over what the agent did on its own. Is there anything you
would not have let it do?"

**Needs a seeded variant first.** The two runs as built contain no wrong
action and no unauthorized one: every completed change is inside its
boundaries. Before sessions, add a variant run (a third sample in the run
switcher, labelled as a test) with one completed change that went past a
boundary without asking, recorded as if it were routine, and one
recommendation that contradicts the request. Without that variant this task
can only show whether people look, not whether they catch.

**Success.** Finds the change past the boundary, by its record or by the
boundaries panel, and says why it should not have happened.

**Note.** Where they look first; whether the boundary citation on each record
is read; whether "Recommended" is challenged anywhere.

### 3. The quiet cancel (weighing)

**Prompt.** "The agent stopped on this. Decide it the way you would at work."

**Success.** Opens or reads both directions, including the risks, before
selecting; previews before applying; gives a reason in their own words.

**Note.** Time spent on the second direction; whether they open "3 benefits
and 3 risks"; whether they choose the recommended one and can say why without
pointing at the badge; whether preview is mistaken for apply.

### 4. The rule (rule scope)

**Prompt.** After task 3, if they did not make a rule: "Suppose this comes up
again next week. What would you do here?" Then: "Tell me what the rule you
made will and won't do."

**Success.** States that it covers actions that end or reduce a
subscription, on the billing screens only; names one thing it excludes; says that revoking it stops it
applying without undoing what it already did.

**Note.** Whether they think the agent "learned"; whether they find the rule
again under the boundaries; whether they try to edit or revoke it, and
whether that works for them.

### 5. The shared table (reach and authority)

**Prompt.** Switch to the shared-table run. "Here's a fix to a table used on
other screens. What would you want to know before saying yes?"

**Success.** Looks at the forty screens before deciding; distinguishes the
local fix from the shared one; says the shared change is someone else's to
approve (the table's owner), or chooses more evidence first and reads what
it returns.

**Note.** Whether "Needs approval" is understood as different from "Needs
judgment"; whether they read the owner line; whether they approve all forty
without opening the evidence.

## What to record per session

One file per session in `docs/validation/sessions/`, named by number and
date, with the same table for every task:

| Task | Done | Time to first action | Misreadings, said aloud | Decision taken | Confidence | Design change it suggests |
| --- | --- | --- | --- | --- | --- | --- |

No names, no employers. A participant is P1 to P5.

## Turning it into changes

After all sessions, `findings.md` groups the misreadings by task and by the
part of the screen they came from. A finding is reported with how many of the
five hit it and what they said, never as a percentage. Each one ends in one of
three outcomes: a change to make (with the issue it became), a change to test
again, or no change and why.

What would change the design, decided before the sessions so the results
can't move the goalposts:

- Two or more people unable to say what is unresolved after task 1: the
  account's lead and the unresolved line are rewritten before anything else.
- Two or more choosing "Recommended" without reading the other direction's
  risk: the badge's placement and weight are revisited.
- Anyone believing the agent learned from a decision: every place a rule is
  described is reworded.
- Anyone approving all forty screens without looking at the reach: the
  approval answer gains a step that shows the reach first.

---
name: trim-change
description: >-
  Make a working change simpler and smaller, with fewer concepts for a reader to understand. Two fresh sub-agents
  look for missing structure (the same thing built twice, steps repeated with one difference, mechanisms more general
  than their uses, existing code that could serve the change) and for local waste (checks nothing can trigger,
  wrappers that only forward, comments that restate the code). What keeps the behavior and stays inside the change is
  applied and committed; larger refactorings of existing code and behavior cuts (unlikely edge cases, extras nobody
  asked for) are reported for the human to decide, in the pull request when another skill called this one. Use after
  implementing a change that works but is too much code for what it does, inside implement-issue between the checks
  and the review, or when asked to trim, slim down or simplify a change ("trim this", "mach das schlanker",
  "entschlacke den Diff", "weniger Code").
---

# Trim code

Agent-written code often works but carries more concepts than its job needs: two representations of the same
thing, steps repeated with one difference, mechanisms more general than their uses, checks nothing can trigger,
options nobody asked for. The task is to find what the diff can do without, apply what is safe, and put the rest in
front of the human.

The measure is concepts a reader must understand first, lines of logic second. A diff can lose whole concepts and
barely get shorter; that is still the win. Count honestly: the concepts that disappear minus the ones that appear.
A new object, representation or protocol is a concept. So is a **mode**: anything an abstraction branches on so it
can serve one more use, like a flag, an option or a type check. A mode is worth it when it removes more than it adds.

The large restructurings are the reason this skill exists, and existing code is in scope: often the biggest win is
existing code that now does the diff's work, or one abstraction for the old and the new use instead of a second one
next to it. Cleaning up existing code the diff doesn't need is out of scope.

This skill adapts the `trim-code` skill of [triskweline/skills](https://github.com/triskweline/skills) (MIT, Henning
Koch) to this team's flow: it runs unattended inside `implement-issue`, commits what it applies, and hands the
decisions to the pull request.

## Terms

- **The diff** is the change you are trimming: a commit range or uncommitted work, as it was before trimming began.
  Resolve its base like a review would: a ref named in the invocation (`/trim-change develop`), else the
  `claude-review-target` ref if `git rev-parse --verify claude-review-target` succeeds, else the remote's default
  branch (`origin/HEAD`, then `main`, then `master`). An empty diff ends the run with one line.
- **Existing code** is code that existed before the diff: every line the diff neither adds nor modifies.
- **Intended behavior** is what the requirements, the issue, the specification or the docs ask for, what tests pin
  down, and what code in this codebase uses. Anything else a piece of code does is free to change, including behavior
  that is clearly wrong. A detail nobody could sensibly rely on doesn't count, even where a test pins it down: the
  order of keys in a JSON object, whitespace, a typo in a message. A changed error type, a different error winning,
  or new keys in a response are not such details.
- **Decisions already made** are what the human decided (stated as what, not why), the project's conventions in
  CLAUDE.md, CONTRIBUTING.md or the README, and the repository's implementation guide when it has one
  (`docs/implementing-issues.md` on the base branch, or on the remote branch `implementing-issues-guide`:
  `git show origin/implementing-issues-guide:docs/implementing-issues.md`). Your own design choices don't count,
  even where you wrote them into the code. What a convention requires is never waste: a `// SAFETY:` comment, a doc
  comment on a public function, an explicit error type, a test per acceptance criterion.
- **The obstruction sentence** ties an idea that touches existing code to the diff: "The diff needed X because
  existing code does, lacks or is shaped as Y; this idea makes one of them unnecessary by Z." X is concrete code in
  the diff: files and lines. The idea may delete either side, whichever fits the result worse. An idea without such
  an X is cleanup, and out of scope.

Five numbers describe what an idea costs and saves, as rough estimates in round numbers:

- **Diff savings:** the lines of logic the idea deletes from the diff.
- **Existing savings:** the lines of logic it deletes in existing code.
- **Total savings:** both together.
- **Existing churn:** the lines of existing code it modifies or adds to, renames and updated call sites included.
  Code the idea writes inside the diff doesn't count: the human reviews the diff anyway.
- **Concept gain:** the concepts it removes, minus the ones it adds.

**The ratio** limits how much existing code an idea pulls into the diff: its existing churn may be at most about
twice its diff savings. Existing savings don't count toward the ratio; everywhere else they count as part of the
total savings. Clearly more is over the ratio; close is within it.

## Three lists

Every idea ends up on one of three lists, or is killed.

- **L1 trims** keep the intended behavior, verifiably. They either touch no existing code, or touch it within the
  ratio and with an obstruction sentence. A bug fix is a trim when it is certain: a concrete input violates a
  requirement you can quote, and the fix is local in the diff. Trims are always applied, without asking.
- **L2 refactorings** keep the intended behavior, verifiably, but touch existing code beyond the ratio. They cost
  the human more review than they spare. They need the human's approval.
- **L3 behavior cuts** need a decision beyond review: they change intended behavior, or can't be shown to keep it,
  or add a dependency, or change a data schema. Uncertain bug fixes belong here too. They need the human's approval.

Where the approval happens depends on who called you. Called by a person: in this conversation, after the report
(step 6). Called by another skill, such as `implement-issue`: the human is away, so L2 and L3 go into the pull
request as described in step 5, and the run ends after the report.

## Steps

1. Brief the sub-agents (main agent).
2. Gather ideas (sub-agents, in parallel).
3. Groom and sort the ideas (main agent).
4. Execute the L1 trims (main agent).
5. Report (main agent).
6. Approve (human), then execute the approved ideas (main agent). Only when a person called you.

Before step 1, run the project's tests and linters once, quietly. If they fail before you changed anything, stop and
say so: trimming on a red tree hides what the cuts break.

## 1. Brief the sub-agents (main agent)

Use two fresh sub-agents, a **structure pass** and a **local pass** (in Claude Code: the `Agent` tool with the
`general-purpose` agent), not forks of your context: they should see the code, not your justifications for it. Run
them in parallel. Give both the same brief:

- **Requirements:** what you know about them, without your reasoning about how you built the diff. Quote the issue,
  its acceptance criteria or the human's own words where you can: one paraphrased word can steer the findings.
- **Decisions already made** (see the terms), as what, not why, and where to find the conventions and the
  implementation guide.
- **Questions the human asked** about the structure, quoted.
- **The diff:** the commit range or the base ref, including uncommitted work. Tell them to search the whole codebase,
  not just the diff: reuse findings depend on it.

Then pass the **structure pass** the intro, the terms, the three lists and sections 2.1, 2.2 and 2.4 of this file,
verbatim. Pass the **local pass** the same with 2.3 instead of 2.2.

## 2. Gather ideas (sub-agents)

### 2.1 Rules for both passes

You report; you don't edit any file.

Keep your analysis shallow: enough to describe each idea, name its intent and estimate its size. Don't research
evidence or write detailed plans; the main agent does that, and only for the ideas it executes.

Report every idea you find, small or large: small trims add up, and large ones are the biggest lever. Don't leave
out an idea because it is small, because it would change behavior, or because it reshapes a lot of existing code.
Leave out only ideas that contradict a decision in your brief. Work from the largest structures and the most-used
paths down.

Each pass has its own list of ideas that cut behavior, under "Cut behavior". For each such idea, say whether a
requirement asks for that behavior, and quote it if one does.

#### What doesn't count as simpler

- Shorter but denser doesn't count. If a reader has to take an expression apart to understand it, it isn't simpler:
  several statements packed into one line, a long call chain, a nested ternary, a clever trick. No deleting blank
  lines, no metaprogramming or generic mechanisms where two explicit cases would do.
- After the idea, each abstraction must still be describable in one sentence without "and" or "unless". A mode it
  needs to serve both uses counts as a concept.
- Don't lose intent or move knowledge. A function whose name says what the code means stays, even with one caller.
  So does a variable or constant used once that names an expression or keeps a call out of a nested expression. A
  rule stays where the project keeps that kind of rule: an authorization check used by a single controller still
  belongs with the other authorization rules.
- A check against hostile input (authorization, tampering, injection, limits on what a client may send, a
  signature) is not an edge case. Leave it, even when it can't fail today: defense in depth is deliberate. Don't
  report dropping it.
- Don't merge two things that mean different things just because they're handled the same or used together today.
  Two concerns are different when one could be needed without the other, or when they change for different reasons.
  If callers repeat the pair, a third abstraction that calls both is fine.
- Don't add types or structure that only add boilerplate.
- Don't trim tests for their own sake. Repetition in tests is often deliberate: overlapping coverage across layers,
  independent setup instead of shared hooks, one test per acceptance criterion. When code is deleted or inlined, its
  tests are deleted or moved with it. Code that only a test reaches, a single branch included, is dead code and goes
  with its test.
- What the project's conventions or its implementation guide require stays, whatever it costs.
- Stay on concepts and size. Naming and style are for other reviews.

### 2.2 The structure pass

You look for missing structure. The local pass covers local waste like dead checks; if local waste is part of a
structural idea, include it in that idea.

#### Map first

Write down, as a short table: the structures and derived values the diff builds or touches (records, maps, trees,
query results, view models, parsed input, values computed per item; facts a consumer derives for itself from the raw
input count too, with the consumer as their builder); existing structures that hold the same or similar information;
and for each of them who builds it, from what, and who consumes it. A consumer is an endpoint, job, command, C API
function, operation or output format. If the diff builds no such structures, say so in one line and go on to "Then
look at the diff as a whole".

#### Look for these in the map

- Two entries built from the same source. They are the first thing to look at.
- The same structure built more than once, or in two shapes, e.g. one for reading and one for writing, or a new one
  next to an existing one. Find the one representation both could use, and make the others views of it.
- Several consumers each deriving the same facts from the raw input. Name the one representation they would all
  consume, whole: if consumers need different parts, that is two representations, not one with optional fields.
- Work that is computed and then thrown away on some path.
- Two paths running the same steps, differing in one. Make it one sequence that takes the differing step as input,
  as a callback or an object, not a flag it branches on. The shared sequence takes only that one step from its
  callers; everything else comes in as arguments and goes out as its return value.
- An argument threaded through a recursion or a chain of calls: often a missing object, a view or a context.
- A side channel: state one method sets so another can read it. Usually a missing argument or object.
- Two copies of the same code. Before extracting a helper, ask why the copies exist. If a missing representation
  would make both unnecessary, that is the idea.

#### Then look at the diff as a whole

- A mechanism more general than its uses: a trait or interface with one implementation, a registry with two entries,
  a strategy with one strategy, a layer that only forwards. Replace it with the concrete cases.
- Conditionals on the same question in several places, or in code unrelated to the feature; a long if/match chain in
  one place. Both usually mean a missing model.
- Special cases that could become the normal case, e.g. lists that handle one, many and none the same way.
- Several booleans or optional fields that together describe one state: make it one value, an enum, so invalid
  combinations can't exist and the checks for them go away.
- Casts, optional values or loose maps that hide a rule that always holds: make it hold where the value is created,
  and the checks further down go away.
- A value stored that could be computed from another one: compute it, unless a comment or measurement justifies the
  copy. Every copy can disagree with its source.
- A type, module or file introduced for a single use that isn't where that kind of rule belongs in this project:
  check whether its body reads better at the call site.
- Code in the project, or in a library it already depends on, that does this, or would after a refactoring, however
  large.
- A small new dependency that would replace a lot of custom code (an L3 idea: dependencies are a decision).

#### Cut behavior

- Extras nobody asked for: more options, filters, sorting, formats or friendlier messages than the requirements need.
- A requirement that costs far more code than it seems worth. Say how much of the diff it accounts for.

### 2.3 The local pass

You look for local waste, one place at a time. The structure pass covers missing structure.

- For every guard, null check, error handler and fallback, name the input that would trigger it:
  - The input can't occur, because a type, a constraint or the code on every path rules it out: delete the check.
  - It is outside input (parameters, files, network responses) and not yet checked: check it once where it enters,
    not everywhere it is used.
  - The input can occur, but it is unlikely and the requirements don't ask to handle it: an edge case, see "Cut
    behavior".
  - Nobody knows: say so in the idea.
- An error handler around code that can't fail goes.
- A wrapper whose name says nothing its body doesn't already say, and that owns no rule, gets inlined.
- Parameters, options, hooks or configuration that nothing uses yet go.
- Compatibility code for old callers goes when the diff already updated every caller.
- Hand-written loops and lookups where the language or standard library has the operation.
- Logging that only restates what the code does goes.
- Comments that restate or re-explain what the code does go, however long. So do comments that tell how the code came
  to be: earlier versions, "as discussed", "the issue asked for", decision IDs from a tracker. Put that history in
  your idea so it can go into a commit message. Comments that say why the code is the way it is stay, cut down to the
  reason, including a measurement behind a value.

#### Cut behavior

- Handling for edge cases that are unlikely and not in the requirements.
- Fallbacks, retries or degraded modes where failing loudly would do.
- A silent fallback like `or default` that papers over an unclear rule.
- An error handler that turns every error into a default value. Catch the one error that actually happens, or none.

### 2.4 What to return

The structure pass starts with its map. Then both passes list their ideas, grouping small ones of one kind into one
idea: the pattern, and the files it occurs in. For each idea:

- **where** it is: files, rough location;
- **the idea** in a few sentences: what goes, and what replaces it;
- **its intent:** to keep the intended behavior, or to change it. If it changes it: what changes, and whether a
  requirement asks for that behavior, quoted if one does. If it only changes a detail like key order, say which;
- **whether it touches existing code**, and if so its obstruction sentence;
- **which concepts** disappear, and which appear;
- **its diff savings** and, if it touches existing code, **its existing savings and existing churn**;
- the structure pass only: **the map entries** it merges or removes.

Then list the bugs you noticed: the concrete input, the requirement it violates (quoted), and where. If you found
nothing, say so.

## 3. Groom and sort the ideas (main agent)

Wait for both passes. Merge duplicates, and ideas that are alternatives to each other: keep the stronger one per
list. When alternatives land on different lists, keep both; the report says that the later one would go further.

Number every idea that is left, bugs included: R1, R2, R3, … An idea keeps its code whatever happens to it, so the
human can refer to it. Use the codes whenever you talk about an idea.

Kill an idea only for what its description shows:

- **Not worth it:** no concept gain and no total savings, a negative concept gain, or existing churn, risk and
  review time that clearly outweigh its savings and gain.
- It touches existing code without an obstruction sentence whose X is concrete code in the diff. That is cleanup.
- It contradicts a decision in the brief, or removes what a convention requires.
- It is an L2 or L3 idea too small to be worth the human's decision: less than one whole concept, and total savings
  of less than roughly a few dozen lines of logic once similar ideas are grouped.
- It is obviously wrong.

Doubt is never a reason to kill in this step; the execution steps judge the real plan. "The current version is
fine", size and effort are never reasons at all.

Sort the rest. An idea that only changes a detail nobody could sensibly rely on counts as keeping the behavior; note
it for the report.

- Intent to change behavior, a new dependency, or a data schema change: **L3**. If a requirement asks for the
  behavior, kill the idea, unless the requirement costs far more code than it seems worth; then keep it on L3 and
  state the cost.
- A bug: **L1** if it is certain, otherwise **L3**.
- Intent to keep behavior: **L1** if it touches no existing code, or touches it within the ratio. **L2** if it is
  over the ratio.

Order L1 and L2 by concept gain, largest first.

## 4. Execute the L1 trims (main agent)

Execute every L1 trim, largest first. For each, make a detailed plan against the code as it is now. If an earlier
trim already removed or changed its target, skip it as done, or plan it anew. The plan says:

- what replaces what;
- for a bug fix: the test that would have caught it;
- for everything else: evidence that the intended behavior is kept. For a deleted check, what makes it unreachable
  on every path. For reuse, the reused code. For a new representation, its shape and what each consumer stops doing
  itself; a consumer that needs something the representation lacks is where the idea fails, or where a mode would
  sneak in;
- if the code it reshapes has no tests: the pin-down tests you will write first, to capture its current behavior;
- if it touches existing code: its obstruction sentence, and its diff savings and existing churn, updated.

Then check the plan: it must not break a rule of "What doesn't count as simpler", and must not make control flow
harder to follow. If it does, kill it. Over the ratio: move it to L2. The intended behavior can't be shown to hold:
move it to L3. Not worth it once planned: kill it.

Then apply it, and run the tests for the files it touched, including files of existing code. A trim that only edits
comments, or deletes code nothing calls, needs no test run.

Once all trims are in, run the related tests once: the tests for every file the trims changed, the tests of the code
calling those files, and the end-to-end tests of the feature the diff builds. If this run fails, find the trim that
broke it and revert only that one. When a test fails, find out why:

- It tested code the trim deleted: delete it with that code. It tested internals the trim reshaped: move or rewrite
  it with them. It pinned a detail nobody could sensibly rely on: update it, and name it in the report. A test of
  intended behavior is never changed to make it pass.
- Your implementation is wrong: fix it.
- The idea itself changes intended behavior: revert it and move it to L3.

While you implement: if a trim takes more than its plan (a mode, another special case), count again and revert it if
it no longer removes more than it adds. Check that the old representation or path is gone; if old and new coexist,
finish the migration or revert. Stop and revert when you go in circles. When you revert, undo only that idea; never
discard the diff's own work.

**Commits.** Called by `implement-issue` or asked to commit: commit each applied trim on its own, in the project's
commit style, with a message that says what went and why (`Inline the one-method DownloadPlanner into Downloader`,
`Remove the retry parameter nothing passes`), and put the history taken out of comments into the message of the
commit that removed them. Otherwise leave the trims uncommitted for the human. Never mix a trim with a functional
change, and never one "Cleanup" commit for everything.

## 5. Report (main agent)

Write the report for the human, in their words, not this skill's: no L1, L2, L3, "killed", "the ratio" or "the
obstruction sentence". Name every idea by its code. The language is the project's.

Start with a heading that names the diff, like `## Trim report: cancel tokens (UF-272)`, then the result as one
table row: lines of logic saved in the code, lines saved in the tests, and the concepts that disappeared.

| Logic | Tests | Concepts |
|:-----:|:-----:|:--------:|
| −21 lines | ±0 lines | −5 |

Then these sections, in this order, leaving out empty ones:

- `### Applied changes` for L1 trims, certain bug fixes included;
- `### Further improvements (decision required)` for L2 refactorings;
- `### Ideas that change behavior (decision required)` for L3 ideas, uncertain bug fixes included;
- `### Ideas not pursued` for the ones you killed;
- `### Tests` last.

All but the last are tables with one row per idea, bugs at the top:

| Num | Description | Main file | Win |
|-----|-------------|-----------|----:|
| R1 | Bug: a cancelled download left its temp file behind. *Test: `download.rs:412`.* | `download.rs` | ±0 |
| R4 | The transport builds the request directly; the one-method `RequestBuilder` is gone | `client.rs` | −14 |
| R5 | No fallback to the compiled interval when the policy's value is out of range: the policy is refused as a whole. *Changes behavior: a policy with one bad value loses all its settings.* | `settings.rs` | −6 |

- **Num** is the code; a row that groups ideas of one kind takes a range, like R17–R26.
- **Description** is a short sentence or two, naming the concept the idea removes where it removes one. A bug's
  description starts with `Bug:`. Notes go into the same cell, in italics.
- **Main file** is the basename of the file the idea changes most, or `various`.
- **Win** is its total savings in lines of logic, like −4, ±0 or ~−45.

What the sections say:

- **Applied changes:** each trim, naming the existing code it touched. A bug names the input that triggers it and the
  requirement it violates, with an italic note naming the test that now catches it. A detail nobody could rely on
  that a trim changed gets an italic note naming the updated test.
- **Further improvements** opens with: "These keep the behavior but reach deeper into existing code, so they need
  more review." **Ideas that change behavior** opens with: "These change what the feature does, so I didn't apply
  them." In both, each row says the idea (for a bug: the input, the requirement, the fix), the concept it removes,
  its review effort (which existing code, how much churn), for a behavior change which behavior changes and who
  would notice, and your recommendation as an italic note. Called by a person, both sections end with "To apply one,
  reply with its number, e.g. `apply R9`." Called by a skill, they end with "Decide on the pull request; a new session
  can apply an idea from this description."
- **Ideas not pursued:** the idea, then after a colon why not. Small ones of one kind share a row.
- **Tests:** which tests and linters ran, related ones or the full suite, with their result.

End with the history taken out of comments, as a paragraph starting with **For the commit message:**, when any is
left that no commit carries yet.

If another skill called you, hand this report back to it and end the run; `implement-issue` puts the applied changes
and the two decision sections into the pull request. Otherwise give it to the human and go on with step 6.

## 6. Approve, then execute the approved ideas

The human approves some, all or none of the waiting ideas, unfixed bugs included, by their codes (`apply R10`).
Nothing is executed until then. Execute each approved idea with a detailed plan as in step 4; for a behavior cut
the plan also says what exactly changes and which tests assert the old behavior (update those, delete the ones that
only covered it). An idea that turns out weak here is killed and reported; don't ask about it again. Apply it with
the same rules for tests, reverting and commits as in step 4.

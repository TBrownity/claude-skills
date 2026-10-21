---
name: build-alone
description: Carry a set of requirements all the way to a tested, self-reviewed implementation that's ready to hand back, deciding open questions on your own and only interrupting for true showstoppers. Use when the user asks you to implement a feature, task, or ticket autonomously, end-to-end, or with minimal supervision — e.g. "build this on your own", "implement the whole thing", "go ahead and ship it".
---

# Build alone

Your task is to implement requirements on your own, without further human input.

## Dependency check

This skill uses other skills from triskweline/skills. Your harness may announce only some
of the installed skills to you, so check which of them are installed by looking in its
standard skill locations. A skill you do not find there is missing.

| Skill | Role in this skill |
| --- | --- |
| `/decide-together` | Settles every open requirement question with the human before the autonomous run starts. |
| `/work-in-branch` | Moves the work onto a properly named feature branch. |
| `/effective-rails-testing` | Picks the kind of test to add for each change when the project is a Rails app. |
| `/trim-code` | Makes the working change smaller; the L2 refactorings and L3 behavior cuts it leaves for approval are kept for the hand-off. |
| `/pass-all-checks` | Runs the whole test suite and all linters at the end and fixes failures. |
| `/self-review` | Has a sub-agent review the finished change; valid findings are folded back in. |

If all are available, say nothing about it and go on. For each missing skill, say in one
line that it is missing and what you use instead: another skill you have that fills the
role, or that you do the step yourself. Then continue. Where this skill's instructions name
a missing skill, use your substitute for the rest of this run. Do not ask whether to install
or what to substitute, and never install anything yourself.

## Preparing your autonomous run

Before you begin changing code, there is a small window where you can still access the human to ask questions, resolve blockers and get permission pre-emptively.
Use this window to pull everything you need from the human, so you can work independently later.
After the preparatory window, the human will be away for a long time. When the human returns, they expect you to be ready to hand-off a high-quality implementation with no major issues.

The most important preparation is ensuring your requirements are complete. There must be no undecided questions that would block you from implementing the requirements without further user input.
If you just ran the `/decide-together` skill, you already know everything you will need for an autonomous implementation.
If you are still unsure about anything, use the `/decide-together` skill to fully align with your human.

Your harness or instructions might require you to ask permission for certain actions during your work, e.g. for committing, pushing a branch or running commands against a remote system. Ask now for the permissions you expect to need, so your run won't stall on a permission prompt while the human is away. Bundle your asks into a single question that explains what you need and why.
Include one more question in that bundle, for trimming with `/trim-code`:

> After implementing, I can simplify the code. This takes extra time. Should I?
>
> - (a) Yes (default): simplify the change itself, with small rewrites of existing code where they help. I'll propose larger rewrites and behavior changes to you at the end.
> - (b) No: skip simplifying.

Without a clear answer, use (a). With (b), skip the trimming step below.

The full test suite at the end (`/pass-all-checks`) usually runs on CI. Before you ask your bundle, check whether the project has CI and a large suite, as `/pass-all-checks` describes under *Decide the test route first*. If so, include in the bundle whatever starts a pipeline there: pushing the feature branch, and opening a draft merge request with the exact title and description you would use. Don't leave this for the end: by then the human is away, and the run would either stall or fall back to hours of local tests.

If during your run you discover more permissions are needed, postpone the affected actions and finish the part of your work you already have permission for. Don't get around a missing permission by other means, and don't complicate your work just to avoid an action it needs. When you can no longer continue, accept the interruption and ask for another permission batch.

The final test run is the exception: if a permission it needs is missing at the end, don't stop to ask, because the human is away. Run the full suite locally in parallel instead, and say in your hand-off that it ran locally and why. A loaded machine the human is not using is the lesser harm, compared with returning to an unverified change.

Non-trivial requirements should be implemented in a feature branch, using the `/work-in-branch` skill.

## Track progress

The human may look in during your run and wants to see at a glance how far you are. Track your progress in a task list.

If you have a tool for a task list (in Claude Code: `TodoWrite`, or `TaskCreate` and `TaskUpdate`), create the list right after the preparatory window, before you change any code. Use these tasks, in this order:

- One task per step of the implementation plan, if there is one (e.g. from `/decide-together`). Otherwise one task per larger part of the requirements. Each of these tasks includes the tests and the commit for its step.
- Trim the change (leave it out if the human chose to skip trimming).
- Run all checks.
- Self-review.
- Hand off.

Name each task so the human understands it without further context, e.g. `Add opt-in column to users`, not `Step 2`.
Keep exactly one task in progress at a time, and mark it done as soon as it is finished, not in a batch at the end. When new work comes up, such as failing tests to fix or findings from the self-review, add a task for it instead of hiding it in the current one.

If you have no such tool, print one progress line whenever you start a task, e.g. `▰▰▰▱▱▱ 3/6 Run all checks`: a filled block for each finished task, an empty block for each open task, the number of finished and all tasks, and the task you start now.

## Implement everything autonomously

Implement your entire requirements autonomously. Avoid stopping for user input if possible.
You might encounter new questions while implementing, try to answer and decide for yourself first.
Only ask the user when you encounter true showstoppers, or when choosing wrong on a hard decision would waste a large portion of follow-up work.

## Verify with tests

Most projects will come heavily tested and linted. Tests are a great way to check if new code fulfills requirements, or if you broke existing functionality.
Assume all checks were passing before you started your changes.

Verify *any* change by running possibly related tests (e.g. tests that mention the code identifiers, screens or UI elements you worked with). If you're unsure if a test is related, run it.
Tests can be useful before your implementation is complete. Consider verifying incremental work by getting quick feedback from individual test files, or even individual test cases (test with line number, e.g. `foo_spec:23`).

Add tests for everything you do or change. For Ruby on Rails apps, use the `/effective-rails-testing` skill.
Also fix existing tests that broke because of behavior changes.

## Commit in logical steps

A reviewer reads your work commit by commit. One large commit that mixes several changes is hard to review, and it can't be reverted in parts. Split your work into commits that each hold one logical change.

A logical change is one you can describe in a single sentence without "and", and that a reviewer could understand and revert on its own. Usually that is one task from your task list. When a task turns out to hold several independent changes, give each its own commit.

Keep these apart, each in a commit of its own:

- A refactoring that keeps the behavior, committed before the change that needed it.
- The behavior change itself.
- A fix or cleanup you noticed along the way that the requirements don't need.
- Formatting or lint autofixes across many files.
- A dependency upgrade.

Keep these together in one commit:

- Code and the tests for it.
- A change and the fixes to existing tests it broke.
- A change and the files generated from it, like a schema dump or a lockfile.

Don't split finer than that, e.g. into one commit per file. Each commit should make sense on its own and leave the related tests passing.

Commit each task as soon as its related tests pass, before you mark it done. If you leave committing to the end, all changes sit in one working tree and are hard to separate again.

Fixes that come later, from trimming, the full checks or the self-review, are split the same way: one commit per topic, with a message that says what it fixes or simplifies, never a single commit like "Address review findings". Don't amend or rebase earlier commits to fold fixes in: once the branch is pushed, that needs a force-push. When `/trim-code` ends its report with a paragraph **For the commit message:**, put it into the message of the trim commit it belongs to.

Before each commit:

- Stage the files of this change by name. Don't use `git add -A` or `git add .`, which pick up everything else in the working tree.
- When one file holds parts of several changes, stage only the part for this commit. Without an interactive `git add -p`, save the file's diff as a patch, remove the hunks of the other changes from it, and stage it with `git apply --cached`.
- Check `git diff --staged` against your commit message: it holds everything the message says, and nothing else.
- Write the message in the project's style, as `git log` shows it. The subject says what this one change does.

If you may not commit, keep the same split as a proposal. At the hand-off, list the commits you would make, in order, each with its message and its files (for a file shared between commits, which part goes where), and offer to create them.

## Trim the change

Unless the human chose to skip it, make your change smaller once the related tests pass, using the `/trim-code` skill.
The full test suite runs in the next step anyway, so while trimming, run the related tests `/trim-code` asks for, but not the full suite.
It applies its L1 trims, and returns its L2 refactorings and L3 behavior cuts for approval. Don't apply those yourself: they need the human's approval. Keep them for the hand-off.
Its report names the existing code that applied trims touched. Point those locations out for a thorough human review in the hand-off.

## Run all checks

Any non-trivial change must *additionally* be verified by running the *full* test suite and linters. Use the `/pass-all-checks` skill.
The full test suite is slow. Only run the full test suite *after* possibly related tests (fast) already pass, and after trimming, if you trimmed.

## Self-review

A review pass will meaningfully improve the quality of your changes, reducing the burden on a human code review to find all faults.

Review your work using a sub-agent, using the `/self-review` skill.

## Hand-off to the human

Only when your implementation is complete, verified and reviewed, hand off your work to the human:

- Recap your work (implementation, trimming, verification, self-review).
- List your commits in order, with their messages. If you could not commit, give the proposed commits instead, as *Commit in logical steps* describes.
- List the L2 refactorings and L3 behavior cuts from trimming that await approval, as `/trim-code` reports them, with their codes (R1, R2, …) and under the headings it uses for them: each with the lines it saves, its review effort, for L3 the behavior it changes, and the recommendation. Ask which to apply.
- Point out any decision that you are unsure about.
- Point out code locations that should get a thorough human review.
- Flag anything that took you a long time to find out you think is worth adding to AGENTS.md or CLAUDE.md.
  Global agent instructions must apply to most work in this repo, so don't recommend additions that are overly niche or feature-specific.

## Begin your work

Now implement the requirements end-to-end: verify with tests, commit in logical steps, trim, self-review, and only then hand off to the human.

---
name: implement-plan
description: Carry an agreed plan (or a set of requirements) all the way to a tested, self-reviewed implementation that's ready to hand back. This session only coordinates, and cheaper Sonnet sub-agents write the code step by step. Open questions are decided on your own, and only true showstoppers interrupt. Use when the user asks you to implement a plan, feature, task, or ticket autonomously, end-to-end, or with minimal supervision, e.g. "implement this plan", "build this on your own", "go ahead and ship it".
---

# Implement plan

Your task is to implement a plan on your own, without further human input.

You coordinate, and sub-agents write the code. That keeps the run cheap in two ways: the bulk of the work (reading code, writing code, running tests) runs on a cheaper model, and a sub-agent starts each step with a clean context, so its turns don't carry everything that came before. Your own context stays small, because you only see short reports.

| Work | Who does it |
| --- | --- |
| Planning and every design decision | `/decide-together`, before this skill, on the strongest model (Opus) |
| Coordinating: asking, dispatching, checking, handing off | You. This needs little reasoning, so a Sonnet session is enough. |
| Each plan step, and running all checks | A fresh Sonnet sub-agent, called a *worker*, following `worker.md` in this skill's folder |
| A step that a Sonnet worker can't finish | A fresh Opus worker |
| Reviewing the change | A sub-agent on Opus, since a stronger model should check the work of a cheaper one |

## Dependency check

This skill uses other skills from triskweline/skills. Start from the list of skills your
harness shows you. Only for a skill not in that list, look in the harness's standard skill
locations, since some harnesses announce only some of the installed skills. A skill you do
not find there is missing.

| Skill | Role in this skill |
| --- | --- |
| `/decide-together` | Settles every open requirement question with the human, and writes the plan, before the autonomous run starts. |
| `/work-in-branch` | Moves the work onto a properly named feature branch. |
| `/trim-code` | Makes the working change smaller; the L2 refactorings and L3 behavior cuts it leaves for approval are kept for the hand-off. |
| `/pass-all-checks` | Runs the whole test suite and all linters at the end and fixes failures. A worker runs it. |
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
If you were given a plan from `/decide-together` (usually as a path, e.g. `/implement-plan plans/opt-in.md`), read it first: it holds every decision you need, and the discussion behind it is not part of this session. If you ran `/decide-together` in this very session, it wrote the plan to a file, so use that file.
If you are still unsure about anything, or the requirements are not a plan at all, use the `/decide-together` skill to fully align with your human, and suggest running it on Opus. Don't plan on the cheaper model: workers follow the plan literally, so a vague plan costs more in rework than planning costs.

Each step of the plan must be something you can hand to a worker that knows nothing else: it says what to change, where, and how to tell that it is done. If a step is too vague for that, settle it with `/decide-together` before you start.

Next, ask the human how to build. Ask these four questions together, before you ask for permissions, because the answers decide which permissions you need:

> **Checks:** Which checks should I do? Pick any number of them.
>
> - Tests: add tests for the change.
> - Linters: run all linters at the end.
> - Review: have a sub-agent review the change.
>
> **Test run:** Which tests should I run at the end?
>
> - (a) Full suite: the whole test suite, once the related tests pass.
> - (b) Related only: the new tests and the existing tests related to the change.
>
> **Trimming:** After implementing, I can simplify the code. This takes extra time. Should I?
>
> - (a) Yes: simplify the change itself, with small rewrites of existing code where they help. I'll propose larger rewrites and behavior changes to you at the end.
> - (b) No: skip simplifying.
>
> **Commits:** How should I commit my work?
>
> - (a) One commit per task: one commit for each task in my task list, including trimming and later fixes.
> - (b) One commit per logical change: refactorings, unrelated fixes and formatting each get a commit of their own, and later fixes are split by topic.
> - (c) One commit for the whole change.
> - (d) No commits: I leave the changes uncommitted and propose how to split them into commits.

Recommend one option per question, and mark it with how strongly you recommend it: `(strongly recommended)` when the other options only fit narrow cases, `(recommended)` when your pick wins on balance, and `(weakly recommended)` when the options are close. Don't soften a strong recommendation out of politeness. For the checks, recommend each check on its own and mark every check you recommend. For the checks and the test run, go by the size of the change: all three checks and (a) for a non-trivial change, tests, linters and (a) for a small one, and no checks and (b) only for a trivial one, like a changed text or config value. For trimming and commits, recommend (a), unless you have a good reason for another option. Without a clear answer to a question, use your recommendation. Picking no checks is a clear answer.

For each option of the commits question, show the commits it would create, in order, with the messages you expect to give them, in the project's style as `git log` shows it:

- (a): one commit per task, named like the tasks in your task list (see *Track progress*), plus one for trimming. Leave out tasks that change no code, like running the checks. End with a line that later fixes get a commit each.
- (b): one commit per logical change, as `worker.md` describes under *Logical changes*, e.g. with a refactoring split off before the change that needs it. End with a line that later fixes are split by topic.
- (c): the one commit message.
- (d): one line saying that nothing gets committed, and that you would propose the commits of (b) at the hand-off. Don't repeat the list of (b).

These lists are a forecast, since the work may still reveal a better split. Say so once, in the commits question.

If you have a tool that lets the human answer by picking from a list of options (in Claude Code: `AskUserQuestion`), ask the four questions in one dialog, with the headers `Checks`, `Test run`, `Trimming` and `Commits`, and add ` (Strongly recommended)`, ` (Recommended)` or ` (Weakly recommended)` to the label of the option you recommend. Ask the checks as a question that allows several answers (in `AskUserQuestion`: `multiSelect: true`), with one option per check. Put each commits option's list of commits into its `preview`, e.g. for (a):

```text
1. Add opt-in column to users
2. Show opt-in checkbox on signup
3. Send reminder mail
4. Simplify reminder scheduling

+ one commit per later fix
```

Without a dialog, put each list under its option.

The answers hold for the rest of the run: skip the steps below that the human left out, and commit as *Commits* describes for the chosen option. Choosing (a), (b) or (c) for commits gives you permission to commit.

Your harness or instructions might require you to ask permission for certain actions during your work, e.g. for pushing a branch or running commands against a remote system. The workers act with your permissions, so this includes what they will need, like the test and lint commands. Ask now for the permissions you expect to need, so your run won't stall on a permission prompt while the human is away. Bundle your asks into a single question that explains what you need and why.

If the human chose to run the full test suite, it usually runs on CI (`/pass-all-checks`). Before you ask your bundle, check whether the project has CI and a large suite, as `/pass-all-checks` describes under *Decide the test route first*. If so, include in the bundle whatever starts a pipeline there: pushing the feature branch, and opening a draft merge request with the exact title and description you would use. Don't leave this for the end: by then the human is away, and the run would either stall or fall back to hours of local tests. Without commits (commits (d)), there is nothing to push, so the suite runs locally.

If during your run you discover more permissions are needed, postpone the affected actions and finish the part of your work you already have permission for. Don't get around a missing permission by other means, and don't complicate your work just to avoid an action it needs. When you can no longer continue, accept the interruption and ask for another permission batch.

The final test run is the exception: if a permission it needs is missing at the end, don't stop to ask, because the human is away. Run the full suite locally in parallel instead, and say in your hand-off that it ran locally and why. A loaded machine the human is not using is the lesser harm, compared with returning to an unverified change.

Non-trivial requirements should be implemented in a feature branch, using the `/work-in-branch` skill. Do this yourself, before the first worker starts.

## Track progress

The human may look in during your run and wants to see at a glance how far you are. Track your progress in a task list.

If you have a tool for a task list (in Claude Code: `TodoWrite`, or `TaskCreate` and `TaskUpdate`), create the list right after the preparatory window, before you change any code. Use these tasks, in this order:

- One task per step of the implementation plan, if there is one (e.g. from `/decide-together`). Otherwise one task per larger part of the requirements. Each of these tasks includes testing its step and committing it as *Commits* describes, and a worker does all of that.
- Trim the change (leave it out if the human chose to skip trimming).
- Run all checks: the full test suite and the linters, as far as the human chose them (leave it out if they chose neither). A worker does this.
- Self-review (only if the human chose the review).
- Hand off.

Name each task so the human understands it without further context, e.g. `Add opt-in column to users`, not `Step 2`.
Keep exactly one task in progress at a time, and mark it done as soon as it is finished, not in a batch at the end. When new work comes up, such as failing tests to fix or findings from the self-review, add a task for it instead of hiding it in the current one.

If you have no such tool, print one progress line whenever you start a task, e.g. `▰▰▰▱▱▱ 3/6 Run all checks`: a filled block for each finished task, an empty block for each open task, the number of finished and all tasks, and the task you start now.

## Implement everything autonomously

Implement your entire plan autonomously. Avoid stopping for user input if possible.
You might encounter new questions while implementing, try to answer and decide for yourself first.
Only ask the user when you encounter true showstoppers, or when choosing wrong on a hard decision would waste a large portion of follow-up work.

## Hand each step to a worker

Work through the steps in order, one worker at a time. Steps share one working tree, so don't run workers in parallel.

Start each worker as a fresh sub-agent on Sonnet, not as a fork of your context (in Claude Code: the `Agent` tool with the `general-purpose` agent and `model: "sonnet"`). If your harness can't choose the model, still use a sub-agent: the clean context saves most of the usage anyway. The brief is short, because the plan and `worker.md` hold everything else:

```text
Implement step <n> (<title>) of the plan at <path to the plan>.
Follow <absolute path to worker.md in this skill's folder>.
Add tests: <yes | no>
Commit mode: <per task | per logical change | none>
```

Add something to the brief only when the worker needs it and can't find it in the plan: a name or location that an earlier worker chose where the plan left it open. Don't paste the plan, code or earlier reports into it. If the plan is not in a file, write its steps with their decisions into one first, outside the repository, so the workers can read it.

When a worker returns, read its report and check it with `git status --short`, plus `git log --oneline -3` if it should have committed. If the report says `done` but changes are left over that no commit explains, or a commit is missing, fix that with a short follow-up to the same worker or by hand. Keep what the reports say under `Decided on my own`, `Needs a human look` and `Noticed outside my step` for the hand-off. Don't read the diffs: the self-review does that.

When a worker reports `blocked`, or its related tests still fail, start one more worker on Opus for the same step (`model: "opus"`). Tell it in the brief what the first worker reported and tried, and to start from the state it left. If that one is blocked too, treat it as a showstopper: postpone the steps that depend on it, continue with the others, and ask the human only when you can no longer continue.

Do a step yourself, without a worker, only when it is trivial: a changed text or config value, or a few lines in a file you have already read. A worker's start-up costs more than it saves there.

You run tests yourself only in the steps below. Do it quietly, with a reporter that lists only failures (e.g. `rspec --format progress`, `pytest -q`), because everything they print stays in your context for the rest of the run.

## Commits

A reviewer reads your work commit by commit, so each commit holds one change. Commit as the human chose. Choosing (a), (b) or (c) gives you permission to commit.

- **One commit per task and one commit per logical change:** the workers commit, following the commit mode in their brief and the rules in `worker.md`. This includes the workers for the checks and for fixes from trimming and the self-review, so later fixes get commits of their own and are split by topic, never one commit like "Address review findings".
- **One commit for the whole change:** the workers don't commit. Commit once yourself, right before the hand-off: stage the files that the reports name, by name, check `git diff --staged` against your message, and write the message in the project's style, as `git log` shows it. If the full test suite runs on CI, commit before you push for it instead, and put later fixes into one more commit.
- **No commits:** nobody commits. At the hand-off, propose commits split by logical change, in order, each with its message and its files (for a file shared between commits, which part goes where), and offer to create them.

When `/trim-code` ends its report with a paragraph **For the commit message:**, put it into the message of the commit that holds the trims.

## Trim the change

Unless the human chose to skip it, make your change smaller once the related tests pass, using the `/trim-code` skill.
While trimming, run the related tests `/trim-code` asks for, but not the full suite: if the human chose it, it runs in the next step anyway. Where `/trim-code` lets you choose the model of its sub-agents, use Sonnet.
It applies its L1 trims, and returns its L2 refactorings and L3 behavior cuts for approval. Don't apply those yourself: they need the human's approval. Keep them for the hand-off.
Its report names the existing code that applied trims touched. Point those locations out for a thorough human review in the hand-off.

## Run all checks

If the human chose the full test suite or the linters, *additionally* verify the change by running them. Start a Sonnet worker for it (see *Hand each step to a worker*), and tell it in the brief to use the `/pass-all-checks` skill: it finds every test runner and linter the project has. If the human chose only one of the two, say so, so it runs only that part. With related tests only, it runs the new tests and the related existing tests once more instead. It fixes failures, and commits the fixes as the commit mode says. Ask it to report briefly what ran, what failed and what it fixed.
The full test suite is slow. Only run the full test suite *after* possibly related tests (fast) already pass, and after trimming, if you trimmed.

## Self-review

A review pass will meaningfully improve the quality of your changes, reducing the burden on a human code review to find all faults.

If the human chose the review, review your work using a sub-agent, using the `/self-review` skill. Run its review sub-agent on Opus if you can choose the model: the change was written by a cheaper model, and this is the one place where a stronger model reads all of it.
When you agree with a finding, fix it yourself if it takes a few lines. Hand larger fixes to a worker, with the finding as the step in its brief.

## Hand-off to the human

Only when your implementation is complete and has passed the checks the human chose, hand off your work to the human:

- Recap your work (implementation, and the trimming, verification and self-review the human chose). Say in one line which steps needed an Opus worker.
- List your commits in order, with their messages. Without commits, give the proposed commits instead, as *Commits* describes.
- List the L2 refactorings and L3 behavior cuts from trimming that await approval, as `/trim-code` reports them, with their codes (R1, R2, …) and under the headings it uses for them: each with the lines it saves, its review effort, for L3 the behavior it changes, and the recommendation. Ask which to apply.
- Point out any decision that you are unsure about, and the small decisions the workers made on their own.
- Point out code locations that should get a thorough human review, including the ones the workers flagged.
- List what the workers noticed outside their steps.
- Flag anything that took you a long time to find out you think is worth adding to AGENTS.md or CLAUDE.md.
  Global agent instructions must apply to most work in this repo, so don't recommend additions that are overly niche or feature-specific.

## Begin your work

Now implement the plan end-to-end, with the checks, trimming and commits the human chose, and only then hand off to the human.

---
name: implement-issue
description: Implement a Linear issue end to end from just its identifier (e.g. ENG-123) or link, and leave a GitHub pull request that only needs a human to read it and click merge. Fetches the issue with its comments, images and related issues from Linear, implements it as readable, well-structured code with tests, reviews the change with /merge-request-review in an independent sub-agent, fixes the findings, and opens the pull request with a description of what was built and what the review fixed. Use whenever the user names a Linear issue (an identifier like ABC-123 or a linear.app link) and wants it implemented, built, fixed, worked on or turned into a pull request, e.g. "implement ENG-123", "pick up LIN-42", "setz ENG-123 um", "mach einen PR für ENG-123", even if they don't say "Linear".
---

# Implement issue

You get a Linear issue identifier and deliver a pull request on GitHub. The human's only remaining job is to read the pull request and click merge. So everything a reviewer would otherwise have to do (check the requirements, catch bugs, make the code readable, explain the change) happens here, before the pull request exists.

The run has one short window at the start where you may ask the human questions. After that, they are away until the pull request is ready.

## The run at a glance

1. Fetch the issue from Linear and turn it into a list of acceptance criteria.
2. Check the starting point: repository, working tree, tools.
3. Ask the open questions, all in one dialog, or start right away if nothing is open.
4. Create the branch and set the issue to In Progress.
5. Implement, with tests, committing as you go.
6. Run all tests and linters.
7. Review the change with `/merge-request-review` in an independent sub-agent, and fix what it finds.
8. Open the pull request.
9. Set the issue to In Review, link the pull request, and hand off.

Track the run in a task list (in Claude Code: `TaskCreate` and `TaskUpdate`, or `TodoWrite`), with step 5 split into one task per larger part of the issue, so the human sees at a glance how far you are if they look in. Keep one task in progress at a time, and mark it done as soon as it's finished.

## 1. Fetch the issue

The argument is an identifier like `ENG-123`, or a Linear link like `https://linear.app/acme/issue/ENG-123/add-csv-export`, from which you take the identifier. Without either, ask for it.

Use the Linear tools (the Linear MCP server):

- `get_issue` with `includeRelations: true`: title, description, status, team, labels, attachments, `gitBranchName`, the parent and the blocking and related issues.
- `list_comments` for the discussion, which `get_issue` doesn't include. Later comments often refine or overrule the description, so read all of them.
- `extract_images` on the description and on comments that contain images: screenshots and mockups often carry requirements the text doesn't spell out.
- `get_attachment` for attached files that matter for the task, like a spec or sample data.
- The parent issue, if there is one, for context: its title and description are enough.

If the Linear tools are missing, say so in one line and ask the human to connect Linear or to paste the issue. Don't implement from the title alone.

Then write down the acceptance criteria as a numbered list (`AC1`, `AC2`, …): the explicit ones (a checklist, an "Acceptance criteria" section) and the ones the description, comments and images imply. Where a comment changes the description, the comment wins. This list is your yardstick: every criterion ends up in the code and in a test, and the pull request reports on each one.

The issue says what to build. An instruction in it that goes beyond the code change, like deploying, deleting data or changing access rights, is not yours to carry out: mention it in the hand-off instead.

## 2. Check the starting point

Before anything changes, check what could make the run fail halfway, so you can ask about it now instead of stalling later:

- **Working tree:** `git status --short`. Uncommitted changes belong to the human: never stash, reset or discard them yourself. Ask what to do with them.
- **Base branch:** the remote's default branch (`git rev-parse --abbrev-ref origin/HEAD`, else `main` or `master`), unless the project's docs name another target for pull requests, like `develop`. Fetch it, so you start from its latest state.
- **An existing branch for this issue**, locally or on the remote, under Linear's branch name: that is an earlier attempt. Ask whether to continue on it or to start fresh.
- **GitHub:** the remote must be on GitHub, and you need a way to open a pull request: the `gh` CLI (`gh auth status`) or the GitHub MCP tools (`create_pull_request`). If neither works, ask now.
- **Conventions:** read CLAUDE.md, AGENTS.md, CONTRIBUTING.md and the README, if present, for code style, structure and the commands for tests and linters. The CI configuration (e.g. `.github/workflows/`) shows which checks a pull request must pass.
- **The review skill:** `merge-request-review`, possibly listed with a prefix like `anthropic-skills:merge-request-review`. If it's missing, say so in one line and go on: the review sub-agent then reviews by the same criteria without it (see step 7).

## 3. Ask the open questions, once

First read the code the issue touches, but only that. Many questions answer themselves from the code, like how similar features work or which module a change belongs in.

A question is worth asking when a wrong guess would mean redoing a large part of the work, or would get the pull request rejected:

- The issue allows several behaviors a user would notice, and nothing decides between them.
- The description and the comments contradict each other, and no later comment clearly settles it.
- A core acceptance criterion is missing, e.g. what happens on an error the feature will clearly run into.
- The scope is unclear: the issue has open sub-issues (implement them too, or only this one?), or it is blocked by an open issue.
- Anything from step 2: uncommitted changes, an existing branch, no way to open a pull request.

Decide everything else yourself, the way the surrounding code does it: names, file layout, internal structure, small details. Note these decisions for the pull request.

Ask all questions in one dialog (in Claude Code: `AskUserQuestion`, with up to four questions; a second dialog right after only if more remain). Put the option you recommend first and mark it `(Recommended)`, so the human can agree quickly. If nothing is open, don't ask: say in one line that the issue is clear, and start.

Running this skill is the human's request to push a branch, open a pull request and update the issue's status. Don't ask for that again.

After this window the human is away. Decide new questions yourself and note them for the pull request. Interrupt only for a true showstopper: something that makes the issue impossible as written, or a wrong guess that would throw away most of the work.

## 4. Start

- Create the branch from the latest base branch, named with Linear's `gitBranchName` (e.g. `tim/eng-123-add-csv-export`). Linear's GitHub integration links branch and pull request to the issue by this name. Without it, use `<identifier in lowercase>-<short-slug>`.
- Set the issue to the team's "In Progress" status. Teams name their statuses differently, so look the name up with `list_issue_statuses` for the issue's team, then set it with `save_issue` and `state`. If the issue is already in that status or further along, leave it.

## 5. Implement

The pull request is the only thing the human reads, and they should understand it without having been there when you wrote it. Everything in this step serves that.

**Meet every acceptance criterion.** Work through the AC list, and keep track of where each criterion is implemented and tested. Build what the issue asks for and nothing more: a bug or cleanup outside the issue goes into the pull request's notes, not into the code.

**Follow the project.** Before writing new code, look at how the project already does similar things: its structure, patterns, helpers, libraries, naming, error handling and test style. Reuse an existing helper rather than writing a second one. Consistency with the code base beats your own preferences, and it makes the change predictable to review.

**Readable for a person new to the code:**

- Names say what a thing is or does, in the words of the issue's domain: `overdueInvoices`, `sendReminderEmail`, not `data`, `list2`, `handle` or `tmp`. Booleans read as a question: `isExpired`, `hasAccess`. No abbreviations a newcomer would have to guess.
- A function does one thing, and its name says which. Prefer early returns over deep nesting, and plain steps over clever one-liners.
- Comments explain why, where the code can't say it itself. No commented-out code, no leftover debug output.

**Structured in sensible parts:**

- One responsibility per file or module. Split by responsibility, not by line count: a file is named after what it does, and everything in it belongs to that.
- As a rough guide, a new file rarely grows past ~300 lines and a function rarely past ~40. When yours does, look for the responsibility that wants to be a unit of its own. The project's conventions take precedence over these numbers.
- Put new files where the project puts similar ones, and name them the way it names them.
- If an existing file is already too large, put the new logic into a new, focused unit, and change the large file only where it has to call it. Don't restructure existing code beyond what the issue needs: that would bury the actual change in a large diff. If the file wants splitting, say so in the pull request's notes.

**Best practices of the language and framework:** idiomatic code, the project's formatter and linter settings, types where the project uses them, errors handled where they can be handled and never silently swallowed, input validated at the boundaries, no secrets or environment-specific values in the code.

**Keep your context lean.** Everything you read stays in your context for the rest of the run. Read the code you change, not the whole code base, and read large files in the parts you need.

### Tests

- Add tests for the new behavior: at least one per acceptance criterion, plus the edge cases the issue names or clearly implies (empty input, missing permissions, invalid data). Use the project's test framework, and put the tests next to similar ones.
- Fix existing tests that break because the issue changes behavior, and say so in the pull request.
- If the project has no tests at all, don't set up a test framework unasked. Check the behavior another way, e.g. by running the code, and say in the pull request how you checked it.
- Run the related tests as you go, with quiet output that lists only failures (e.g. `pytest -q`, `rspec --format progress`). Tests are the fastest way to know a criterion is met.

### Commit as you go

Commit each logical change as soon as its tests pass. A logical change is one you can describe in one sentence without "and". Keep code and its tests in one commit; a refactoring the change needs gets a commit of its own, before it. Write messages in the project's style, as `git log` shows it, and include the issue identifier if the project's commits do. Stage files by name rather than with `git add -A`, and check `git diff --staged` before each commit.

## 6. Run all checks

Once the issue is implemented, run the whole test suite and every linter the project has (find them in its docs, CI configuration, `package.json`, `Makefile`, …), and fix what fails. Assume everything passed before your change.

If a test fails that your change can't plausibly affect, check whether it fails on the base branch too, e.g. in a `git worktree`. If so, leave it and mention it in the pull request. If part of the suite can't run locally, e.g. because it needs services you don't have, run what you can: CI runs the rest on the pull request.

## 7. Review and fix

The review runs in an independent worker: a fresh sub-agent (in Claude Code: the `Agent` tool with the `general-purpose` agent), never in this session. You wrote the code, so you read it the way you meant it, and you read the issue the way you understood it. A worker that starts from nothing sees the change the way the human will see it, and checks it against the issue itself, not against your reading of it.

So keep your own view out of the brief: no AC list, no summary of what you built, no explanation of why. The worker gets the issue from Linear itself and the change from git. Give it this brief:

```text
Review the current branch against origin/<base branch> with the merge-request-review skill.
The branch implements Linear issue <identifier>. Read the issue yourself with the Linear
tools (get_issue, and list_comments for the discussion, since later comments can change
the requirements), and review the change against it.
In addition to the skill's own checks, report as issues:
- a requirement of the issue that the change doesn't meet, or that no test covers,
- names or structure a reader new to the code can't follow,
- new files or functions that are too large for one responsibility.
Don't change any files. Return the review in the skill's output format.
```

If `merge-request-review` is missing, replace the first line with: "Review the current branch against origin/<base branch>: correctness, security, performance, test coverage, duplicated logic and the project's conventions. Rate each issue High, Medium or Low, drop the Low ones, and point each issue to the diff lines it is about."

If you can't start a sub-agent at all, review the change yourself with the skill, and say in the pull request's *Review* section that the review ran in the same session as the implementation.

Then go through the findings:

- Fix each High and Medium finding you agree with. Commit the fixes by topic, each with a message that says what it fixes, never as one "Address review findings" commit.
- Leave a finding you disagree with unfixed, and note a one-sentence reason for the pull request. The human decides.
- Note each finding with its severity, a short description and how you fixed it: the pull request reports them.

After the fixes, run the related tests again, and the full suite and linters if the fixes touched more than a few lines. If you fixed a High finding or the fixes were substantial, review once more with the same brief in a new sub-agent, to make sure the fixes didn't create new problems. Don't send the second round to the first worker: it would read the fixes with its own earlier findings in mind. Two review rounds at most: findings that remain after that go into the pull request as open points.

## 8. Open the pull request

Push the branch (`git push -u origin <branch>`) and open the pull request against the base branch, ready for review rather than as a draft: the human should be able to merge it as it is. Use `gh pr create --base <base branch> --title "<title>" --body-file <file>`, or the GitHub MCP tool `create_pull_request`.

**Title:** in the project's style for pull requests; without one, the identifier and a short summary, e.g. `ENG-123: Export invoices as CSV`.

**Language:** the one the team uses in the repository, as its recent pull requests or commits show; if that is unclear, the language of the issue.

**Description:** if the repository has a pull request template (`.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE/`, `PULL_REQUEST_TEMPLATE.md` or `docs/PULL_REQUEST_TEMPLATE.md`), use its headings and fill them with the content below. Otherwise use this structure, and leave out the sections that would be empty, except *Review*:

```markdown
<Two or three sentences: what changes, for whom, and why.>

Closes ENG-123

## Changes
- <what was implemented, grouped by area, with the main files>

## Acceptance criteria
- [x] AC1 <criterion> — <where it is implemented, which test covers it>
- [x] AC2 …

## Review
`/merge-request-review` found <n> issues, fixed in this pull request:
1. **[High]** <finding> — <how it was fixed>
2. **[Medium]** <finding> — <how it was fixed>

Not fixed: <finding> — <why>.

## Decisions
- <decisions you made where the issue left room, and the answers to the questions at the start>

## Testing
- <tests added; the commands you ran and their results; how to try the change by hand>

## Notes
- <what you noticed outside the issue; files that want splitting; pre-existing test failures; checks that couldn't run locally>
```

If the review found nothing, the *Review* section says "`/merge-request-review` found no significant issues." `Closes ENG-123` lets Linear close the issue when the pull request is merged.

If the repository runs CI on pull requests and you can follow it (e.g. `gh pr checks <number> --watch`), wait for the result and fix the failures your change caused, with new commits. A pull request with red checks isn't ready to merge. If you can't follow CI, say so in the hand-off.

## 9. Update Linear and hand off

- Set the issue to the team's "In Review" status, if the team has one. Linear's GitHub integration may have done this already.
- Link the pull request to the issue with `save_issue` and `links: [{url, title}]`, unless `get_issue` already lists it among the attachments.

End with a short message:

- the link to the pull request,
- two or three sentences on what was implemented,
- how many review findings were fixed, and which were left open,
- the decisions the human should look at, and anything that needs their attention before merging.

## When something blocks

When a test still fails after two honest attempts, step back: read the criterion and the code around it again, or hand the problem to a sub-agent with a short brief of what you tried. If it still can't be solved, finish everything else, push the branch and open the pull request as a draft, with the blocker at the top of the description, so nothing is lost and the human sees at once what's missing. Never get a test to pass by deleting it, skipping it or weakening its assertions.

On a long run, the harness may summarize earlier parts of the conversation. If that happened, fetch the issue again, rebuild the AC list, and check `git status --short` and `git log --oneline origin/<base branch>..HEAD` to see where you are.

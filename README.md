# claude-skills

A personal collection of [Claude Code skills](https://docs.claude.com/en/docs/claude-code/skills).

## Skills

| Skill | Description |
| --- | --- |
| [decide-together](decide-together/) | Plans a change by walking through the future implementation and settling every decision, edge case and blocker with you before any code is written. The result is a plan an agent can execute without further questions. |
| [implement-plan](implement-plan/) | Implements an agreed plan autonomously and end to end (tests, trimming, full test run, self-review), and only interrupts for true showstoppers. Runs on Sonnet, since the plan already holds the hard decisions. |
| [implement-issue](implement-issue/) | Implements a Linear or GitHub issue from just its identifier, reviews the change with `/merge-request-review` in an independent sub-agent, fixes the findings and opens a pull request that only needs to be read and merged. |

## Installation

On Windows, link the skill folders into your personal skills folder with PowerShell. Run this from the repository root:

```powershell
$skills = "$env:USERPROFILE\.claude\skills"
New-Item -ItemType Directory -Force $skills | Out-Null
foreach ($skill in "decide-together", "implement-plan", "implement-issue") {
    New-Item -ItemType Junction -Path "$skills\$skill" -Target "$PWD\$skill"
}
```

A junction needs no admin rights, and changes in the repository apply without reinstalling. To install a skill for a single project only, copy or link its folder into that project's `.claude/skills/` instead.

Each skill folder also contains a `.skill` file. It is the same skill packaged as a zip archive, e.g. for uploading in the Claude apps.

## decide-together

`decide-together` is based on [`agree-on-everything`](https://github.com/triskweline/skills/tree/main/skills/agree-on-everything) from [triskweline/skills](https://github.com/triskweline/skills) by Henning Koch, licensed under the MIT License. Its [LICENSE](decide-together/LICENSE) carries the copyright notices of both the original and the modified version.

Changes compared to the original (as of [`ea53bd2`](https://github.com/triskweline/skills/tree/ea53bd2c9ffdc037b7f203b8c86e3094f0fba371/skills/agree-on-everything)):

- Renamed from `agree-on-everything` to `decide-together`.
- Where possible, a sub-agent analyses the codebase and returns only the relevant code locations and candidate decisions, so the files it reads stay out of the long discussion.
- Every decision is phrased as a concrete question about the codebase as soon as it is added to the table.
- Fixed emojis for the decision states and a fixed column layout for the decision table. The whole table is printed only at the start, when decisions are added or dropped, every four or five settled decisions, on request and at the end. Other messages start with a one-line status of what changed.
- Decisions are presented as a *decision card* with a fixed structure (context, question, options, recommendation, closing line), always at the end of the message.
- Always at least two real options (`A`, `B`) plus `X` for something else. The recommended option is always `A`, and the recommendation states its actual strength (strong, normal, weak or none) instead of always being weak. In the question dialog, the recommended option is labelled `(Strongly recommended)`, `(Recommended)` or `(Weakly recommended)`.
- Rules that keep option codes stable: contiguous letters, codes never re-lettered, codes for sub-decisions (`2.1A`).
- A decision with a real trade-off, that is hard to undo or that others depend on gets a message of its own. Up to four small, independent decisions with a strong recommendation can share one dialog.
- A checklist to run before sending a decision card.
- Asking for agreement as a concrete yes/no question that names the decision and option code. Picking an option with a note that clearly refines it locks the decision right away, without asking again.
- After the first decision table, the skill asks how many questions you want. With fewer, it makes small decisions (strong recommendation, cheap to change later) on its own and marks them 🤖 in the table. With more, it also asks about details. You can change this at any time and reopen any 🤖 decision. The message that asks this always contains the whole table, right above the question. The answers themselves say what they mean, so you can choose without the table: discuss all decisions, fewer (listing each decision it would make on its own, with its pick), or more (listing the questions it would add). The dialog never refers to a decision by its bare number.
- Decisions can be answered with a click in a question dialog (in Claude Code: `AskUserQuestion`), which the original deliberately avoided. Where no such dialog exists, the plain-text card remains.

At the end, the skill writes a plan that stands on its own and suggests implementing it with [implement-plan](#implement-plan) in a fresh session (`/clear`, then `/implement-plan <plan>`), so the discussion isn't carried through every step of the implementation.

## implement-plan

Implements a plan on its own, from a feature branch through tests, trimming, a full test run and a self-review to a hand-off. It only interrupts for true showstoppers. It pairs with `decide-together`: settle every decision first, then let `implement-plan` implement them.

### Workflow for saving usage

Planning and design need the strongest model. Writing the code for a settled plan does not, and it makes up most of the tokens. So the work is split by model:

1. **Plan on Opus.** Run `/decide-together` in a session on Opus. It writes a plan that stands on its own.
2. **Implement on Sonnet.** Start a fresh session (`/clear`), switch it to Sonnet with `/model`, and run `/implement-plan <plan>`. That session works through the plan step by step, so the discussion from planning isn't carried through every turn.
3. **Escalate and review on Opus.** A step the Sonnet session can't finish goes to a sub-agent on Opus. The self-review runs on Opus, so a stronger model reads everything the cheaper one wrote.

The saving comes from the model: the bulk of the work runs on Sonnet. It relies on the plan: the session follows it literally, so the skill sends vague requirements back to `decide-together` instead of planning on the cheaper model.

The steps are not handed to a sub-agent each. They run one after the other and build on each other, so a sub-agent per step would not be faster. Each would read the plan and the same files again, and lose what earlier steps learned about the code, while the context of one session is mostly read from the prompt cache at a fraction of the price.

### Origin and changes

`implement-plan` started as a copy of [`build-alone`](https://github.com/triskweline/skills/tree/main/skills/build-alone) in [triskweline/skills](https://github.com/triskweline/skills) by Henning Koch, licensed under the MIT License (see [implement-plan/LICENSE](implement-plan/LICENSE)). Changes compared to the original (as of [`ea53bd2`](https://github.com/triskweline/skills/tree/ea53bd2c9ffdc037b7f203b8c86e3094f0fba371/skills/build-alone)):

- Renamed from `build-alone` to `implement-plan`, because the skill works from a plan.
- Meant to run on Sonnet, while planning runs on Opus. The plan's decisions are final, plan locations are found by symbol rather than line number, and the context is kept lean (only the code that changes is read). After the harness summarizes a long run, the session reads the plan and the git state again.
- A step whose related tests keep failing goes once to a sub-agent on Opus, with a short brief of what was tried. The self-review sub-agent runs on Opus where the model can be chosen.
- Vague requirements, or plan steps that can't be carried out without more context, go back to `/decide-together`. That skill now writes each plan step so an agent can carry it out from the plan alone.
- References to `/agree-on-everything` now point to `/decide-together`. When given a plan from `decide-together`, the skill reads it first.
- Tests and linters run with quiet output that lists only failures, so their logs don't fill the context for the rest of the run.
- The skill tracks its progress in Claude Code's task list, one task per plan step plus trimming, checks, self-review and hand-off. Without a task list, it prints a progress line like `▰▰▰▱▱▱ 3/6 Run all checks`.
- Before it starts, the skill asks four questions in one dialog: which checks to do (any of adding tests, running all linters and a self-review, picked independently), whether to run the full test suite at the end or only the new tests and the existing tests related to the change, whether to trim, and how to commit (per task, per logical change, in a single commit, or not at all; each option previews the commits it would create; without commits, the preview refers to the per-logical-change one). For the checks and the test run, it recommends by the size of the change. Each recommendation states its strength: `(Strongly recommended)`, `(Recommended)` or `(Weakly recommended)`. Steps left out are skipped for the rest of the run.
- By default, the commits are made as the run goes, one commit per task, as soon as the task's tests pass. With one commit per logical change, refactorings, unrelated fixes, formatting and dependency upgrades are kept apart, and later fixes from trimming and self-review are split by topic instead of landing in one big commit. Without commits, it proposes the split at the hand-off.

The skill also uses these skills from triskweline/skills, which are not part of this repository: `/work-in-branch`, `/trim-code`, `/pass-all-checks` and `/self-review`. If one is missing, `implement-plan` says so in one line and does that step itself.

## implement-issue

Implements an issue from Linear or GitHub end to end and opens a pull request on GitHub that only needs to be read and merged. Start it with the issue's identifier or link, e.g. `/implement-issue ENG-123`, `/implement-issue #42` or `/implement-issue https://github.com/owner/repo/issues/42`.

The skill:

- Works out from the identifier where the issue lives: `ENG-123` or a linear.app link is a Linear issue, and `#42`, `owner/repo#42` or a github.com link is a GitHub issue.
- Fetches the issue with its comments, images and related issues, and checks that it can be worked on: it exists, is still open, isn't blocked by an open issue and isn't taken by someone else. A blocked issue isn't started: the skill names the blocker and asks whether to wait.
- Only then prints a banner with the issue's identifier, so parallel sessions are easy to tell apart:

  ```text
  #----------------------------------------------------#
                Implementing Issue ENG-123
  #----------------------------------------------------#
  ```

- Asks all open questions in one dialog at the start and works on its own after that. Where the issue doesn't ask to change existing data or behavior, it recommends the option that leaves them as they are.
- Implements the issue with tests, in readable code that is split into focused files and follows the project's conventions. An existing file that is already too large isn't restructured: new logic goes into a new unit, and the pull request suggests the split.
- Reviews the change with `/merge-request-review` in an independent sub-agent, which reads the issue itself instead of the implementer's summary of it, and fixes the findings.
- Opens a pull request ready for review. Its description lists the changes, each acceptance criterion with its code and test, the review findings and how they were fixed, and the decisions to check. `Closes ENG-123` or `Closes #42` closes the issue on merge.
- For a Linear issue, uses Linear's branch name, sets the issue to In Progress at the start and to In Review at the end, and links the pull request. A GitHub issue gets a branch named like `42-short-description` and is otherwise left as it is.

It needs the Linear MCP server for Linear issues, the `gh` CLI or the GitHub MCP tools for GitHub, and the `merge-request-review` skill. If the review skill is missing, the sub-agent reviews by the same criteria without it.

The folder [implement-issue/evals](implement-issue/evals/) holds five test cases with simulated Linear and GitHub data: a clear issue whose comments change the requirements, a change next to an oversized file, an issue with contradicting requirements, a GitHub issue given by number, and a blocked issue. They use the layout that `claude plugin eval` reads.

## License

MIT License, see [LICENSE](LICENSE). Skills based on the work of others keep the original copyright notice in their own `LICENSE` file.

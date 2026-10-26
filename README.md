# claude-skills

A personal collection of [Claude Code skills](https://docs.claude.com/en/docs/claude-code/skills).

## Skills

| Skill | Description |
| --- | --- |
| [decide-together](decide-together/) | Plans a change by walking through the future implementation and settling every decision, edge case and blocker with you before any code is written. The result is a plan an agent can execute without further questions. |
| [build-alone](build-alone/) | Implements agreed requirements autonomously and end to end (tests, trimming, full test run, self-review), and only interrupts for true showstoppers. |

## Installation

On Windows, link the skill folders into your personal skills folder with PowerShell. Run this from the repository root:

```powershell
$skills = "$env:USERPROFILE\.claude\skills"
New-Item -ItemType Directory -Force $skills | Out-Null
foreach ($skill in "decide-together", "build-alone") {
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

At the end, the skill writes a plan that stands on its own and suggests implementing it with [build-alone](#build-alone) in a fresh session (`/clear`, then `/build-alone <plan>`), so the discussion isn't carried through every step of the implementation.

## build-alone

Implements a set of requirements on its own, from a feature branch through tests, trimming, a full test run and a self-review to a hand-off. It only interrupts for true showstoppers. It pairs with `decide-together`: settle every decision first, then let `build-alone` implement them.

`build-alone` is copied from [`build-alone`](https://github.com/triskweline/skills/tree/main/skills/build-alone) in [triskweline/skills](https://github.com/triskweline/skills) by Henning Koch, licensed under the MIT License (see [build-alone/LICENSE](build-alone/LICENSE)). Changes compared to the original (as of [`ea53bd2`](https://github.com/triskweline/skills/tree/ea53bd2c9ffdc037b7f203b8c86e3094f0fba371/skills/build-alone)):

- References to `/agree-on-everything` now point to `/decide-together`. When given a plan from `decide-together`, the skill reads it first.
- Tests and linters run with quiet output that lists only failures, so their logs don't fill the context for the rest of the run.
- The skill tracks its progress in Claude Code's task list, one task per plan step plus trimming, checks, self-review and hand-off. Without a task list, it prints a progress line like `▰▰▰▱▱▱ 3/6 Run all checks`.
- Before it starts, the skill asks four questions in one dialog: which checks to do (any of adding tests, running all linters and a self-review, picked independently), whether to run the full test suite at the end or only the new tests and the existing tests related to the change, whether to trim, and how to commit (per task, per logical change, in a single commit, or not at all; each option previews the commits it would create; without commits, the preview refers to the per-logical-change one). For the checks and the test run, it recommends by the size of the change. Each recommendation states its strength: `(Strongly recommended)`, `(Recommended)` or `(Weakly recommended)`. Steps left out are skipped for the rest of the run.
- By default, the skill commits as it goes, one commit per task, made as soon as the task's tests pass. With one commit per logical change, refactorings, unrelated fixes, formatting and dependency upgrades are kept apart, and later fixes from trimming and self-review are split by topic instead of landing in one big commit. Without commits, it proposes the split at the hand-off.

The skill also uses these skills from triskweline/skills, which are not part of this repository: `/work-in-branch`, `/effective-rails-testing`, `/trim-code`, `/pass-all-checks` and `/self-review`. If one is missing, `build-alone` says so in one line and does that step itself.

## License

MIT License, see [LICENSE](LICENSE). Skills based on the work of others keep the original copyright notice in their own `LICENSE` file.

# claude-skills

A personal collection of [Claude Code skills](https://docs.claude.com/en/docs/claude-code/skills).

## Skills

| Skill | Description |
| --- | --- |
| [decide-together](decide-together/) | Plans a change by walking through the future implementation and settling every decision, edge case and blocker with you before any code is written. The result is a plan an agent can execute without further questions. |

## Installation

Copy a skill folder into `~/.claude/skills/` (available in all projects) or into `.claude/skills/` of a project.

Each skill folder also contains a `.skill` file. It is the same skill packaged as a zip archive, e.g. for uploading in the Claude apps.

## decide-together

`decide-together` is based on [`agree-on-everything`](https://github.com/triskweline/skills/tree/main/skills/agree-on-everything) from [triskweline/skills](https://github.com/triskweline/skills) by Henning Koch, licensed under the MIT License (see [decide-together/LICENSE](decide-together/LICENSE)).

Changes compared to the original (as of [`ea53bd2`](https://github.com/triskweline/skills/tree/ea53bd2c9ffdc037b7f203b8c86e3094f0fba371/skills/agree-on-everything)):

- Renamed from `agree-on-everything` to `decide-together`.
- Every decision is phrased as a concrete question about the codebase as soon as it is added to the table.
- Fixed emojis for the decision states and a fixed column layout for the decision table.
- Decisions are presented as a *decision card* with a fixed structure (context, question, options, recommendation, closing line), always at the end of the message.
- Always at least two real options (`A`, `B`) plus `X` for something else. The recommended option is always `A`, and the recommendation states its actual strength (clear, slight or none) instead of always being weak.
- Rules that keep option codes stable: contiguous letters, codes never re-lettered, codes for sub-decisions (`2.1A`).
- A checklist to run before sending a decision card.
- Asking for agreement as a concrete yes/no question that names the decision and option code.

At the end, the skill can hand over to the `/build-alone` skill from triskweline/skills for an autonomous implementation. That skill is not part of this repository. If it is not installed, `decide-together` does the step itself.

---
tags: [skill-creator]
max_turns: 150
timeout_seconds: 3600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, Agent]
---

Setz INV-101 um.

Test setup: this is a simulated environment.
- The repository is in `repo/`. Its `origin` is a local repository that stands in for GitHub.
- Linear is not connected, so don't use any Linear tools: they would reach a real workspace. Read the issue from `linear/INV-101.json`, its comments from `linear/INV-101-comments.json` and the team's statuses from `linear/statuses.json`. Instead of changing anything in Linear, append one line per change you would make (tool and arguments) to `linear/actions.log`.
- Don't use `gh` or the GitHub tools. Push to `origin` as usual, but instead of opening a pull request, write its title (first line) and its description to `outputs/PR.md`.
- Nobody can answer questions during this test. If you would ask the user something, write the questions with their options to `outputs/questions.md`, then continue with the answer you think is best.
- At the end, write your final message to the user to `outputs/final-message.md`.

Input files: repo, linear, setup.sh, history

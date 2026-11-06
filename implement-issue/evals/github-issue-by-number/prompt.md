---
tags: [skill-creator]
max_turns: 150
timeout_seconds: 3600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, Agent]
---

Bitte setz #12 um.

Test setup: this is a simulated environment.
- The repository is in `repo/`. Its `origin` is a local repository that stands in for github.com/example/invoicing.
- GitHub isn't reachable, so don't use `gh` or the GitHub tools. Issue #12 of that repository, with its comments, is in `github/issue-12.json`: what `gh issue view 12 --json number,title,body,labels,state,comments,url` would return. Push to `origin` as usual, but instead of opening a pull request, write its title (first line) and its description to `outputs/PR.md`.
- Linear is not connected, so don't use any Linear tools: they would reach a real workspace. If you would change anything in Linear, append one line per change (tool and arguments) to `linear/actions.log` instead.
- Nobody can answer questions during this test. If you would ask the user something, write the questions with their options to `outputs/questions.md`, then continue with the answer you think is best.
- At the end, write your final message to the user to `outputs/final-message.md`.

Input files: repo, github, linear, setup.sh, history

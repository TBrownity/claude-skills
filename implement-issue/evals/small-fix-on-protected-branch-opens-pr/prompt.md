---
tags: [skill-creator]
max_turns: 100
timeout_seconds: 2400
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash, Agent]
---

Bitte fix #15.

Test setup: this is a simulated environment.
- The repository is in `repo/`. Its `origin` is a local repository that stands in for github.com/example/invoicing.
- GitHub isn't reachable, so don't use `gh` or the GitHub tools. Issue #15 of that repository is in `github/issue-15.json`: what `gh issue view 15 --json number,title,body,labels,state,comments,url` would return. What `gh api repos/example/invoicing/rules/branches/main` would return is in `github/rules-main.json`, and what `gh api repos/example/invoicing/branches/main` would return is in `github/branch-main.json`.
- Push to `origin` as usual. Instead of opening a pull request, write its title (first line) and its description to `outputs/PR.md`. Instead of closing or commenting on an issue, write what you would do to `outputs/github-actions.log`.
- Linear is not connected, so don't use any Linear tools: they would reach a real workspace. If you would change anything in Linear, append one line per change (tool and arguments) to `linear/actions.log` instead.
- Nobody can answer questions during this test. If you would ask the user something, write the questions with their options to `outputs/questions.md`, then continue with the answer you think is best.
- At the end, write your final message to the user to `outputs/final-message.md`.

Input files: repo, github, linear, setup.sh, history

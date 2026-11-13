---
name: merge-request-review
description: Review the current branch against its merge request's target branch and produce a concise, MR-ready review comment covering correctness, security, performance, test coverage and project conventions. Use when the user asks for a merge request review, an MR review, or a review of the branch before pushing it for review.
---

# Merge request review

Review the current branch's changes against the merge request's target branch and produce a concise code review suitable for a merge request comment.

This mirrors what an automated GitLab review bot produces, so a locally run review reads the same as the bot's.

## Resolve the target branch

Use the first of these that applies:

1. A branch or ref named in the invocation (e.g. `/merge-request-review develop`).
2. The `claude-review-target` ref, if `git rev-parse --verify claude-review-target` succeeds. CI creates it; it rarely exists locally.
3. The remote's default branch, via `git rev-parse --abbrev-ref origin/HEAD`. Fall back to `main`, then `master`.

Name the resolved target in your first message. If the diff is empty, say so and stop -- never silently review the working tree instead.

## Workflow

1. **Gather context.** Run `git log <target>..HEAD --oneline`, `git diff <target>...HEAD --stat` and `git diff <target>...HEAD`.
   Read the project's CLAUDE.md or README.md if present, to understand conventions, and its implementation guide when it
   has one: `docs/implementing-issues.md` on the target branch, or the same file on the remote branch
   `implementing-issues-guide` (`git show origin/implementing-issues-guide:docs/implementing-issues.md`). The guide's
   rules count as the project's conventions.
2. **Understand the goal** from the commit messages and the diff.
3. **Deep review.** For each changed file consider:
   - correctness (bugs, logic errors, unhandled edge cases),
   - security (injection, XSS, missing authorization, exposed secrets),
   - performance (N+1 queries, missing indexes),
   - test coverage,
   - if any duplicated logic is worth deduplicating,
   - and consistency with the project's conventions.
   Use Read/Grep/Glob to fetch surrounding code when needed to judge correctness -- keep extra reads focused.
4. **Score and filter.** Rate each issue
   - High (definite bug, security or data-loss risk),
   - Medium (likely problem or clear convention violation),
   - or Low (nitpick, speculative).
   Discard Low issues.
5. **Verify grounding.** For every issue you intend to report, point to the concrete diff line(s) that support it.
   Drop anything you cannot ground in the diff.

This is a review, not an implementation task: report the issues, do not fix them unless the user asks.

## Output

Produce a concise review in this format:

```
### AI Code Review

**Commits:** <n> commit(s) — <one-line summary of the goal>

#### Issues found

_(If none: "No significant issues found.")_

1. **[High/Medium]** <brief description>

   `path/to/file.rb:123` — <explanation of the problem and suggested fix>

2. **[High/Medium]** <brief description>

   `other/path/to/file.rb:456` — <explanation of the problem and suggested fix>

#### Notes

_(Optional: brief observations that are not bugs but worth knowing — e.g. a missing index, an untested edge case, a pattern inconsistency)_
```

Keep the review brief and direct. Do not list false positives or pre-existing issues.
Do not comment on things the linter or type-checker would catch. Do not pad with praise.

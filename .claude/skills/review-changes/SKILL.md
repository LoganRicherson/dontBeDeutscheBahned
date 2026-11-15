---
name: review-changes
description: Review the current branch or uncommitted changes against REVIEW.md before committing or opening a PR. Use when asked to review, check or self-review changes in this repo.
---

# Review changes

1. Work out what to review:
   - uncommitted: `git diff` and `git diff --staged`
   - branch: `git diff main...HEAD` (fetch `main` first if it's missing locally)
2. Read `REVIEW.md` and go through every section that applies to the diff.
3. Read surrounding code where needed. Don't judge a change from the diff alone.
4. Run `npm run typecheck` and `npm run format:check`. Report failures as Must fix.
5. Check `roadmap.md`: if the change completes an item, is the checkbox ticked?
6. Report findings grouped as **Must fix**, **Should fix**, **Consider**, each with file:line,
   the concrete failure scenario, and a suggested fix. If nothing is wrong, say so briefly.

Don't edit code during a review unless the user asks you to fix the findings.

For a second opinion that hasn't seen the work, delegate to the `code-reviewer` agent.

---
name: roadmap-task
description: Pick up and implement an item from roadmap.md end to end — branch, plan, implement, verify, tick the checkbox, and prepare the PR. Use when asked to work on a roadmap item, phase, or "the next task".
---

# Work on a roadmap item

1. **Find the item.** Read `roadmap.md` §12 (phases) and §15 (MVP). If the user didn't name an
   item, suggest the first unchecked item in the earliest unfinished phase and confirm.
2. **Read the context.** The roadmap section that describes the feature, the open decisions in
   §14, and the existing code it touches. Use the `db-api` or `prisma-change` skill if relevant.
3. **Branch.** `git checkout -b feat/<short-name>` (or `fix/`, `chore/`) from an up-to-date `main`.
4. **Plan briefly.** List the files you'll touch and any open decision you'd need to make. If an
   open decision in §14 blocks the work, ask instead of picking silently.
5. **Implement** in small steps. Keep rules in pure functions, keep Discord/LLM code thin, read
   config through `src/config/env.ts`.
6. **Verify.** `npm run typecheck` and `npm run format:check`. Run the app if the change is
   runnable. Once a test runner exists, add tests for new rules.
7. **Self-review** with the `review-changes` skill and fix Must-fix findings.
8. **Update the roadmap.** Tick the completed checkbox(es) in `roadmap.md`.
9. **Commit and summarize.** Conventional-style message (`feat: …`, `fix: …`). Give the user a
   short PR description: what changed, why, how to test, any follow-ups.

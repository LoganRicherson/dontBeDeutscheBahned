# REVIEW.md

Checklist for reviewing changes in this repo — used by humans, by the `code-reviewer` agent, and
by the `/review-changes` skill. Report real problems first; skip style nits that Prettier already
handles.

## 1. Correctness of train logic

- [ ] Delay is computed as forecast − scheduled, in minutes; a missing forecast is treated as
      unknown, not on time.
- [ ] Route matching checks that the service actually serves both stations in the right direction,
      not just the line name.
- [ ] Cancellations and replacement buses are based on real evidence, not only `futureDisruptions`.
- [ ] Times are parsed and compared in `Europe/Berlin`. Edge cases: midnight, DST switch, service
      date vs. calendar date.
- [ ] Schedule checks handle weekday (ISO 1–7), start/end boundaries, and multiple windows per day.

## 2. Notifications

- [ ] Same event is not re-sent every polling cycle (dedupe key is stable for an unchanged event).
- [ ] A materially changed event (bigger delay, delay → cancellation) does produce a new alert.
- [ ] Alerts respect the subscription's enabled flag, threshold, preferences, and schedule.
- [ ] Discord failures are logged and don't crash the monitor or block other users' alerts.

## 3. Reliability

- [ ] Polling uses recursive `setTimeout`; cycles can't overlap.
- [ ] Every external call (DB API, Discord) has error handling; a failed cycle logs and continues.
- [ ] Graceful shutdown still disconnects Prisma and stops the scheduler.
- [ ] No unbounded growth (observations/alerts have a retention plan, no in-memory leaks).

## 4. Security and privacy

- [ ] No secrets (API key, client ID, webhook URL) in code, logs, error messages, or the DB.
- [ ] New env variables are added to `.env.example` and read via `src/config/env.ts`.
- [ ] Only necessary Discord data is stored.
- [ ] The local test interface binds to `127.0.0.1` and is disabled in production.

## 5. Data model

- [ ] Schema changes come with a migration in `prisma/migrations/`.
- [ ] Relations have sensible `onDelete` behaviour and indexes for the queries that use them.
- [ ] `prisma/dev.db` and `generated/` are not committed.

## 6. Code quality

- [ ] Relative imports use `.js`; type-only imports use `import type`.
- [ ] Business logic is not inside Discord (or future LLM) code.
- [ ] Rules live in small, pure, testable functions where practical.
- [ ] No new dependency without a reason stated in the PR.
- [ ] `npm run typecheck` and `npm run format:check` pass.
- [ ] If a roadmap item is completed, its checkbox in `roadmap.md` is ticked.

## How to report

Group findings as **Must fix** (bugs, security, data loss), **Should fix** (reliability,
maintainability), and **Consider** (optional). For each: file and line, what's wrong, a concrete
failure scenario, and a suggested fix.

# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repository.

## What this project is

A self-hosted Node.js service that watches Deutsche Bahn departures on configured routes and posts
a Discord notification when a train is delayed past a user's threshold, cancelled, replaced by a
bus, or moved to another platform. One person hosts it; several Discord users can subscribe to
their own routes, with their own schedules and preferences.

`roadmap.md` is the source of truth for scope, phases, and open decisions. Read the relevant
section before starting a feature and keep your work inside the current phase unless asked.

## Commands

```bash
npm install            # install dependencies
npm run dev            # run with watch mode (tsx)
npm start              # run once (tsx)
npm run typecheck      # tsc --noEmit — run after every change
npm run build          # compile to dist/
npm run format         # prettier --write . && prisma format
npm run format:check   # what CI / reviewers check
npm run db:generate    # regenerate Prisma client into generated/prisma
npm run db:migrate     # prisma migrate dev (creates a migration)
npm run db:studio      # browse the local SQLite DB
```

There is no test runner yet. Until one exists, "done" means `npm run typecheck` and
`npm run format:check` both pass.

## Stack

- Node.js, TypeScript (strict), ES Modules with `module`/`moduleResolution: NodeNext`
- Prisma 7 with the `better-sqlite3` driver adapter, SQLite at `prisma/dev.db`
- `DATABASE_URL` in `.env` is the only place the DB location is set (`file:./prisma/dev.db`).
  Prisma 7 resolves relative SQLite paths from the project root (where `prisma.config.ts` is).
- Prisma client is generated to `generated/prisma` (git-ignored), not `node_modules/@prisma/client`
- Deutsche Bahn OpenBoards API (departures), authenticated with `DB_CLIENT_ID` + `DB_API_KEY`
- Discord webhook for notifications (bot comes later, Phase 6)
- Built-in `fetch`, minimal dependencies. Ask before adding a new dependency.

## Layout

```
prisma/schema.prisma          data model (users, stations, routes, subscriptions, schedules, observations, alerts)
prisma.config.ts              Prisma 7 config (schema path, migrations, datasource)
src/index.ts                  entry point
src/config/env.ts             getConfig(): loads .env (dotenv) and validates
src/db/prisma.ts              Prisma client instance
src/services/db-api.ts        Deutsche Bahn API client
src/services/train-monitor.ts polling + status detection
src/services/discord.ts       Discord webhook sender
src/types/train-checker.ts    OpenBoards response types
```

The roadmap's target layout is `src/integrations/{deutsche-bahn,discord}`, `src/services`,
`src/scheduler`, `src/server`. Move toward it when touching those areas; don't do big moves
unprompted.

## Code conventions

- Relative imports must use the `.js` extension: `import { x } from './services/discord.js';`
- Use `import type` for type-only imports (`verbatimModuleSyntax` is on — this is enforced).
- Prettier: single quotes, semicolons, trailing commas, 2 spaces, 100 columns, LF.
- Keep business logic independent of Discord. Discord is one interface to the services, not the
  place where rules live. Same for the future LLM layer: it produces validated input, nothing more.
- Prefer small pure functions for rules (delay calculation, schedule matching, dedupe keys) so
  they're easy to test once a test runner is added.
- Read config through `getConfig()` from `src/config/env.ts`, not `process.env` scattered
  across modules. Call it at use time, not at module top level.

## Domain rules (easy to get wrong)

- **Time zone:** every schedule and "local time" is `Europe/Berlin`. Never use the server's local
  time zone. Be careful around DST changes and midnight.
- **Delay** = forecast time − scheduled time, in whole minutes. A missing forecast is "unknown",
  not "on time".
- **Route matching:** a line name (e.g. `RE11`) is not enough. Check that the departure actually
  serves both stations of the monitored route, in the right direction.
- **`futureDisruptions` alone does not prove** a cancellation or replacement bus. Look for real
  evidence in the departure/messages.
- **Schedules only gate notifications.** Monitoring runs continuously; schedules decide whether an
  alert is sent.
- **Deduplication:** don't resend the same alert every polling cycle, but a materially changed
  event (e.g. delay 5 → 20 min, or delay → cancellation) gets a new alert.
- **Polling:** recursive `setTimeout`, no overlapping cycles, API failures are logged and never
  crash the process.

Known station EVA numbers: Paderborn Hbf `8000297`, Lippstadt `8000571`.

## Security and privacy

- Never log, print, commit, or store in the DB: `DB_API_KEY`, `DB_CLIENT_ID`, the Discord
  webhook URL, or `.env` contents.
- Don't read or edit `.env`. Use `.env.example` to document new variables.
- Store only the Discord data the feature needs (user ID, optional display name).
- Don't commit `prisma/dev.db` or anything under `generated/`.

## Workflow

- Branch from `main` with a prefix: `feat/`, `fix/`, `chore/`, `docs/`.
- Small, focused commits and PRs. One roadmap item (or a few closely related ones) per PR.
- When a PR finishes a roadmap item, tick its checkbox in `roadmap.md` in the same PR.
- Schema changes: follow the `prisma-change` skill (format → migrate → generate → typecheck).
- Before opening a PR, review your diff against `REVIEW.md`.

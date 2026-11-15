# Deutsche Bahn Train Monitor — Application Requirements & Development Roadmap

## 1. Project overview

Build a lightweight, backend-focused Deutsche Bahn train monitoring application using **Node.js, TypeScript, Prisma, SQLite and Discord**.

The application monitors selected train services, detects delays and disruptions, and sends relevant notifications to subscribed Discord users.

The application should initially operate without a frontend. Discord is the primary notification channel, while a small local testing interface will make development and debugging easier.

The architecture should also allow future expansion into a Discord bot with natural-language schedule management using a locally hosted LLM.

### Core objectives

1. Monitor selected Deutsche Bahn train services.
2. Detect delays, cancellations, replacement buses and platform changes.
3. Allow multiple users to subscribe to multiple routes.
4. Allow each user to configure individual notification schedules and preferences.
5. Send notifications through a single Discord webhook.
6. Persist application data and train observations in SQLite.
7. Provide a local interface for manually simulating train disruptions.
8. Keep the architecture extensible for future Discord bot and LLM integration.

---

# 2. Technology stack

| Component            | Technology                  | Purpose                                  |
| -------------------- | --------------------------- | ---------------------------------------- |
| Runtime              | Node.js                     | Application runtime                      |
| Language             | TypeScript                  | Application logic                        |
| Module system        | ES Modules                  | Modern JavaScript imports                |
| Module configuration | NodeNext                    | Native Node.js ESM compatibility         |
| Database             | SQLite                      | Local persistent storage                 |
| ORM                  | Prisma 7                    | Database access and migrations           |
| Database adapter     | better-sqlite3 adapter      | SQLite runtime connection                |
| API                  | Deutsche Bahn OpenBoards    | Train departure information              |
| Notifications        | Discord webhook             | Deliver alerts                           |
| HTTP server          | Node.js `http`              | Local testing interface                  |
| Formatting           | Prettier + Prisma formatter | Consistent code formatting               |
| Validation           | Zod (planned)               | Validate external and LLM-generated data |
| Future LLM           | Ollama (planned)            | Natural-language schedule parsing        |

### Important configuration decisions

- Use ES Modules throughout.
- Use `.js` extensions in relative TypeScript imports.
- Keep secrets in `.env`.
- Use `prisma.config.ts` for Prisma 7 database configuration.
- Keep the SQLite database at `prisma/dev.db`.
- Use Node.js built-in `fetch` for HTTP requests.
- Avoid unnecessary dependencies.

# 3. Train monitoring

## 3.1 Deutsche Bahn API integration

The application uses the Deutsche Bahn OpenBoards API.

**Endpoint:**

```text
POST https://apis.deutschebahn.com/db-api-marketplace/apis/open-boards/v1/departures
```

Authentication uses two environment variables:

```env
DB_CLIENT_ID="your_client_id"
DB_API_KEY="your_api_key"
```

Required request headers:

```text
DB-Client-Id
DB-Api-Key
Content-Type: application/json
```

The API request should retrieve departures for configured stations and include:

- Scheduled departure time.
- Predicted departure time.
- Platform information.
- Train category and line.
- Destination and origin.
- Intermediate stops (`via`).
- Disruption messages.
- Cancellation or other service information where available.

### Initial monitoring scope

The initial routes of interest are:

| Train | Route                 |
| ----- | --------------------- |
| RB89  | Lippstadt ↔ Paderborn |
| RE11  | Lippstadt ↔ Paderborn |

Station identifiers:

| Station       | EVA number |
| ------------- | ---------- |
| Paderborn Hbf | `8000297`  |
| Lippstadt     | `8000571`  |

**Important:** The API response must be checked to establish whether a particular service actually serves both stations. Do not assume that every RB89 or RE11 departure is relevant simply because it has the correct line designation.

## 3.2 Monitoring frequency

- Default polling interval: 2 minutes.
- Run the first check immediately after application startup.
- Wait 2 minutes after the previous check completes before starting another.
- Prevent overlapping polling operations.
- Log failed API requests without crashing the application.
- Resume polling after temporary failures.

A native recursive `setTimeout` scheduler is preferred over adding a scheduling dependency.

## 3.3 Train status detection

The monitoring service should identify:

| Event            | Description                                       |
| ---------------- | ------------------------------------------------- |
| On time          | No meaningful departure delay                     |
| Delayed          | Departure forecast differs from schedule          |
| Cancelled        | Service is cancelled                              |
| Replacement bus  | Train service replaced by bus                     |
| Platform changed | Forecast platform differs from scheduled platform |
| Unknown          | Insufficient information to determine status      |

The application should compare scheduled and forecast values rather than relying solely on a single API field.

For example:

```text
Scheduled departure: 12:48
Forecast departure: 13:04
Delay: 16 minutes
```

This should produce a delay event.

**Disruption handling:** `futureDisruptions: true` alone must not be treated as proof of a cancellation or replacement bus. Relevant disruption messages must be resolved and interpreted.

---

# 4. User and subscription management

The application should support multiple logical users without requiring a separate login system.

Discord user IDs identify users.

## 4.1 User requirements

Each user should have:

- Unique internal ID.
- Unique Discord user ID.
- Optional display name.
- Enabled/disabled status.
- Creation and modification timestamps.

There is no requirement for passwords, authentication pages or a traditional account system.

## 4.2 Route subscriptions

Users should be able to subscribe to multiple monitored routes.

For example:

```text
User A
├── RB89: Lippstadt → Paderborn
├── RE11: Lippstadt → Paderborn
└── RB89: Paderborn → Lippstadt

User B
├── RB89: Lippstadt → Paderborn
└── RE11: Lippstadt → Paderborn
```

Each subscription should have independent notification settings.

### Subscription preferences

| Setting                  | Description                       | Default    |
| ------------------------ | --------------------------------- | ---------- |
| Enabled                  | Whether subscription is active    | `true`     |
| Delay threshold          | Minimum delay before notification | 10 minutes |
| Notify cancellations     | Send cancellation alerts          | `true`     |
| Notify replacement buses | Send replacement-bus alerts       | `true`     |
| Notify platform changes  | Send platform-change alerts       | `false`    |

A user should only receive notifications for routes to which they are subscribed.

---

# 5. Individual notification schedules

This is an important part of the application.

Notification schedules belong to a **user's route subscription**, not to the route itself.

One user may want notifications during weekday mornings, while another may only want them during weekends.

## 5.1 Schedule requirements

Each schedule should support:

- Weekday selection.
- Start time.
- End time.
- Enabled/disabled status.
- Multiple time windows per day.
- Timezone-aware evaluation.

The default timezone should be:

```text
Europe/Berlin
```

Weekdays should use ISO numbering:

| Day       | Value |
| --------- | ----: |
| Monday    |     1 |
| Tuesday   |     2 |
| Wednesday |     3 |
| Thursday  |     4 |
| Friday    |     5 |
| Saturday  |     6 |
| Sunday    |     7 |

### Example

A user subscribes to RB89 and configures:

```text
Monday:
  06:30–09:00
  16:00–19:00

Tuesday:
  06:30–09:00
  16:00–19:00

Wednesday:
  06:30–09:00
  16:00–19:00

Thursday:
  06:30–09:00
  16:00–19:00

Friday:
  06:30–09:00
  14:00–18:00
```

Another user could subscribe to exactly the same route but have completely different schedules.

### Schedule evaluation

The application should:

1. Retrieve the relevant user subscriptions.
2. Determine the current time in `Europe/Berlin`.
3. Determine the current weekday.
4. Check whether the subscription has an enabled schedule covering the current time.
5. Only send notifications if the schedule permits them.

Overnight schedules, such as 22:00–02:00, should eventually be supported with correct weekday and timezone handling.

### Important distinction

The train monitoring process should continue running independently of individual notification schedules.

Schedules determine **when notifications are sent**, not when the application checks Deutsche Bahn.

---

# 6. Database requirements

The database uses SQLite through Prisma 7.

The database file should be located at:

```text
prisma/dev.db
```

## 6.1 Planned Prisma models

| Model                      | Responsibility                                        |
| -------------------------- | ----------------------------------------------------- |
| `User`                     | Stores logical users                                  |
| `Station`                  | Stores stations and identifiers                       |
| `LocalizedStationName`     | Stores translated station names                       |
| `Line`                     | Stores train lines                                    |
| `MonitoredRoute`           | Defines monitored origin/destination routes           |
| `UserRouteSubscription`    | Connects users to routes and stores preferences       |
| `UserNotificationSchedule` | Stores individual notification time windows           |
| `DepartureObservation`     | Stores observed train departures and their status     |
| `TrainAlert`               | Stores generated alerts and deduplication information |

### Relationships

```text
User
 └── UserRouteSubscription[]
      ├── MonitoredRoute
      │    ├── Line
      │    ├── Origin Station
      │    ├── Destination Station
      │    └── DepartureObservation[]
      │         └── TrainAlert[]
      │
      └── UserNotificationSchedule[]
```

### Important database design decisions

- A user can subscribe to multiple routes.
- A route can have multiple subscribers.
- A subscription can have multiple notification schedules.
- Deleting a user should cascade-delete their subscriptions.
- Deleting a subscription should cascade-delete its schedules.
- The global Discord webhook URL must not be stored in the database.
- Departure observations should be associated with the monitored route.
- Alerts should have deduplication keys to avoid repeated notifications.

The original `RouteSchedule` model has been replaced by `UserNotificationSchedule`.

---

# 7. Discord notifications

## 7.1 Initial implementation: webhook

The application should use one Discord webhook URL stored in `.env`.

```env
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

No Discord bot is required initially.

The webhook should support:

- Sending text messages.
- Sending rich embeds.
- Mentioning the relevant Discord user.
- Reporting train delays.
- Reporting cancellations.
- Reporting replacement buses.
- Reporting platform changes.

### Example notification

```text
🚆 RB89 — Delay detected

Route: Lippstadt → Paderborn
Scheduled: 07:48
Expected: 08:03
Delay: 15 minutes

Your configured delay threshold has been exceeded.
```

## 7.2 Notification processing

The notification service should:

1. Receive a detected train event.
2. Identify subscriptions for the affected route.
3. Check whether each subscription is enabled.
4. Check whether the event matches the user's notification preferences.
5. Check whether the current time is within the user's notification schedule.
6. Check whether the alert has already been sent.
7. Send the Discord notification.
8. Record the notification to prevent duplicates.

### Notification deduplication

The application must avoid sending the same alert every two minutes.

For example, a train delayed by 15 minutes should not generate a new identical notification on every polling cycle.

The deduplication mechanism should allow a genuinely changed event to generate a new alert.

---

# 8. Local testing interface

A small local HTTP server should provide a basic GUI for manually testing train disruptions.

This is a development/testing tool, not a production frontend.

**Requirements:**

- No frontend framework.
- No additional HTTP server dependency.
- Use Node.js built-in `http` module.
- Basic HTML, CSS and JavaScript.
- Accessible through `http://127.0.0.1:3001`.

## 8.1 Planned GUI controls

| Control               | Purpose                          |
| --------------------- | -------------------------------- |
| Route ID              | Select the route being tested    |
| Delay minutes         | Specify a simulated delay        |
| New platform          | Specify a simulated platform     |
| Simulate delay        | Generate a delay event           |
| Simulate cancellation | Generate a cancellation event    |
| Change platform       | Generate a platform-change event |
| Reset simulation      | Clear simulated state            |

## 8.2 HTTP endpoints

| Method | Endpoint          | Purpose                 |
| ------ | ----------------- | ----------------------- |
| GET    | `/`               | Serve testing GUI       |
| POST   | `/api/test-event` | Trigger simulated event |

The test endpoint should validate its input and return JSON responses.

### Testing requirements

- Simulated events must not modify real Deutsche Bahn observations.
- Test events must be distinguishable from real events.
- Test events should use the normal notification service.
- The testing interface should be disabled in production.
- Bind only to `127.0.0.1`.
- Protect the endpoint against unauthorized requests.

The initial implementation logs simulated events. The next development step is to connect it to the actual notification pipeline.

---

# 9. Future Discord bot and natural-language interface

This is explicitly a future feature, not an initial requirement.

The architecture should make it possible to add a Discord bot without rewriting the existing monitoring system.

## 9.1 Discord bot

Eventually, users should be able to interact with the application through Discord commands.

Potential commands:

| Command          | Purpose                          |
| ---------------- | -------------------------------- |
| `/subscribe`     | Subscribe to a train route       |
| `/unsubscribe`   | Remove a subscription            |
| `/routes`        | List available routes            |
| `/subscriptions` | View personal subscriptions      |
| `/schedule`      | Configure notification schedules |
| `/settings`      | Change notification preferences  |

The bot should identify users through their Discord IDs.

## 9.2 Natural-language schedule configuration

A future feature should allow users to describe their desired schedules in ordinary language.

Example:

> Monitor the RB89 from Lippstadt to Paderborn every weekday between 7 and 9. Only notify me if it is delayed by more than 5 minutes.

The application should convert this into structured data.

Proposed architecture:

```text
Discord message
      |
      v
Discord bot
      |
      v
Natural-language parser
      |
      v
Local LLM (Ollama)
      |
      v
Structured JSON
      |
      v
Zod validation
      |
      v
Subscription service
      |
      v
Prisma / SQLite
```

### Requirements

- Run the LLM locally on the host.
- Do not require an external AI API.
- Convert natural-language instructions into structured JSON.
- Validate all generated values.
- Ask clarification questions when information is ambiguous.
- Never allow the LLM to execute arbitrary database queries.
- Keep business logic independent of the LLM.

The LLM should simply be another input mechanism for the existing subscription and schedule services.

---

# 10. Application configuration and operations

## 10.1 Environment variables

The initial `.env` should contain:

```env
DB_CLIENT_ID="your_client_id"
DB_API_KEY="your_api_key"

DISCORD_WEBHOOK_URL="your_discord_webhook"

DATABASE_URL="file:./prisma/dev.db"

CHECK_INTERVAL_MINUTES=2
```

Note: `DATABASE_URL` is the single source of truth. `prisma.config.ts` reads it with `env('DATABASE_URL')` (loaded via `dotenv`), and the application reads it through `src/config/env.ts`. In Prisma 7, relative SQLite paths resolve from the `prisma.config.ts` directory (the project root), so `file:./prisma/dev.db` places the database at `prisma/dev.db`.

## 10.2 Runtime configuration

The application should:

- Load environment variables at startup.
- Validate required configuration.
- Connect to SQLite.
- Start the train monitoring scheduler.
- Optionally start the local test server.
- Handle application shutdown gracefully.
- Disconnect Prisma when shutting down.
- Log startup, shutdown and errors.

## 10.3 Deployment

The application should be capable of running continuously on:

- A local Linux machine.
- A VPS.
- A Docker container.
- A server managed through systemd or PM2.

The host must remain powered on and connected to the internet.

## 10.4 Logging

At minimum, log:

- Application startup and shutdown.
- API requests and failures.
- Monitoring cycle start and completion.
- Detected delays and disruptions.
- Notification attempts.
- Notification failures.
- Test events.
- Database errors.

Avoid logging API keys, webhook URLs or other secrets.

---

# 11. Code quality and project conventions

The following conventions have been established.

### TypeScript

- Strict TypeScript configuration.
- ES Modules.
- `NodeNext` module resolution.
- `.js` extensions for relative imports.
- Type-only imports use `import type`.
- Avoid unnecessary dependencies.

### Formatting

Use Prettier for:

- TypeScript.
- JavaScript.
- JSON.
- Markdown.
- Configuration files.

Use Prisma's native formatter for `.prisma` files.

Commands:

```bash
npm run format
npm run format:check
```

### Suggested project structure

```text
dontBeDeutscheBahned/
│
├── prisma/
│   ├── schema.prisma
│   ├── dev.db
│   └── migrations/
│
├── src/
│   ├── db/
│   │   └── prisma.ts
│   │
│   ├── integrations/
│   │   ├── deutsche-bahn/
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   │
│   │   └── discord/
│   │       └── webhook.ts
│   │
│   ├── services/
│   │   ├── train-monitor.ts
│   │   ├── subscription-service.ts
│   │   ├── schedule-service.ts
│   │   └── notification-service.ts
│   │
│   ├── scheduler/
│   │   └── train-checker.ts
│   │
│   ├── server/
│   │   └── test-server.ts
│   │
│   └── index.ts
│
├── .vscode/
│   └── settings.json
│
├── .env
├── .env.example
├── .gitignore
├── .prettierrc
├── .prettierignore
├── package.json
├── package-lock.json
├── prisma.config.ts
└── tsconfig.json
```

The future Discord bot and LLM components can be added under `integrations/discord/` and `services/` without changing the core monitoring architecture.

---

# 12. Development roadmap

I'd split development into seven phases. Each phase should have a working, testable result before moving on.

## Phase 1 — Project foundation

**Goal:** Establish a stable TypeScript and Prisma 7 application.

Tasks:

- [ ] Clean up npm dependencies.
- [ ] Verify Prisma 7 CLI and Client versions match.
- [ ] Configure Prisma 7 SQLite adapter.
- [ ] Configure `prisma.config.ts`.
- [ ] Establish database at `prisma/dev.db`.
- [ ] Configure TypeScript and ES Modules.
- [ ] Configure Prettier.
- [ ] Configure environment variables.
- [ ] Create application entry point.
- [ ] Establish logging and graceful shutdown.

Proposed additions (pending maintainer confirmation, see §16.6):

- [ ] _(proposed)_ Add a `Dockerfile` (multi-stage, Node LTS, runs migrations then starts the app).
- [ ] _(proposed)_ Add `docker-compose.yml` with a volume for the SQLite database and `env_file: .env`.
- [ ] _(proposed)_ Document one-command setup in the README: `cp .env.example .env && docker compose up -d`.

**Completion criteria:** Application starts, Prisma connects to SQLite, and database migrations work.

## Phase 2 — Database and data models

**Goal:** Implement the complete persistence layer.

Tasks:

- [ ] Implement `User`.
- [ ] Implement `Station`.
- [ ] Implement `LocalizedStationName`.
- [ ] Implement `Line`.
- [ ] Implement `MonitoredRoute`.
- [ ] Implement `UserRouteSubscription`.
- [ ] Implement `UserNotificationSchedule`.
- [ ] Implement `DepartureObservation`.
- [ ] Implement `TrainAlert`.
- [ ] Establish relationships and indexes.
- [ ] Create initial migration.
- [ ] Seed initial stations, lines and routes.

**Completion criteria:** Users can be associated with multiple routes, each with independent notification schedules and preferences.

## Phase 3 — Deutsche Bahn integration

**Goal:** Retrieve and interpret real train information.

Tasks:

- [ ] Implement OpenBoards API client.
- [ ] Implement API authentication.
- [ ] Implement request and response types.
- [ ] Retrieve departures from Paderborn Hbf and Lippstadt.
- [ ] Match relevant services to monitored routes.
- [ ] Parse scheduled and forecast departure times.
- [ ] Calculate delays.
- [ ] Resolve disruption messages.
- [ ] Detect cancellations.
- [ ] Detect replacement buses where the API provides sufficient evidence.
- [ ] Detect platform changes.
- [ ] Persist departure observations.

**Completion criteria:** The application reliably retrieves and stores relevant train information.

## Phase 4 — Monitoring and notification engine

**Goal:** Automatically detect events and notify subscribed users.

Tasks:

- [ ] Implement polling scheduler.
- [ ] Prevent overlapping monitoring cycles.
- [ ] Implement train status comparison.
- [ ] Detect changes between observations.
- [ ] Implement subscription filtering.
- [ ] Implement notification schedule evaluation.
- [ ] Implement delay thresholds.
- [ ] Implement notification preferences.
- [ ] Implement alert deduplication.
- [ ] Implement Discord webhook integration.
- [ ] Implement notification logging and error handling.

**Completion criteria:** A real train delay produces the correct Discord notification for eligible subscribers without repeated duplicate alerts.

## Phase 5 — Manual testing interface

**Goal:** Make testing possible without waiting for actual train disruptions.

Tasks:

- [ ] Implement local HTTP server.
- [ ] Create simple HTML testing interface.
- [ ] Implement simulated delay events.
- [ ] Implement simulated cancellation events.
- [ ] Implement simulated platform changes.
- [ ] Implement simulation reset.
- [ ] Connect test events to notification service.
- [ ] Ensure simulated events never corrupt real observations.
- [ ] Disable the interface in production.

**Completion criteria:** You can manually trigger a simulated delay and receive the corresponding Discord notification.

## Phase 6 — Discord bot

**Goal:** Allow users to manage their subscriptions through Discord.

Tasks:

- [ ] Create Discord application and bot.
- [ ] Implement bot authentication.
- [ ] Implement slash commands.
- [ ] Implement user identification.
- [ ] Implement subscription management.
- [ ] Implement schedule management.
- [ ] Implement notification preference management.
- [ ] Implement confirmation and error messages.

**Completion criteria:** Users can manage their subscriptions without directly interacting with the database.

## Phase 7 — Natural-language interface

**Goal:** Allow users to configure subscriptions using ordinary language.

Tasks:

- [ ] Install and configure Ollama.
- [ ] Select an appropriate lightweight model.
- [ ] Implement natural-language parsing.
- [ ] Define structured JSON output.
- [ ] Implement Zod validation.
- [ ] Implement ambiguity detection.
- [ ] Implement clarification questions.
- [ ] Connect parsed requests to subscription services.
- [ ] Implement conversational schedule updates.

**Completion criteria:** Users can create and modify subscriptions through natural-language Discord messages.

---

# 13. Non-functional requirements

These requirements apply throughout development.

| Requirement     | Specification                                                 |
| --------------- | ------------------------------------------------------------- |
| Reliability     | Temporary API failures must not crash the application         |
| Performance     | Monitoring should not overlap                                 |
| Persistence     | Observations and subscriptions survive restarts               |
| Security        | API credentials and webhook URL remain secret                 |
| Privacy         | Only necessary Discord user information is stored             |
| Modularity      | Business logic is independent of Discord                      |
| Extensibility   | Future bot and LLM integration requires minimal restructuring |
| Testability     | Simulated events must be independent of real train data       |
| Time handling   | All user schedules use `Europe/Berlin`                        |
| Maintainability | Strong TypeScript typing and consistent formatting            |

---

# 14. Decisions still to be finalized

There are a few areas where I'd avoid making assumptions before implementation.

| Question                                                                     | Current proposal                           |
| ---------------------------------------------------------------------------- | ------------------------------------------ |
| Should monitoring cover both directions?                                     | Yes                                        |
| Should all users share one Discord channel?                                  | Yes, initially                             |
| Should users be mentioned individually?                                      | Yes                                        |
| Should notifications be sent outside configured schedules for cancellations? | Not decided                                |
| Should delays be notified again if they increase significantly?              | Yes, subject to deduplication rules        |
| Should historical departure observations be retained indefinitely?           | Probably not; introduce a retention policy |
| Should the application support overnight schedules?                          | Eventually, yes                            |
| Should the test interface run in production?                                 | No                                         |
| Should the LLM be local?                                                     | Yes, when implemented                      |
| Should the application have a web frontend?                                  | No requirement                             |

Two particularly important decisions:

**1. Notification windows versus critical disruptions**

If someone only wants notifications between 07:00 and 09:00, should a cancellation at 09:15 be suppressed? Or should cancellations always be sent regardless of schedule?

I'd make this configurable eventually, but initially respect the user's configured schedule.

**2. Alert escalation**

If a train initially has a 5-minute delay and later increases to 20 minutes, the application should be able to send an updated notification rather than suppressing it as a duplicate.

---

# 15. Definition of the initial MVP

I would consider the first usable release complete when the following works:

1. The application starts automatically.
2. It connects to SQLite.
3. It retrieves departures from Deutsche Bahn.
4. It monitors RB89 and RE11 between Lippstadt and Paderborn, subject to verifying the actual service paths.
5. It detects delays and relevant disruptions.
6. It supports multiple users and subscriptions.
7. It evaluates individual notification schedules.
8. It sends Discord notifications through a webhook.
9. It prevents duplicate alerts.
10. It can simulate delays and disruptions through the local testing interface.

**Everything involving a Discord bot, natural-language input, Ollama and a more advanced interface is outside the MVP.**

---

## My recommendation: Implementation order

I'd prioritize the work in this order:

| Priority | Component                            | Reason                                |
| -------- | ------------------------------------ | ------------------------------------- |
| 1        | Stable Prisma 7 installation         | Foundation for everything else        |
| 2        | Database schema and migrations       | Establish data relationships          |
| 3        | Deutsche Bahn API client             | Get real train data                   |
| 4        | Train monitoring service             | Detect meaningful changes             |
| 5        | Discord notification service         | Deliver useful information            |
| 6        | User subscription and schedule logic | Personalize notifications             |
| 7        | Testing interface                    | Make development and debugging easier |
| 8        | Production deployment                | Run continuously                      |
| 9        | Discord bot                          | Add interaction                       |
| 10       | Local LLM                            | Add natural-language management       |

I'd actually implement the database, API integration and notification service before spending much time on the test GUI. That way, the GUI can exercise real application logic rather than becoming a separate testing implementation.

**The architectural principle I'd preserve throughout:** Deutsche Bahn integration, train monitoring, subscription management, scheduling and notifications should all be independent services. Discord should simply be one way of interacting with those services.

This will let the project grow from a small train-monitoring script into a multi-user application without needing to rewrite its foundation.
---

# 16. Proposed additions (pending maintainer confirmation)

> Proposed by @iamAdarshh. Nothing below is agreed yet — each item can be accepted, changed or
> dropped independently. Once accepted, items can move into the relevant phase above.

## 16.1 AI-assisted development setup — included in this PR

Shared Claude Code configuration so contributors using AI tools get the same project context and
conventions. Contributors who don't use Claude Code can ignore it; `REVIEW.md` is useful for
human reviews too.

- [x] `CLAUDE.md`: project overview, commands, conventions, domain rules, security rules
- [x] `REVIEW.md`: review checklist (train logic, notifications, reliability, security, data model)
- [x] `.claude/settings.json`: safe command permissions, blocks reading `.env` and `dev.db`,
      auto-formats edited files with Prettier / `prisma format`
- [x] Skills: `prisma-change`, `db-api`, `review-changes`, `roadmap-task`
- [x] Agent: `code-reviewer` (independent read-only review before a PR)
- [x] Personal files (`.claude/settings.local.json`, `CLAUDE.local.md`) are git-ignored

## 16.1a Configuration fixes — included in this PR

- [x] Add `dotenv` to dependencies (`prisma.config.ts` already imported it)
- [x] Use `DATABASE_URL` as the single database URL (`env('DATABASE_URL')` in `prisma.config.ts`);
      default changed to `file:./prisma/dev.db` so the DB lands in `prisma/` under Prisma 7
- [x] `src/config/env.ts`: validated config via `getConfig()` (Zod can replace this later)
- [x] `discord.ts` reads the webhook URL through `getConfig()` at call time
- [x] Git-ignore local SQLite files (`*.db`, journal/WAL files)
- [x] Run Prettier on `roadmap.md` so `npm run format:check` passes

## 16.2 Automated tests — proposed

Add **Vitest** (TypeScript + ESM out of the box) with unit tests for the pure rules:

- [ ] Delay calculation (including missing forecast)
- [ ] Route matching (line serves both stations, correct direction)
- [ ] Schedule evaluation (weekday, window boundaries, multiple windows, DST, midnight)
- [ ] Deduplication keys (same event → same key; escalated event → new key)
- [ ] `npm test` script and a GitHub Actions workflow running typecheck, format check and tests

## 16.3 Minimal subscription command in the MVP — proposed

The MVP supports multiple users, but without the bot users can only be added by editing the
database. Proposal: move a minimal `/subscribe` and `/unsubscribe` into the MVP (or provide a
small CLI/seed script), so the group can use it without touching SQLite.

## 16.4 Cancellation grace period — proposed

For §14's open question (cancellation at 09:15 when the window ends at 09:00): add a
configurable per-subscription grace period (e.g. 30 min) that applies to cancellations only.

## 16.5 Delay statistics instead of no history — proposed

Instead of dropping historical observations entirely, keep a small daily aggregate per train
(runs, delayed runs, cancellations, average delay) and apply a retention policy to raw
observations. Enables "how often is the RE11 late?" later with little storage.

## 16.6 Docker in Phase 1 — proposed

Since every user hosts the service themselves, a one-command setup lowers the barrier a lot.
Proposal: add Docker as part of Phase 1 (listed there as _proposed_ items) rather than leaving it
for deployment later, so everyone develops and runs the same environment from the start.

- `Dockerfile` (multi-stage, Node LTS) that runs `prisma migrate deploy` and then starts the app
- `docker-compose.yml` with a named volume for the SQLite database and `env_file: .env`
- README section: `cp .env.example .env && docker compose up -d`

Open question: Docker in Phase 1, or later with production deployment?

## 16.7 Contribution offer

@iamAdarshh is interested in taking **Phase 7 (natural-language scheduling with Ollama + Zod)**,
ideally as an optional feature so hosts without a local LLM can still run the service. Until then,
happy to help with tests (16.2), the bot commands, or Docker.

---
name: db-api
description: Use when working on the Deutsche Bahn integration — the OpenBoards departures client, parsing responses, matching departures to monitored routes, or detecting delays, cancellations, replacement buses and platform changes.
---

# Deutsche Bahn integration

## Sources of truth

- Response types: `src/types/train-checker.ts` (modelled from a real OpenBoards `POST /departures`
  response; the top level is an array of response objects).
- Behaviour rules: `roadmap.md` §3 and the "Domain rules" section of `CLAUDE.md`.
- Don't invent endpoints, fields or query parameters. If something isn't in the types file or the
  roadmap, say so and ask, or ask the user for a sample response.

## Useful fields on a `Departure`

- `timeSchedule` vs `time`: scheduled vs current/forecast time. Delay = `time − timeSchedule`
  in whole minutes (check `timeType` to know what `time` represents).
- `platformSchedule` vs `platform`: a different `name` means a platform change.
- `transport.line.name` / `transport.category`: e.g. `RE11`, `RB89`.
- `transport.direction.stopPlaces` and `transport.via`: use these (EVA numbers) to check the
  train actually reaches the other station of the route. Line name alone is not enough.
- `journeyId` + service date: stable identity of a run; use for observations and dedupe keys.
- `messages`: IDs that point into `Messages.attributes` / `Messages.disruptions`. Disruption
  text and codes are the evidence for cancellations and replacement buses.
- `futureDisruptions`: a hint only. It does **not** prove a cancellation or bus replacement.

## Rules

- Authenticate with `DB_CLIENT_ID` and `DB_API_KEY` from `src/config/env.ts`. Never log them.
- Use built-in `fetch`. Set a timeout (`AbortSignal.timeout`) and handle non-2xx responses.
- An API failure logs a warning and returns "no data this cycle". It must never crash the poller,
  and must never be interpreted as "train cancelled".
- Parse times into `Date` objects once, at the edge; later logic works with `Date` and compares
  in `Europe/Berlin` where a local date/time matters.
- Keep parsing (API shape → internal status) separate from rules (status → alert). Rules should
  be pure functions so they can be unit tested.

## Known stations

| Station       | EVA       |
| ------------- | --------- |
| Paderborn Hbf | `8000297` |
| Lippstadt     | `8000571` |

Monitored lines for the MVP: RB89 and RE11, both directions.

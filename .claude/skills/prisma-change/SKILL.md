---
name: prisma-change
description: Use when changing prisma/schema.prisma — adding or editing models, fields, relations or indexes — or when Prisma 7 setup, migrations or the generated client need fixing.
---

# Changing the Prisma schema

This repo uses **Prisma 7** with the `better-sqlite3` driver adapter. Things differ from older
Prisma tutorials:

- Config lives in `prisma.config.ts` (schema path, migrations path, datasource URL).
- The client is generated to `generated/prisma` (git-ignored) by the `prisma-client` generator.
  Import it from there, e.g. `import { PrismaClient } from '../../generated/prisma/client.js';`
  — check the generated folder for the exact entry file rather than guessing.
- The client is created with the adapter, not a plain `new PrismaClient()`.
- Only one place should define the database URL (`prisma.config.ts` or `DATABASE_URL`), not both.

## Steps

1. Read the relevant model(s) in `prisma/schema.prisma` and the related roadmap section
   (`roadmap.md` §4–§6).
2. Make the change. Keep conventions:
   - `id String @id @default(cuid())`, `createdAt`/`updatedAt` on mutable models
   - explicit `onDelete` on relations (users and subscriptions cascade)
   - an `@@index` for every field you filter on in hot paths (polling, alert lookup)
   - string status/type fields document their allowed values in a comment
3. `npx prisma format` then `npx prisma validate`.
4. `npm run db:migrate -- --name <short_snake_case_description>` to create the migration.
   Never run `prisma migrate reset` without asking — it wipes the local DB.
5. `npm run db:generate`, then `npm run typecheck` and fix any call sites.
6. Commit the schema change and the new folder under `prisma/migrations/` together.
   Never commit `prisma/dev.db` or `generated/`.

## Before finishing

- Does seed data (stations, lines, routes) need updating?
- Will existing rows survive the migration (new required fields need a default)?
- Mention the migration in the PR description.

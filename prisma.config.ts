import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// DATABASE_URL (from .env) is the single source of truth for the database location.
// In Prisma 7, relative SQLite paths resolve from this file's directory (the project root).
// process.env (not env()) so commands that don't touch the DB, like `prisma format`, still
// work without a .env file; migrate/studio will report the missing URL themselves.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

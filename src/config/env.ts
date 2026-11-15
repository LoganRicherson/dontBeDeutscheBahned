import 'dotenv/config';

export interface AppConfig {
  dbClientId: string;
  dbApiKey: string;
  discordWebhookUrl: string;
  databaseUrl: string;
  checkIntervalMinutes: number;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    // Only the variable name goes into the message, never a value.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function positiveInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }
  return value;
}

function loadConfig(): AppConfig {
  return {
    dbClientId: required('DB_CLIENT_ID'),
    dbApiKey: required('DB_API_KEY'),
    discordWebhookUrl: required('DISCORD_WEBHOOK_URL'),
    databaseUrl: required('DATABASE_URL'),
    checkIntervalMinutes: positiveInt('CHECK_INTERVAL_MINUTES', 2),
  };
}

let cached: AppConfig | undefined;

/**
 * Validated application config, loaded from the environment (and `.env`) on first use.
 * Throws with the name of the first missing or invalid variable.
 */
export function getConfig(): AppConfig {
  cached ??= loadConfig();
  return cached;
}

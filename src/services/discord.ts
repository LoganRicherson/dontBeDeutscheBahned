import { getConfig } from '../config/env.js';

export async function sendTrainAlert(
  title: string,
  description: string,
  color: number,
): Promise<void> {
  // Read at call time (not import time) so config is validated in one place.
  const { discordWebhookUrl } = getConfig();

  const response = await fetch(discordWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      embeds: [
        {
          title,
          description,
          color,
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!response.ok) {
    // Never include the webhook URL in errors or logs.
    throw new Error(`Discord webhook failed: ${response.status}`);
  }
}

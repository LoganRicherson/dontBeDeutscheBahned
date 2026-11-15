const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
export async function sendTrainAlert(
  title: string,
  description: string,
  color: number,
): Promise<void> {
  if (!webhookUrl) {
    throw new Error('DISCORD_WEBHOOK_URL is not configured');
  }

  const response = await fetch(webhookUrl, {
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
    throw new Error(`Discord webhook failed: ${response.status}`);
  }
}

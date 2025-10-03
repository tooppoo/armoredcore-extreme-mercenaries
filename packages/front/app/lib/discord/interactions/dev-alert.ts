export async function sendDevAlert(env: Env, content: string, context: { code?: string; correlationId?: string } = {}) {
  const channelId = (env as any).DISCORD_DEV_ALERT_CHANNEL_ID as string | undefined
  const token = (env as any).DISCORD_BOT_TOKEN as string | undefined
  if (!channelId || !token) return { ok: false as const, reason: 'not_configured' as const }

  const body = {
    content,
    embeds: [
      {
        title: 'Discord Interactions Alert',
        description: content,
        color: 0xff5555,
        fields: [
          context.code ? { name: 'code', value: String(context.code), inline: true } : undefined,
          context.correlationId ? { name: 'correlationId', value: String(context.correlationId), inline: true } : undefined,
        ].filter(Boolean),
      },
    ],
  }

  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bot ${token}`,
    },
    body: JSON.stringify(body),
  })
  return { ok: res.ok as boolean, status: res.status }
}


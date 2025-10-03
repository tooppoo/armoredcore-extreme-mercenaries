type Interaction =
  | { type: 1 }
  | {
      type: 2
      id: string
      channel_id?: string
      data?: { name?: string; options?: Array<{ name: string; type: number; value?: string }> }
    }

const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  })

const getOption = (i: any, name: string) =>
  i?.data?.options?.find((o: any) => o?.name === name)?.value as string | undefined

const tryParseJson = (text: string): Interaction | undefined => {
  try {
    return JSON.parse(text) as Interaction
  } catch {
    return undefined
  }
}

const DEFAULT_ALLOWED_CHANNELS = ['111', '222'] as const

const channelListFrom = (value: unknown): string[] =>
  String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

const getAllowedChannels = (env: Record<string, unknown>): Set<string> => {
  const challenge = channelListFrom((env as any).DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS)
  const video = channelListFrom((env as any).DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS)
  const merged = [...challenge, ...video]
  const source = merged.length > 0 ? merged : Array.from(DEFAULT_ALLOWED_CHANNELS)
  return new Set(source)
}

export const onRequest: PagesFunction = async (ctx) => {
  const { request, env } = ctx

  const rawBody = await request.text()
  const body = tryParseJson(rawBody)
  if (!body) {
    const { messageFor } = await import('~/lib/discord/interactions/errors')
    return new Response(messageFor('bad_request'), { status: 400 })
  }

  if ((body as any).type === 1) return json({ type: 1 }, { status: 200 })

  const sig = request.headers.get('X-Signature-Ed25519')
  const ts = request.headers.get('X-Signature-Timestamp')
  if (!sig || !ts) {
    const { messageFor } = await import('~/lib/discord/interactions/errors')
    return new Response(messageFor('unauthorized'), { status: 401 })
  }

  try {
    const { verifyRequestSignature } = await import('~/lib/discord/interactions/verify-signature')
    const ok = await verifyRequestSignature(request, env as any, rawBody)
    if (!ok) return new Response('Unauthorized', { status: 401 })
  } catch {
    const { messageFor } = await import('~/lib/discord/interactions/errors')
    return new Response(messageFor('unauthorized'), { status: 401 })
  }

  const allowed = getAllowedChannels(env as any)
  const ch = (body as any).channel_id
  if (ch && !allowed.has(String(ch))) {
    const { messageFor } = await import('~/lib/discord/interactions/errors')
    return new Response(messageFor('forbidden'), { status: 403 })
  }

  const name = (body as any).data?.name
  const url = getOption(body, 'url')
  const correlationId = (body as any).id as string | undefined

  // Dispatch to repositories (minimal wiring for tests; signature verification TBD)
  if (name === 'archive-video') {
    const { messageFor } = await import('~/lib/discord/interactions/errors')
    const { validateVideoCommand } = await import('~/lib/discord/interactions/command-validator')
    const v = validateVideoCommand((body as any).data?.options)
    if (!v.ok) return json({ type: 4, data: { content: v.message } }, { status: 200 })
    const { url, title, description } = v.data
    const user = { id: 'unknown', name: 'unknown' }
    try {
      const { upsertVideo } = await import('~/lib/discord/interactions/archive-repository')
      const result = await upsertVideo({ url, title, description, user }, env as any)
      const { logger } = await import('~/lib/observability/logger')
      logger.info('video_upsert', { correlationId, result: result.ok ? 'ok' : result.code })
      if (result.ok) return json({ type: 4, data: { content: 'アーカイブに登録しました' } }, { status: 200 })
      if (result.code === 'duplicate')
        return json({ type: 4, data: { content: messageFor('duplicate') } }, { status: 200 })
      if (result.code === 'ogp_fetch_failed')
        {
          const { sendDevAlert } = await import('~/lib/discord/interactions/dev-alert')
          await sendDevAlert(env as any, 'OGP取得に失敗しました', { code: result.code, correlationId })
          return json({ type: 4, data: { content: messageFor('ogp_fetch_failed') } }, { status: 200 })
        }
      if (result.code === 'unsupported')
        return json({ type: 4, data: { content: messageFor('unsupported') } }, { status: 200 })
      {
        const { sendDevAlert } = await import('~/lib/discord/interactions/dev-alert')
        await sendDevAlert(env as any, '予期しないエラーが発生しました', { code: result.code, correlationId })
        return json({ type: 4, data: { content: messageFor('unexpected') } }, { status: 200 })
      }
    } catch {
      const { sendDevAlert } = await import('~/lib/discord/interactions/dev-alert')
      await sendDevAlert(env as any, '予期しないエラーが発生しました', { code: 'unexpected', correlationId })
      const { messageFor } = await import('~/lib/discord/interactions/errors')
      return json({ type: 4, data: { content: messageFor('unexpected') } }, { status: 200 })
    }
  }

  if (name === 'archive-challenge') {
    const { messageFor } = await import('~/lib/discord/interactions/errors')
    const { validateChallengeCommand } = await import('~/lib/discord/interactions/command-validator')
    const v = validateChallengeCommand((body as any).data?.options)
    if (!v.ok) return json({ type: 4, data: { content: v.message } }, { status: 200 })
    const user = { id: 'unknown', name: 'unknown' }
    try {
      const { upsertChallenge } = await import('~/lib/discord/interactions/archive-repository')
      const result = await (async () => {
        if (v.data.kind === 'link')
          return upsertChallenge({ type: 'link', url: v.data.url, title: v.data.title, description: v.data.description, user }, env as any)
        return upsertChallenge({ type: 'text', title: v.data.title, text: v.data.text, user }, env as any)
      })()
      const { logger } = await import('~/lib/observability/logger')
      logger.info('challenge_upsert', { correlationId, result: result.ok ? 'ok' : (result as any).code })
      if (result.ok)
        return json({ type: 5, data: { content: 'アーカイブに登録しました' } }, { status: 200 })
      if (result.code === 'duplicate')
        return json({ type: 4, data: { content: messageFor('duplicate') } }, { status: 200 })
      if (result.code === 'ogp_fetch_failed')
        {
          const { sendDevAlert } = await import('~/lib/discord/interactions/dev-alert')
          await sendDevAlert(env as any, 'OGP取得に失敗しました', { code: result.code, correlationId })
          return json({ type: 4, data: { content: messageFor('ogp_fetch_failed') } }, { status: 200 })
        }
      if (result.code === 'unsupported')
        return json({ type: 4, data: { content: messageFor('unsupported') } }, { status: 200 })
      {
        const { sendDevAlert } = await import('~/lib/discord/interactions/dev-alert')
        await sendDevAlert(env as any, '予期しないエラーが発生しました', { code: result.code, correlationId })
        return json({ type: 4, data: { content: messageFor('unexpected') } }, { status: 200 })
      }
    } catch {
      const { sendDevAlert } = await import('~/lib/discord/interactions/dev-alert')
      await sendDevAlert(env as any, '予期しないエラーが発生しました', { code: 'unexpected', correlationId })
      const { messageFor } = await import('~/lib/discord/interactions/errors')
      return json({ type: 4, data: { content: messageFor('unexpected') } }, { status: 200 })
    }
  }

  return json({ type: 4, data: { content: 'OK' } }, { status: 200 })
}

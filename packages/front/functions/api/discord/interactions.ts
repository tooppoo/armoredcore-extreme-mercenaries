
import { z } from 'zod'
import type { ErrorCode } from '~/lib/discord/interactions/errors'
import type {
  DiscordDisplayName,
  DiscordUser,
  DiscordUserId,
} from '~/lib/discord/interactions/archive-repository'

type Result<T, E> = { ok: true; data: T } | { ok: false; error: E }

const commandOptionSchema = z.object({
  name: z.string(),
  type: z.number(),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
})

const commandDataSchema = z.object({
  name: z.string(),
  options: z.array(commandOptionSchema).optional(),
})

const userSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  global_name: z.string().optional(),
})

const guildMemberSchema = z.object({
  user: userSchema.optional(),
  nick: z.string().optional(),
})

const interactionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal(1) }),
  z.object({
    type: z.literal(2),
    id: z.string(),
    channel_id: z.string().optional(),
    member: guildMemberSchema.optional(),
    user: userSchema.optional(),
    data: commandDataSchema.optional(),
  }),
])

type Interaction = z.infer<typeof interactionSchema>
type CommandInteraction = Extract<Interaction, { type: 2 }>
type CommandOption = z.infer<typeof commandOptionSchema>
type NormalizedOption = { name: string; type: number; value?: string }

const json = (value: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  })

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

const normalizeOptions = (options: CommandOption[] | undefined): NormalizedOption[] | undefined =>
  options?.map((option) => ({
    name: option.name,
    type: option.type,
    value: option.value === undefined ? undefined : String(option.value),
  }))

const parseInteraction = (rawBody: string): Result<Interaction, ErrorCode> => {
  if (!rawBody) return { ok: false, error: 'bad_request' }

  let jsonBody: unknown
  try {
    jsonBody = JSON.parse(rawBody)
  } catch {
    return { ok: false, error: 'bad_request' }
  }

  const parsed = interactionSchema.safeParse(jsonBody)
  if (!parsed.success) {
    return { ok: false, error: 'bad_request' }
  }

  return { ok: true, data: parsed.data }
}

const asDiscordUserId = (value: string): DiscordUserId => value as DiscordUserId
const asDiscordDisplayName = (value: string): DiscordDisplayName =>
  value as DiscordDisplayName

const extractUser = (
  interaction: CommandInteraction,
): Result<DiscordUser, ErrorCode> => {
  const candidateUser = interaction.member?.user ?? interaction.user
  const rawId = candidateUser?.id?.trim()
  if (!rawId) return { ok: false, error: 'bad_request' }

  const nameCandidates = [
    interaction.member?.nick,
    candidateUser?.global_name,
    candidateUser?.username,
  ]
  const resolvedName = nameCandidates.find((name) => name?.trim()) ?? 'unknown'
  const normalizedName =
    resolvedName.trim().length > 0 ? resolvedName.trim() : 'unknown'

  return {
    ok: true,
    data: {
      id: asDiscordUserId(rawId),
      name: asDiscordDisplayName(normalizedName),
    },
  }
}

const respondWithError = async (code: ErrorCode, status = 200) => {
  const { messageFor } = await import('~/lib/discord/interactions/errors')
  return new Response(
    JSON.stringify({ type: 4, data: { content: messageFor(code) } }),
    {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    },
  )
}

export const onRequest: PagesFunction = async (ctx) => {
  const { request, env } = ctx

  const rawBody = await request.text()
  const parsed = parseInteraction(rawBody)
  if (!parsed.ok) return respondWithError(parsed.error)

  const body = parsed.data
  if (body.type === 1) return json({ type: 1 }, { status: 200 })

  const sig = request.headers.get('X-Signature-Ed25519')
  const ts = request.headers.get('X-Signature-Timestamp')
  if (!sig || !ts) return respondWithError('unauthorized')

  try {
    const { verifyRequestSignature } = await import('~/lib/discord/interactions/verify-signature')
    const ok = await verifyRequestSignature(request, env as any, rawBody)
    if (!ok) return respondWithError('unauthorized')
  } catch {
    return respondWithError('unauthorized')
  }

  const allowed = getAllowedChannels(env as any)
  const channelId = body.channel_id
  if (channelId && !allowed.has(String(channelId))) return respondWithError('forbidden', 403)

  const commandName = body.data?.name
  if (!commandName) return respondWithError('bad_request')

  const options = normalizeOptions(body.data?.options)
  const correlationId = body.id
  const userResult = extractUser(body)
  if (!userResult.ok) return respondWithError(userResult.error)
  const user = userResult.data

  if (commandName === 'archive-video') {
    const { messageFor } = await import('~/lib/discord/interactions/errors')
    const { validateVideoCommand } = await import('~/lib/discord/interactions/command-validator')
    const v = validateVideoCommand(options)
    if (!v.ok) return json({ type: 4, data: { content: v.message } }, { status: 200 })
    const { url, title, description } = v.data
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

  if (commandName === 'archive-challenge') {
    const { messageFor } = await import('~/lib/discord/interactions/errors')
    const { validateChallengeCommand } = await import('~/lib/discord/interactions/command-validator')
    const v = validateChallengeCommand(options)
    if (!v.ok) return json({ type: 4, data: { content: v.message } }, { status: 200 })
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

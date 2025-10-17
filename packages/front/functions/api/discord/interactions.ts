import { z } from 'zod'
import type { ErrorCode } from '~/lib/discord/interactions/errors'
import type {
  DiscordDisplayName,
  DiscordUser,
  DiscordUserId,
} from '~/lib/discord/interactions/archive-repository'

type Result<T, E> = { ok: true; data: T } | { ok: false; error: E }

let envValidated = false

const validateEnvironment = async (env: Env): Promise<void> => {
  if (envValidated) return

  const { logger } = await import('~/lib/observability/logger')

  if (!env.DISCORD_PUBLIC_KEY?.trim()) {
    logger.error(
      'DISCORD_PUBLIC_KEY is not set. Application cannot process requests.',
    )
    throw new Error(
      'Required environment variable DISCORD_PUBLIC_KEY is missing',
    )
  }

  envValidated = true
}

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

const channelListFrom = (value: unknown): string[] =>
  String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

const getAllowedChannels = (
  env: Env,
  command: 'archive-video' | 'archive-challenge',
): Set<string> => {
  if (command === 'archive-video') {
    return new Set(
      channelListFrom(env.DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS),
    )
  }
  if (command === 'archive-challenge') {
    return new Set(
      channelListFrom(env.DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS),
    )
  }
  return new Set()
}

const normalizeOptions = (
  options: CommandOption[] | undefined,
): NormalizedOption[] | undefined =>
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
  const resolvedName =
    nameCandidates.map((name) => name?.trim()).find((name) => name) ?? 'unknown'

  return {
    ok: true,
    data: {
      id: asDiscordUserId(rawId),
      name: asDiscordDisplayName(resolvedName),
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

type CommandConfig<T> = {
  validator: (options?: Option[]) => Validation<T>
  handler: (args: T & { user: DiscordUser }, env: Env) => Promise<UpsertResult>
  logPrefix: string
}

type Option = { name: string; type: number; value?: string }
type Validation<T> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; message: string }
type UpsertResult =
  | { ok: true }
  | {
      ok: false
      code: 'duplicate' | 'unsupported' | 'ogp_fetch_failed' | 'unexpected'
    }

const handleArchiveCommand = async <T>(
  config: CommandConfig<T>,
  options: Option[] | undefined,
  user: DiscordUser,
  env: Env,
  correlationId: string,
): Promise<Response> => {
  const { messageFor } = await import('~/lib/discord/interactions/errors')
  const validation = config.validator(options)
  const { logger } = await import('~/lib/observability/logger')
  const log = logger.withCorrelation(correlationId)

  if (!validation.ok) {
    log.warn(`${config.logPrefix}_command_invalid`, {
      reason: validation.message,
    })
    return json(
      { type: 4, data: { content: validation.message } },
      { status: 200 },
    )
  }

  try {
    const result = await config.handler({ ...validation.data, user }, env)

    if (result.ok) {
      log.info(`${config.logPrefix}_upsert_success`, { result: 'ok' })
      return json(
        { type: 4, data: { content: 'アーカイブに登録しました' } },
        { status: 200 },
      )
    }

    if (result.code === 'duplicate') {
      log.warn(`${config.logPrefix}_upsert_duplicate`, { result: result.code })
      return json(
        { type: 4, data: { content: messageFor('duplicate') } },
        { status: 200 },
      )
    }

    if (result.code === 'ogp_fetch_failed') {
      log.warn(`${config.logPrefix}_upsert_ogp_failed`, { result: result.code })
      const { sendDevAlert } = await import(
        '~/lib/discord/interactions/dev-alert'
      )
      await sendDevAlert(env, 'OGP取得に失敗しました', {
        code: result.code,
        correlationId,
      })
      return json(
        { type: 4, data: { content: messageFor('ogp_fetch_failed') } },
        { status: 200 },
      )
    }

    if (result.code === 'unsupported') {
      log.warn(`${config.logPrefix}_upsert_unsupported`, {
        result: result.code,
      })
      return json(
        { type: 4, data: { content: messageFor('unsupported') } },
        { status: 200 },
      )
    }

    log.error(`${config.logPrefix}_upsert_unexpected`, { result: result.code })
    const { sendDevAlert } = await import(
      '~/lib/discord/interactions/dev-alert'
    )
    await sendDevAlert(env, '予期しないエラーが発生しました', {
      code: result.code,
      correlationId,
    })
    return json(
      { type: 4, data: { content: messageFor('unexpected') } },
      { status: 200 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    const cause =
      error instanceof Error && error.cause ? String(error.cause) : undefined
    log.error(`${config.logPrefix}_upsert_exception`, { message, cause })
    const { sendDevAlert } = await import(
      '~/lib/discord/interactions/dev-alert'
    )
    await sendDevAlert(env, '予期しないエラーが発生しました', {
      code: 'unexpected',
      correlationId,
    })
    return json(
      { type: 4, data: { content: messageFor('unexpected') } },
      { status: 200 },
    )
  }
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx
  const pagesEnv = env

  // 環境変数の検証（初回のみ実行）
  await validateEnvironment(pagesEnv)

  const rawBody = await request.text()
  const parsed = parseInteraction(rawBody)
  if (!parsed.ok) return respondWithError(parsed.error)

  const body = parsed.data

  // 署名検証をPING判定より前に実行
  const sig = request.headers.get('X-Signature-Ed25519')
  const ts = request.headers.get('X-Signature-Timestamp')
  if (!sig || !ts) return respondWithError('unauthorized', 401)

  try {
    const { verifyRequestSignature } = await import(
      '~/lib/discord/interactions/verify-signature'
    )
    const ok = await verifyRequestSignature(request, pagesEnv, rawBody)
    if (!ok) return respondWithError('unauthorized', 401)
  } catch {
    return respondWithError('unauthorized', 401)
  }

  if (body.type === 1) return json({ type: 1 }, { status: 200 })

  const commandName = body.data?.name
  if (!commandName) return respondWithError('bad_request')

  // コマンドごとに許可されたチャンネルをチェック
  if (commandName === 'archive-video' || commandName === 'archive-challenge') {
    const allowed = getAllowedChannels(pagesEnv, commandName)
    const channelId = body.channel_id
    if (channelId && !allowed.has(String(channelId)))
      return json(
        {
          type: 4,
          data: {
            content: 'このチャンネルではコマンドを使用できません。',
          },
        },
        { status: 200 },
      )
  }

  const options = normalizeOptions(body.data?.options)
  const correlationId = body.id
  const userResult = extractUser(body)
  if (!userResult.ok) return respondWithError(userResult.error)
  const user = userResult.data

  if (commandName === 'archive-video') {
    const { validateVideoCommand } = await import(
      '~/lib/discord/interactions/command-validator'
    )
    const { upsertVideo } = await import(
      '~/lib/discord/interactions/archive-repository'
    )
    return handleArchiveCommand(
      {
        validator: validateVideoCommand,
        handler: upsertVideo,
        logPrefix: 'video',
      },
      options,
      user,
      pagesEnv,
      correlationId,
    )
  }

  if (commandName === 'archive-challenge') {
    const { validateChallengeCommand } = await import(
      '~/lib/discord/interactions/command-validator'
    )
    const { upsertChallenge } = await import(
      '~/lib/discord/interactions/archive-repository'
    )
    return handleArchiveCommand(
      {
        validator: validateChallengeCommand,
        handler: upsertChallenge,
        logPrefix: 'challenge',
      },
      options,
      user,
      pagesEnv,
      correlationId,
    )
  }

  return json({ type: 4, data: { content: 'OK' } }, { status: 200 })
}

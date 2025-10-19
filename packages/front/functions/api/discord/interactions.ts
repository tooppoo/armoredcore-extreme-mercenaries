import { z } from 'zod'
import {
  ARCHIVE_VIDEO_COMMAND_NAME,
  ARCHIVE_CHALLENGE_COMMAND_NAME,
} from '@ac-extreme-mercenaries/discord-bot/src/command-names'
import { type ErrorCode } from '~/lib/discord/interactions/errors'
import type {
  DiscordDisplayName,
  DiscordUser,
  DiscordUserId,
} from '~/lib/discord/interactions/archive-repository'
import { logger } from '~/lib/observability/logger'

type Result<T, E> = { ok: true; data: T } | { ok: false; error: E }

let envValidated = false

type WorkerSocket = ReturnType<Env['ASSETS']['connect']>
type WorkerSocketOpened =
  WorkerSocket['opened'] extends Promise<infer T> ? T : never
type WorkerSocketConnectArgs = Parameters<Env['ASSETS']['connect']>

const createMockSocket = (): WorkerSocket => ({
  readable: new ReadableStream(),
  writable: new WritableStream(),
  closed: Promise.resolve(),
  opened: Promise.resolve({} as WorkerSocketOpened),
  upgraded: false,
  secureTransport: 'off',
  close: async () => {},
  startTls: () => createMockSocket(),
})

export const WorkerSocketConnect = ((...args: WorkerSocketConnectArgs) => {
  void args
  return createMockSocket()
}) as Env['ASSETS']['connect']

const validateEnvironment = async (env: Env): Promise<void> => {
  if (envValidated) return

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
  nick: z.string().nullable().optional(),
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

const commandIsAllowed = (
  env: Env,
  command: string,
  channelId: string,
): Result<{ allowed: boolean }, ErrorCode> => {
  switch (command) {
    case ARCHIVE_VIDEO_COMMAND_NAME:
      return {
        ok: true,
        data: {
          allowed: new Set(
            channelListFrom(env.DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS),
          ).has(channelId),
        },
      }
    case ARCHIVE_CHALLENGE_COMMAND_NAME:
      return {
        ok: true,
        data: {
          allowed: new Set(
            channelListFrom(env.DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS),
          ).has(channelId),
        },
      }
    default:
      return {
        ok: false,
        error: 'unsupported_command',
      }
  }
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
  if (!rawBody) {
    logger.warn('Received empty body')
    return { ok: false, error: 'bad_request' }
  }

  let jsonBody: unknown
  try {
    jsonBody = JSON.parse(rawBody)
  } catch (e: unknown) {
    logger.warn('Received invalid JSON', { error: e, rawBody })
    return { ok: false, error: 'bad_request' }
  }

  const parsed = interactionSchema.safeParse(jsonBody)
  if (!parsed.success) {
    logger.warn('Received invalid body', { error: parsed.error })
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
  if (!rawId) {
    logger.warn('User ID is missing in interaction')
    return { ok: false, error: 'bad_request' }
  }

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

const formatCommandArgs = (args: {
  title?: string
  description?: string
  url?: string
}): string => {
  const title = args.title?.trim() || '-'
  const description = args.description?.trim() || '-'
  const url = args.url?.trim() || '-'
  return `\n\ntitle: ${title}\ndescription: ${description}\nurl: ${url}`
}

const respondWithContent = (content: string, status = 200) =>
  json({ type: 4, data: { content } }, { status })

const respondWithError = async (code: ErrorCode, status = 200) => {
  const { messageFor } = await import('~/lib/discord/interactions/errors')
  return respondWithContent(messageFor(code), status)
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

const handleArchiveCommand = async <
  T extends { title?: string; description?: string; url?: string },
>(
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
    return respondWithContent(validation.message)
  }

  const argsDisplay = formatCommandArgs(validation.data)

  try {
    const result = await config.handler({ ...validation.data, user }, env)

    if (result.ok) {
      log.info(`${config.logPrefix}_upsert_success`, { result: 'ok' })
      return respondWithContent(`アーカイブに登録しました${argsDisplay}`)
    }

    if (result.code === 'duplicate') {
      log.warn(`${config.logPrefix}_upsert_duplicate`, { result: result.code })
      return respondWithContent(`${messageFor('duplicate')}${argsDisplay}`)
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
      return respondWithContent(
        `${messageFor('ogp_fetch_failed')}${argsDisplay}`,
      )
    }

    if (result.code === 'unsupported') {
      log.warn(`${config.logPrefix}_upsert_unsupported`, {
        result: result.code,
      })
      return respondWithContent(`${messageFor('unsupported')}${argsDisplay}`)
    }

    log.error(`${config.logPrefix}_upsert_unexpected`, { result: result.code })
    const { sendDevAlert } = await import(
      '~/lib/discord/interactions/dev-alert'
    )
    await sendDevAlert(env, '予期しないエラーが発生しました', {
      code: result.code,
      correlationId,
    })
    return respondWithContent(`${messageFor('unexpected')}${argsDisplay}`)
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
    return respondWithContent(`${messageFor('unexpected')}${argsDisplay}`)
  }
}

export type DiscordInteractionsHandlerContext = {
  request: Request
  env: Env
  waitUntil?: (promise: Promise<unknown>) => void
  passThroughOnException?: () => void
}

export const handleDiscordInteractions = async ({
  request,
  env,
  waitUntil,
}: DiscordInteractionsHandlerContext): Promise<Response> => {
  await validateEnvironment(env)

  const rawBody = await request.text()
  const parsed = parseInteraction(rawBody)
  if (!parsed.ok) return respondWithError(parsed.error)

  const body = parsed.data

  const sig = request.headers.get('X-Signature-Ed25519')
  const ts = request.headers.get('X-Signature-Timestamp')
  if (!sig || !ts) return respondWithError('unauthorized', 401)

  const { logger } = await import('~/lib/observability/logger')

  try {
    const { verifyRequestSignature } = await import(
      '~/lib/discord/interactions/verify-signature'
    )
    const ok = await verifyRequestSignature(request, env, rawBody)
    if (!ok) {
      logger.warn('signature_verification_failed', {
        publicKeyLength: env.DISCORD_PUBLIC_KEY?.length ?? 0,
      })
      return respondWithError('unauthorized', 401)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    logger.error('signature_verification_exception', { message })
    return respondWithError('unauthorized', 401)
  }

  if (body.type === 1) {
    logger.info('pong_response', {})
    return json({ type: 1 })
  }

  const interactionLog = logger.withCorrelation(body.id)

  const commandName = body.data?.name
  if (!commandName) {
    interactionLog.warn('command_name_missing', { body })
    return respondWithError('bad_request')
  }

  if (body.channel_id) {
    const resultCommandIsAllowed = commandIsAllowed(
      env,
      commandName,
      body.channel_id,
    )
    if (!resultCommandIsAllowed.ok) {
      interactionLog.warn('command_not_allowed', {
        commandName,
        channelId: body.channel_id,
      })
      return respondWithError(resultCommandIsAllowed.error)
    }
    if (!resultCommandIsAllowed.data.allowed) {
      interactionLog.info('command_channel_not_allowed', {
        commandName,
        channelId: body.channel_id,
      })
      return respondWithError('channel_not_allowed')
    }
  }

  const options = normalizeOptions(body.data?.options)
  const correlationId = body.id
  const userResult = extractUser(body)
  if (!userResult.ok) {
    interactionLog.warn('user_extraction_failed', { error: userResult.error })
    return respondWithError(userResult.error)
  }
  const user = userResult.data

  if (commandName === ARCHIVE_VIDEO_COMMAND_NAME) {
    const { validateVideoCommand } = await import(
      '~/lib/discord/interactions/command-validator'
    )
    const { upsertVideo } = await import(
      '~/lib/discord/interactions/archive-repository'
    )

    interactionLog.info('processing_archive_video_command', { userId: user.id })

    return handleArchiveCommand(
      {
        validator: validateVideoCommand,
        handler: upsertVideo,
        logPrefix: 'video',
      },
      options,
      user,
      env,
      correlationId,
    )
  }

  if (commandName === ARCHIVE_CHALLENGE_COMMAND_NAME) {
    const { validateChallengeCommand } = await import(
      '~/lib/discord/interactions/command-validator'
    )
    const { upsertChallenge } = await import(
      '~/lib/discord/interactions/archive-repository'
    )

    interactionLog.info('processing_archive_challenge_command', {
      userId: user.id,
    })

    return handleArchiveCommand(
      {
        validator: validateChallengeCommand,
        handler: upsertChallenge,
        logPrefix: 'challenge',
      },
      options,
      user,
      env,
      correlationId,
    )
  }

  interactionLog.error('unhandled_command', { command: commandName })

  const { sendDevAlert } = await import('~/lib/discord/interactions/dev-alert')
  const devAlertPromise = sendDevAlert(
    env,
    `コマンド処理が未実装です: ${commandName}`,
    {
      code: 'unhandled_command',
      correlationId,
    },
  )
  if (waitUntil) {
    waitUntil(
      devAlertPromise.catch((error) => {
        interactionLog.error('dev_alert_dispatch_failed', {
          message: error instanceof Error ? error.message : 'unknown',
        })
      }),
    )
  }
  await devAlertPromise

  return respondWithContent('コマンドを処理できませんでした。')
}

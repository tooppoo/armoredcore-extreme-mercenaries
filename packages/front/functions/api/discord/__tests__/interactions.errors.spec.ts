import { describe, it, expect, beforeEach, vi } from 'vitest'

type UpsertVideo =
  (typeof import('~/lib/discord/interactions/archive-repository'))['upsertVideo']
type UpsertChallenge =
  (typeof import('~/lib/discord/interactions/archive-repository'))['upsertChallenge']
type SendDevAlert =
  (typeof import('~/lib/discord/interactions/dev-alert'))['sendDevAlert']

const upsertVideoMock = vi.fn<UpsertVideo>()
const upsertChallengeMock = vi.fn<UpsertChallenge>()
const sendDevAlertMock = vi.fn<SendDevAlert>()

vi.mock('~/lib/observability/logger', () => {
  const infoFn = vi.fn()
  const warnFn = vi.fn()
  const errorFn = vi.fn()

  return {
    logger: {
      info: infoFn,
      warn: warnFn,
      error: errorFn,
      withCorrelation: () => ({
        debug: vi.fn(),
        info: infoFn,
        warn: warnFn,
        error: errorFn,
      }),
    },
  }
})

vi.mock('~/lib/discord/interactions/verify-signature', () => ({
  verifyRequestSignature: vi.fn(async () => true),
}))

vi.mock('~/lib/discord/interactions/archive-repository', () => ({
  upsertVideo: (...args: Parameters<UpsertVideo>) => upsertVideoMock(...args),
  upsertChallenge: (...args: Parameters<UpsertChallenge>) =>
    upsertChallengeMock(...args),
}))

vi.mock('~/lib/discord/interactions/dev-alert', () => ({
  sendDevAlert: (...args: Parameters<SendDevAlert>) =>
    sendDevAlertMock(...args),
}))

import { handleDiscordInteractions } from '../interactions'
import { makeCtx } from './helpers'
import { logger } from '~/lib/observability/logger'

const infoMock = vi.mocked(logger.info)
const warnMock = vi.mocked(logger.warn)
const errorMock = vi.mocked(logger.error)

const baseHeaders = {
  'X-Signature-Ed25519': 'mock-sig',
  'X-Signature-Timestamp': 'mock-ts',
} as const

beforeEach(() => {
  infoMock.mockReset()
  warnMock.mockReset()
  errorMock.mockReset()
  upsertVideoMock.mockReset()
  upsertVideoMock.mockResolvedValue({ ok: false, code: 'duplicate' })
  upsertChallengeMock.mockReset()
  upsertChallengeMock.mockResolvedValue({ ok: true })
  sendDevAlertMock.mockReset()
  sendDevAlertMock.mockResolvedValue({ ok: false, reason: 'not_configured' })
})

describe('error handling and logging', () => {
  it('returns unauthorized without emitting logs when signature headers are missing', async () => {
    const ctx = makeCtx({
      body: {
        type: 2,
        id: 'corr-missing-sig',
        data: { name: 'archive-video', options: [] },
        member: { user: { id: 'user-1', username: 'user' } },
      },
    })

    const res = await handleDiscordInteractions(ctx)
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { type?: number; data?: { content?: string } }

    expect(res.status).toBe(401)
    expect(json).toEqual({ type: 4, data: { content: '認証に失敗しました' } })
    expect(infoMock).not.toHaveBeenCalled()
    expect(warnMock).not.toHaveBeenCalled()
    expect(errorMock).not.toHaveBeenCalled()
  })

  it('logs warn and returns validation message when video command is invalid', async () => {
    const ctx = makeCtx({
      headers: baseHeaders,
      body: {
        type: 2,
        id: 'corr-validation',
        data: { name: 'archive-video', options: [] },
        member: { user: { id: 'user-2', username: 'user' } },
      },
    })

    const res = await handleDiscordInteractions(ctx)
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { type?: number; data?: { content?: string } }

    expect(res.status).toBe(200)
    expect(json).toEqual({
      type: 4,
      data: { content: '必須項目が不足しています' },
    })
    expect(warnMock).toHaveBeenCalledWith('video_command_invalid', {
      reason: '必須項目が不足しています',
    })
    expect(upsertVideoMock).not.toHaveBeenCalled()
  })

  it('logs warn and sends alert when OGP fetching fails', async () => {
    upsertVideoMock.mockResolvedValueOnce({
      ok: false as const,
      code: 'ogp_fetch_failed' as const,
    })
    const ctx = makeCtx({
      headers: baseHeaders,
      body: {
        type: 2,
        id: 'corr-ogp',
        data: {
          name: 'archive-video',
          options: [
            { name: 'url', type: 3, value: 'https://example.com/video' },
          ],
        },
        member: {
          user: { id: 'user-3', username: 'user' },
        },
      },
    })

    const res = await handleDiscordInteractions(ctx)
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { type?: number; data?: { content?: string } }

    expect(res.status).toBe(200)
    expect(json).toEqual({
      type: 4,
      data: {
        content:
          'アーカイブの情報を取得できませんでした\n\ntitle: -\ndescription: -\nurl: https://example.com/video',
      },
    })
    expect(warnMock).toHaveBeenCalledWith('video_upsert_ogp_failed', {
      result: 'ogp_fetch_failed',
    })
    expect(sendDevAlertMock).toHaveBeenCalledWith(
      expect.anything(),
      'OGP取得に失敗しました',
      expect.objectContaining({
        code: 'ogp_fetch_failed',
        correlationId: 'corr-ogp',
      }),
    )
  })

  it('logs error and returns unexpected error when repository throws', async () => {
    upsertVideoMock.mockRejectedValueOnce(new Error('db down'))
    const ctx = makeCtx({
      headers: baseHeaders,
      body: {
        type: 2,
        id: 'corr-exception',
        data: {
          name: 'archive-video',
          options: [
            { name: 'url', type: 3, value: 'https://example.com/video' },
          ],
        },
        member: {
          user: { id: 'user-4', username: 'user' },
        },
      },
    })

    const res = await handleDiscordInteractions(ctx)
    const json = await res
      .clone()
      .json()
      .catch(() => null)

    expect(res.status).toBe(200)
    expect(json).toEqual({
      type: 4,
      data: {
        content:
          '予期しないエラーが発生しました\n\ntitle: -\ndescription: -\nurl: https://example.com/video',
      },
    })
    expect(errorMock).toHaveBeenCalledWith('video_upsert_exception', {
      message: 'db down',
      cause: undefined,
    })
    expect(sendDevAlertMock).toHaveBeenCalledWith(
      expect.anything(),
      '予期しないエラーが発生しました',
      expect.objectContaining({
        code: 'unexpected',
        correlationId: 'corr-exception',
      }),
    )
  })
})

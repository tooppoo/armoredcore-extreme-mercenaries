import { describe, it, expect, vi } from 'vitest'
import { onRequest } from '../interactions'
import { makeCtx } from './helpers'

// 署名検証をモック化
vi.mock('~/lib/discord/interactions/verify-signature', () => ({
  verifyRequestSignature: vi.fn().mockResolvedValue(true),
}))

describe('Discord Interactions contract', () => {
  it('responds PONG to PING (type=1)', async () => {
    const ctx = makeCtx({
      body: { type: 1 },
      headers: {
        'X-Signature-Ed25519': 'sig',
        'X-Signature-Timestamp': 'ts',
      },
    })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { type?: number }
    expect(json).toEqual({ type: 1 })
  })

  it('rejects when signature headers are missing', async () => {
    const ctx = makeCtx({
      body: {
        type: 2,
        id: 'sig-missing',
        data: { name: 'archive-challenge', options: [] },
        member: { user: { id: 'u-1', username: 'user-1' } },
      },
    })
    const res = await onRequest(ctx)
    expect(res.status).toBe(401)
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { type?: number; data?: { content?: string } }
    expect(json).toEqual({ type: 4, data: { content: '認証に失敗しました' } })
  })

  it('does not use ephemeral flag (public message)', async () => {
    const ctx = makeCtx({
      body: {
        type: 2,
        id: 'public-msg',
        data: { name: 'archive-challenge', options: [] },
        member: { user: { id: 'u-2', username: 'user-2' } },
      },
    })
    const res = await onRequest(ctx)
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { data?: { flags?: number } }
    expect(json?.data?.flags ?? 0).not.toBe(64)
  })

  it('returns structured error when body is invalid JSON', async () => {
    const ctx = makeCtx({ rawBody: '{invalid' })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = await res
      .clone()
      .json()
      .catch(() => null)
    expect(json).toEqual({ type: 4, data: { content: 'リクエストが不正です' } })
  })
})

import { describe, it, expect, vi } from 'vitest'
import { onRequest } from '../interactions'
import { makeCtx } from './helpers'

vi.mock('~/lib/discord/interactions/archive-repository', () => ({
  upsertVideo: async () => ({ ok: false, code: 'ogp_fetch_failed' as const }),
}))

// 署名検証をモック化
vi.mock('~/lib/discord/interactions/verify-signature', () => ({
  verifyRequestSignature: vi.fn().mockResolvedValue(true),
}))

describe('OGP fallback', () => {
  it('sets fallback message when OGP fetching fails', async () => {
    const body = {
      type: 2,
      id: 'corr-ogp-fail',
      channel_id: '111',
      data: {
        name: 'archive-video',
        options: [{ name: 'url', type: 3, value: 'https://httpstat.us/404' }],
      },
      member: {
        user: {
          id: '2222',
          username: 'ogp-user',
          global_name: 'OGP User',
        },
      },
    }
    const headers = {
      'X-Signature-Ed25519': '00',
      'X-Signature-Timestamp': '0',
    }
    const ctx = makeCtx({ body, headers })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { data?: { content?: string } }
    expect(json?.data?.content ?? '').toContain('取得できません')
  })
})

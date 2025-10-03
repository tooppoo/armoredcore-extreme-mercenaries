import { describe, it, expect } from 'vitest'
import { onRequest } from '../interactions'
import { vi } from 'vitest'

vi.mock('~/lib/discord/interactions/archive-repository', () => ({
  upsertVideo: async () => ({ ok: false, code: 'ogp_fetch_failed' as const }),
}))

const makeCtx = (init?: { body?: unknown; headers?: HeadersInit; env?: any }) => {
  const headers = new Headers(init?.headers)
  const req = new Request('http://localhost/api/discord/interactions', {
    method: 'POST',
    body: JSON.stringify(init?.body ?? {}),
    headers,
  })
  const ctx: Parameters<typeof onRequest>[0] = {
    request: req,
    env: init?.env ?? ({} as any),
    params: {} as any,
    data: {} as any,
    waitUntil: () => {},
    next: () => Promise.resolve(new Response('NEXT')),
  }
  return ctx
}

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
    }
    const headers = {
      'X-Signature-Ed25519': '00',
      'X-Signature-Timestamp': '0',
    }
    const ctx = makeCtx({ body, headers })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = await res.clone().json().catch(() => null)
    expect(json?.data?.content ?? '').toContain('取得できません')
  })
})

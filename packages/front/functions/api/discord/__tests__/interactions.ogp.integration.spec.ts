import { describe, it, expect, vi } from 'vitest'
import { onRequest } from '../interactions'

vi.mock('~/lib/discord/interactions/archive-repository', () => ({
  upsertVideo: async () => ({ ok: false, code: 'ogp_fetch_failed' as const }),
}))

// 署名検証をモック化
vi.mock('~/lib/discord/interactions/verify-signature', () => ({
  verifyRequestSignature: vi.fn().mockResolvedValue(true),
}))

type RequestContext = Parameters<typeof onRequest>[0]

const baseEnv: Partial<RequestContext['env']> = {
  ASSETS: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  },
  DISCORD_PUBLIC_KEY: 'test-key',
}

const makeCtx = (init?: {
  body?: unknown
  headers?: HeadersInit
  env?: Partial<RequestContext['env']>
}) => {
  const headers = new Headers(init?.headers)
  const req = new Request('http://localhost/api/discord/interactions', {
    method: 'POST',
    body: JSON.stringify(init?.body ?? {}),
    headers,
  })
  const env = { ...baseEnv, ...init?.env } as RequestContext['env']
  return {
    request: req as RequestContext['request'],
    env,
    params: {} as RequestContext['params'],
    data: {} as RequestContext['data'],
    waitUntil: () => {},
    next: () => Promise.resolve(new Response('NEXT')),
    functionPath: '',
    passThroughOnException: () => {},
  } satisfies RequestContext
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

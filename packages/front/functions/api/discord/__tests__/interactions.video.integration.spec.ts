import { describe, it, expect, beforeEach, vi } from 'vitest'
import { onRequest } from '../interactions'

type RequestContext = Parameters<typeof onRequest>[0]
type UpsertVideo =
  (typeof import('~/lib/discord/interactions/archive-repository'))['upsertVideo']

const upsertVideoMock = vi.fn<UpsertVideo>()

vi.mock('~/lib/discord/interactions/archive-repository', () => ({
  upsertVideo: (...args: Parameters<UpsertVideo>) => upsertVideoMock(...args),
}))

// 署名検証をモック化
vi.mock('~/lib/discord/interactions/verify-signature', () => ({
  verifyRequestSignature: vi.fn().mockResolvedValue(true),
}))

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

describe('/archive-video duplicate handling', () => {
  beforeEach(() => {
    upsertVideoMock.mockReset()
    upsertVideoMock.mockResolvedValue({ ok: false, code: 'duplicate' })
  })

  it('returns duplicate notice for already-registered URL', async () => {
    const body = {
      type: 2,
      id: 'corr-dup',
      channel_id: '111',
      data: {
        name: 'archive-video',
        options: [{ name: 'url', type: 3, value: 'https://youtu.be/abc123' }],
      },
      member: {
        nick: 'サンプル表示名',
        user: {
          id: '123456',
          username: 'sample-user',
          global_name: 'Sample User',
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
      .catch(() => null)) as { data?: { content?: string }; type?: number }
    expect(json?.data?.content ?? '').toContain('登録済み')
    expect(upsertVideoMock).toHaveBeenCalledTimes(1)
    expect(upsertVideoMock.mock.calls[0]?.[0]?.user).toEqual({
      id: '123456',
      name: 'サンプル表示名',
    })
  })

  it('falls back to global name when nickname is absent', async () => {
    const body = {
      type: 2,
      id: 'corr-fallback',
      channel_id: '111',
      data: {
        name: 'archive-video',
        options: [{ name: 'url', type: 3, value: 'https://youtu.be/fallback' }],
      },
      member: {
        user: {
          id: '654321',
          username: 'fallback-user',
          global_name: '表示名',
        },
      },
    }
    const headers = {
      'X-Signature-Ed25519': '00',
      'X-Signature-Timestamp': '0',
    }
    const ctx = makeCtx({ body, headers })
    await onRequest(ctx)
    expect(upsertVideoMock).toHaveBeenCalledTimes(1)
    expect(upsertVideoMock.mock.calls[0]?.[0]?.user).toEqual({
      id: '654321',
      name: '表示名',
    })
  })

  it('supports DM payloads using top-level user object', async () => {
    const body = {
      type: 2,
      id: 'corr-dm',
      channel_id: '111',
      data: {
        name: 'archive-video',
        options: [{ name: 'url', type: 3, value: 'https://youtu.be/direct' }],
      },
      user: {
        id: 'dm-user',
        username: 'dm-username',
      },
    }
    const headers = {
      'X-Signature-Ed25519': '00',
      'X-Signature-Timestamp': '0',
    }
    const ctx = makeCtx({ body, headers })
    await onRequest(ctx)
    expect(upsertVideoMock).toHaveBeenCalledWith(
      expect.objectContaining({ user: { id: 'dm-user', name: 'dm-username' } }),
      expect.anything(),
    )
  })
})

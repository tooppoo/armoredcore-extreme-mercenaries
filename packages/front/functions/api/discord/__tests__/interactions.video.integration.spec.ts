import { describe, it, expect, beforeEach, vi } from 'vitest'
import { onRequest } from '../interactions'

const upsertVideoMock = vi.fn(async () => ({
  ok: false,
  code: 'duplicate' as const,
}))

vi.mock('~/lib/discord/interactions/archive-repository', () => ({
  upsertVideo: upsertVideoMock,
}))

type RequestContext = Parameters<typeof onRequest>[0]

const makeCtx = (init?: {
  body?: unknown
  headers?: HeadersInit
  env?: RequestContext['env']
}) => {
  const headers = new Headers(init?.headers)
  const req = new Request('http://localhost/api/discord/interactions', {
    method: 'POST',
    body: JSON.stringify(init?.body ?? {}),
    headers,
  })
  const ctx: RequestContext = {
    request: req,
    env: init?.env ?? ({} as RequestContext['env']),
    params: {} as RequestContext['params'],
    data: {} as RequestContext['data'],
    waitUntil: () => {},
    next: () => Promise.resolve(new Response('NEXT')),
  }
  return ctx
}

describe('/archive-video duplicate handling', () => {
  beforeEach(() => {
    upsertVideoMock.mockClear()
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
    const json = await res
      .clone()
      .json()
      .catch(() => null)
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

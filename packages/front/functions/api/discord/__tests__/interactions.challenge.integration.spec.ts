import { describe, it, expect, beforeEach, vi } from 'vitest'
import { onRequest } from '../interactions'

const upsertChallengeMock = vi.fn(async () => ({ ok: true as const }))

vi.mock('~/lib/discord/interactions/archive-repository', () => ({
  upsertChallenge: upsertChallengeMock,
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

describe('/archive-challenge integration', () => {
  beforeEach(() => {
    upsertChallengeMock.mockClear()
  })

  it('happy path: accepts command and responds public message', async () => {
    const body = {
      type: 2,
      id: 'test-correlation',
      channel_id: '111',
      data: {
        name: 'archive-challenge',
        options: [
          { name: 'title', type: 3, value: 'タイトル' },
          { name: 'url', type: 3, value: 'https://example.com/page' },
        ],
      },
      member: {
        nick: '挑戦者',
        user: {
          id: '7890',
          username: 'challenger',
          global_name: 'Challenger',
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
    expect([4, 5]).toContain(json?.type)
    expect(json?.data?.flags ?? 0).not.toBe(64)
    expect(upsertChallengeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: '7890', name: '挑戦者' },
      }),
      expect.anything(),
    )
  })

  it('falls back to username when nick and global name are missing', async () => {
    const body = {
      type: 2,
      id: 'test-fallback',
      channel_id: '111',
      data: {
        name: 'archive-challenge',
        options: [
          { name: 'title', type: 3, value: '別タイトル' },
          { name: 'text', type: 3, value: 'メモ' },
        ],
      },
      member: {
        user: {
          id: '4444',
          username: 'fallback-name',
        },
      },
    }
    const headers = {
      'X-Signature-Ed25519': '00',
      'X-Signature-Timestamp': '0',
    }
    const ctx = makeCtx({ body, headers })
    await onRequest(ctx)
    expect(upsertChallengeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: '4444', name: 'fallback-name' },
      }),
      expect.anything(),
    )
  })
})

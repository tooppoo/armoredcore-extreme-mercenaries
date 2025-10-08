import { describe, it, expect, beforeEach, vi } from 'vitest'
import { onRequest } from '../interactions'

type RequestContext = Parameters<typeof onRequest>[0]
type UpsertChallenge =
  (typeof import('~/lib/discord/interactions/archive-repository'))['upsertChallenge']

const upsertChallengeMock = vi.fn<UpsertChallenge>()

vi.mock('~/lib/discord/interactions/archive-repository', () => ({
  upsertChallenge: (...args: Parameters<UpsertChallenge>) =>
    upsertChallengeMock(...args),
}))

const baseEnv: Partial<RequestContext['env']> = {
  ASSETS: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  },
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

describe('/archive-challenge integration', () => {
  beforeEach(() => {
    upsertChallengeMock.mockReset()
    upsertChallengeMock.mockResolvedValue({ ok: true })
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
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { type?: number; data?: { flags?: number } | undefined }
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

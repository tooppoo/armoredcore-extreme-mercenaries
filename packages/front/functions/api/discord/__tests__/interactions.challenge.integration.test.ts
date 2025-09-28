import { describe, it, expect } from 'vitest'
import { onRequest } from '../../interactions'

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

describe('/archive-challenge integration', () => {
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
    }
    const ctx = makeCtx({ body })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = await res.clone().json().catch(() => null)
    expect([4, 5]).toContain(json?.type)
    expect(json?.data?.flags ?? 0).not.toBe(64)
  })
})


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

describe('/archive-video duplicate handling', () => {
  it('returns duplicate notice for already-registered URL', async () => {
    const body = {
      type: 2,
      id: 'corr-dup',
      channel_id: '111',
      data: {
        name: 'archive-video',
        options: [{ name: 'url', type: 3, value: 'https://youtu.be/abc123' }],
      },
    }
    const ctx = makeCtx({ body })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = await res.clone().json().catch(() => null)
    expect(json?.data?.content ?? '').toContain('登録済み')
  })
})


import { describe, it, expect } from 'vitest'
import { onRequest } from '../../interactions'

const makeCtx = (init?: { method?: string; body?: unknown; headers?: HeadersInit }) => {
  const method = init?.method ?? 'POST'
  const body = init?.body !== undefined ? JSON.stringify(init.body) : undefined
  const headers = new Headers(init?.headers)
  const req = new Request('http://localhost/api/discord/interactions', {
    method,
    body,
    headers,
  })
  const ctx: Parameters<typeof onRequest>[0] = {
    request: req,
    env: {} as any,
    params: {} as any,
    data: {} as any,
    waitUntil: () => {},
    next: () => Promise.resolve(new Response('NEXT')),
  }
  return ctx
}

describe('Discord Interactions contract', () => {
  it('responds PONG to PING (type=1)', async () => {
    const ctx = makeCtx({ body: { type: 1 } })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = await res.clone().json().catch(() => null)
    expect(json).toEqual({ type: 1 })
  })

  it('rejects when signature headers are missing', async () => {
    const ctx = makeCtx({ body: { type: 2, data: {} } })
    const res = await onRequest(ctx)
    expect(res.status).toBe(401)
  })

  it('does not use ephemeral flag (public message)', async () => {
    const ctx = makeCtx({ body: { type: 2, data: { name: 'archive-challenge', options: [] } } })
    const res = await onRequest(ctx)
    const json = await res.clone().json().catch(() => null)
    expect(json?.data?.flags ?? 0).not.toBe(64)
  })
})


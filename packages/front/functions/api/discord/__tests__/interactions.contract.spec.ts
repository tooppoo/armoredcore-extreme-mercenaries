import { describe, it, expect } from 'vitest'
import { onRequest } from '../interactions'

const makeCtx = (init?: { method?: string; body?: unknown; rawBody?: string; headers?: HeadersInit }) => {
  const method = init?.method ?? 'POST'
  const body = (() => {
    if (init?.rawBody !== undefined) return init.rawBody
    if (init?.body !== undefined) return JSON.stringify(init.body)
    return undefined
  })()
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
    const ctx = makeCtx({ body: { type: 2, id: 'sig-missing', data: { name: 'archive-challenge', options: [] } } })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = await res.clone().json().catch(() => null)
    expect(json).toEqual({ type: 4, data: { content: '認証に失敗しました' } })
  })

  it('does not use ephemeral flag (public message)', async () => {
    const ctx = makeCtx({ body: { type: 2, data: { name: 'archive-challenge', options: [] } } })
    const res = await onRequest(ctx)
    const json = await res.clone().json().catch(() => null)
    expect(json?.data?.flags ?? 0).not.toBe(64)
  })

  it('returns structured error when body is invalid JSON', async () => {
    const ctx = makeCtx({ rawBody: '{invalid' })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = await res.clone().json().catch(() => null)
    expect(json).toEqual({ type: 4, data: { content: 'リクエストが不正です' } })
  })
})

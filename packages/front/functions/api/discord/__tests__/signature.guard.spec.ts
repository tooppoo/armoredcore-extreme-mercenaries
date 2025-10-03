import { describe, it, expect } from 'vitest'
import { onRequest } from '../interactions'

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

describe('signature & channel guards', () => {
  it('returns 401 when signature headers are missing', async () => {
    const ctx = makeCtx({ body: { type: 2, data: {} } })
    const res = await onRequest(ctx)
    expect(res.status).toBe(401)
  })

  it('returns 403 when executed from non-permitted channel', async () => {
    const body = { type: 2, id: 'corr-403', channel_id: '999', data: { name: 'archive-challenge', options: [] } }
    const headers = {
      'X-Signature-Ed25519': '00',
      'X-Signature-Timestamp': '0',
    }
    const ctx = makeCtx({ body, headers })
    const res = await onRequest(ctx)
    expect(res.status).toBe(403)
  })

  it('allows commands when channel is listed in either allowed set', async () => {
    const body = {
      type: 2,
      id: 'corr-union',
      channel_id: '999',
      data: { name: 'archive-challenge', options: [] },
    }
    const headers = {
      'X-Signature-Ed25519': '00',
      'X-Signature-Timestamp': '0',
    }
    const env = {
      DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS: '111',
      DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS: '999',
    }
    const ctx = makeCtx({ body, headers, env })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = await res.clone().json().catch(() => null)
    expect(json?.data?.content ?? '').toContain('必須項目が不足しています')
  })
})

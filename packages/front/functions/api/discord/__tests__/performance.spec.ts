import { describe, it, expect, beforeEach, vi } from 'vitest'
import { performance } from 'node:perf_hooks'
import { onRequest } from '../interactions'

type UpsertVideoArgs = Parameters<
  (typeof import('~/lib/discord/interactions/archive-repository'))['upsertVideo']
>[0]

type UpsertVideoResult = ReturnType<
  (typeof import('~/lib/discord/interactions/archive-repository'))['upsertVideo']
>

let upsertVideoImpl: (input: UpsertVideoArgs) => UpsertVideoResult

vi.mock('~/lib/discord/interactions/verify-signature', () => ({
  verifyRequestSignature: vi.fn(async () => true),
}))

vi.mock('~/lib/observability/logger', () => ({
  logger: {
    withCorrelation: () => ({
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    }),
  },
}))

vi.mock('~/lib/discord/interactions/dev-alert', () => ({
  sendDevAlert: vi.fn(async () => {}),
}))

vi.mock('~/lib/discord/interactions/archive-repository', () => ({
  upsertVideo: (input: UpsertVideoArgs) => upsertVideoImpl(input),
  upsertChallenge: vi.fn(async () => ({ ok: true as const })),
}))

type RequestContext = Parameters<typeof onRequest>[0]

const makeCtx = (init?: {
  id: string
  body?: unknown
  env?: RequestContext['env']
}) => {
  const body = init?.body ?? {
    type: 2,
    id: init?.id,
    channel_id: '111',
    data: {
      name: 'archive-video',
      options: [{ name: 'url', type: 3, value: 'https://example.com/video' }],
    },
    member: { user: { id: 'user-perf', username: 'perf-user' } },
  }
  const headers = new Headers({
    'X-Signature-Ed25519': 'sig',
    'X-Signature-Timestamp': 'ts',
  })
  const req = new Request('http://localhost/api/discord/interactions', {
    method: 'POST',
    body: JSON.stringify(body),
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const percentile = (samples: number[], p: number) => {
  if (samples.length === 0) return 0
  const sorted = [...samples].sort((a, b) => a - b)
  const rank = Math.ceil((p / 100) * sorted.length) - 1
  const index = Math.min(Math.max(rank, 0), sorted.length - 1)
  return sorted[index]
}

beforeEach(() => {
  upsertVideoImpl = async () => {
    return { ok: true }
  }
})

describe('interaction performance budget', () => {
  it('keeps OGP fallback responses under 2s p95', async () => {
    const samples: number[] = []
    upsertVideoImpl = async () => {
      await delay(15)
      return { ok: false, code: 'ogp_fetch_failed' }
    }

    for (let i = 0; i < 10; i += 1) {
      const ctx = makeCtx({ id: `corr-ogp-${i}` })
      const start = performance.now()
      await onRequest(ctx)
      const end = performance.now()
      samples.push(end - start)
    }

    const p95 = percentile(samples, 95)
    expect(p95).toBeLessThan(2000)
  })

  it('keeps successful upsert operations under 2s p95', async () => {
    const samples: number[] = []
    upsertVideoImpl = async () => {
      await delay(10)
      return { ok: true }
    }

    for (let i = 0; i < 10; i += 1) {
      const ctx = makeCtx({ id: `corr-success-${i}` })
      const start = performance.now()
      await onRequest(ctx)
      const end = performance.now()
      samples.push(end - start)
    }

    const p95 = percentile(samples, 95)
    expect(p95).toBeLessThan(2000)
  })
})

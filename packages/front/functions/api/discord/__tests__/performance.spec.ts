import { describe, it, expect, beforeEach, vi } from 'vitest'
import { performance } from 'node:perf_hooks'
import { handleDiscordInteractions } from '../interactions'
import { makeCtx as makeCtxBase } from './helpers'

type UpsertVideo =
  (typeof import('~/lib/discord/interactions/archive-repository'))['upsertVideo']

let upsertVideoImpl: UpsertVideo

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
  upsertVideo: (...args: Parameters<UpsertVideo>) => upsertVideoImpl(...args),
  upsertChallenge: vi.fn(async () => ({ ok: true as const })),
}))

// パフォーマンステスト用のローカルラッパー（デフォルトボディを設定）
const makeCtx = (init?: {
  id: string
  body?: unknown
  env?: NonNullable<Parameters<typeof makeCtxBase>[0]>['env']
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
  return makeCtxBase({
    method: 'POST',
    body,
    headers: {
      'X-Signature-Ed25519': 'sig',
      'X-Signature-Timestamp': 'ts',
    },
    env: init?.env,
  })
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
    upsertVideoImpl = async (input) => {
      if (!input.url) throw new Error('url is required')
      await delay(15)
      return { ok: false, code: 'ogp_fetch_failed' }
    }

    for (let i = 0; i < 10; i += 1) {
      const ctx = makeCtx({ id: `corr-ogp-${i}` })
      const start = performance.now()
      await handleDiscordInteractions(ctx)
      const end = performance.now()
      samples.push(end - start)
    }

    const p95 = percentile(samples, 95)
    expect(p95).toBeLessThan(2000)
  })

  it('keeps successful upsert operations under 2s p95', async () => {
    const samples: number[] = []
    upsertVideoImpl = async (input) => {
      if (!input.url) throw new Error('url is required')
      await delay(10)
      return { ok: true }
    }

    for (let i = 0; i < 10; i += 1) {
      const ctx = makeCtx({ id: `corr-success-${i}` })
      const start = performance.now()
      await handleDiscordInteractions(ctx)
      const end = performance.now()
      samples.push(end - start)
    }

    const p95 = percentile(samples, 95)
    expect(p95).toBeLessThan(2000)
  })
})

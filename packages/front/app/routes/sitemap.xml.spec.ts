import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { D1Database } from '@cloudflare/workers-types'
import { loader } from './sitemap.xml'

vi.mock('~/lib/archives/challenge/revision/repository', () => ({
  getChallengeArchiveListUpdatedAt: vi.fn(
    async () => new Date('2025-01-01T00:00:00Z'),
  ),
  getChallengeArchiveListRevision: vi.fn(async () => 10),
}))

vi.mock('~/lib/archives/video/revision/repository', () => ({
  getVideoArchiveListUpdatedAt: vi.fn(
    async () => new Date('2025-01-02T00:00:00Z'),
  ),
  getVideoArchiveListRevision: vi.fn(async () => 20),
}))

describe('sitemap.xml loader', () => {
  const makeArgs = (headers?: Record<string, string>) => ({
    request: new Request('https://example.com/sitemap.xml', {
      headers,
    }),
    context: { db: {} as D1Database },
    params: {},
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-03T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 200 with ETag and Last-Modified when no If-None-Match', async () => {
    const res = await loader(makeArgs())
    expect(res.status).toBe(200)
    const etag = res.headers.get('ETag')
    expect(etag).toBeTruthy()
    expect(res.headers.get('Last-Modified')).toBe(
      new Date('2025-01-02T00:00:00Z').toUTCString(),
    )
    expect(res.headers.get('Cache-Control')).toMatch(/^public, /)
    const body = await res.text()
    expect(body).toContain('<sitemapindex')
  })

  it('returns 304 when If-None-Match matches', async () => {
    const first = await loader(makeArgs())
    const etag = first.headers.get('ETag')!
    const res = await loader(makeArgs({ 'If-None-Match': etag }))
    expect(res.status).toBe(304)
    expect(res.headers.get('ETag')).toBe(etag)
    // No body on 304
    const text = await res.text()
    expect(text).toBe('')
  })

  it('returns 503 on D1 failure', async () => {
    const crepo = await import('~/lib/archives/challenge/revision/repository')
    // make next call fail
    ;(
      crepo.getChallengeArchiveListUpdatedAt as unknown as ReturnType<
        typeof vi.fn
      >
    ).mockRejectedValueOnce(new Error('D1 down'))
    const res = await loader(makeArgs())
    expect(res.status).toBe(503)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})

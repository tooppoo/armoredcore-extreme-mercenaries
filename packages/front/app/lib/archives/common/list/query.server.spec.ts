import { describe, it, expect } from 'vitest'
import { querySchema, type Order } from './query.server'

const dummyOrderByCreated = (dir: 'asc' | 'desc'): Order => ({
  order: () => [{ sql: 'createdAt ' + dir } as any, { sql: 'id asc' } as any],
})

describe('querySchema (video/challenge common)', () => {
  it('provides defaults when empty', () => {
    const schema = querySchema(dummyOrderByCreated)
    const parsed = schema.parse({})
    expect(parsed.p).toBe(1)
    expect(parsed.k).toBe('')
    expect(parsed.s).toBe('all')
    expect(parsed.o.key).toBe('created.desc')
  })

  it('parses source filter', () => {
    const schema = querySchema(dummyOrderByCreated)
    const parsed = schema.parse({ s: 'yt', p: '2', k: 'test', o: 'created.asc' })
    expect(parsed.s).toBe('yt')
    expect(parsed.p).toBe(2)
    expect(parsed.k).toBe('test')
    expect(parsed.o.key).toBe('created.asc')
  })
})


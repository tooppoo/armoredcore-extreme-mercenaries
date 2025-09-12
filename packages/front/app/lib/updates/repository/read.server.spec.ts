import { describe, it, expect } from 'vitest'
import { getLatestUpdates } from './read.server'

describe('Updates Repository', () => {
  it('should return latest updates limited by the specified number', async () => {
    const latest = await getLatestUpdates(2)

    expect(latest).toBeDefined()
    expect(Array.isArray(latest)).toBe(true)
    expect(latest.length).toBeLessThanOrEqual(2)

    // Check that updates are sorted by date (newest first)
    if (latest.length > 1) {
      expect(latest[0].createdAt >= latest[1].createdAt).toBe(true)
    }
  })

  it('should return default 3 updates when no limit specified', async () => {
    const latest = await getLatestUpdates()

    expect(latest).toBeDefined()
    expect(Array.isArray(latest)).toBe(true)
    expect(latest.length).toBeLessThanOrEqual(3)
  })

  it('should return updates with proper structure', async () => {
    const latest = await getLatestUpdates(1)

    if (latest.length > 0) {
      const update = latest[0]
      expect(update).toHaveProperty('externalId')
      expect(update).toHaveProperty('title')
      expect(update).toHaveProperty('caption')
      expect(update).toHaveProperty('createdAt')
      expect(update).toHaveProperty('content')
    }
  })
})

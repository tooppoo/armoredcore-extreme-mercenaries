import { describe, it, expect, vi } from 'vitest'
import { getLatestVideoArchives, getLatestChallengeArchives } from './repository.server'
import { videoArchives, challengeArchives } from '~/db/schema.server'
import { desc, asc } from 'drizzle-orm'

// Mock database that behaves more like a real database
const createMockDb = () => {
  const mockVideoData = [
    {
      id: 4,
      externalId: 'video-4',
      url: 'https://example.com/video4',
      title: 'Test Video 4',
      description: 'Description 4',
      imageUrl: 'https://example.com/img4.jpg',
      discordAuthorId: 'user4',
      createdAt: new Date('2025-01-04T10:00:00Z'),
    },
    {
      id: 1,
      externalId: 'video-1',
      url: 'https://example.com/video1',
      title: 'Test Video 1',
      description: 'Description 1',
      imageUrl: 'https://example.com/img1.jpg',
      discordAuthorId: 'user1',
      createdAt: new Date('2025-01-03T10:00:00Z'),
    },
    {
      id: 2,
      externalId: 'video-2',
      url: 'https://example.com/video2',
      title: 'Test Video 2',
      description: 'Description 2',
      imageUrl: 'https://example.com/img2.jpg',
      discordAuthorId: 'user2',
      createdAt: new Date('2025-01-02T10:00:00Z'),
    },
    {
      id: 3,
      externalId: 'video-3',
      url: 'https://example.com/video3',
      title: 'Test Video 3',
      description: 'Description 3',
      imageUrl: 'https://example.com/img3.jpg',
      discordAuthorId: 'user3',
      createdAt: new Date('2025-01-01T10:00:00Z'),
    },
  ]

  const mockChallengeData = [
    {
      id: 4,
      externalId: 'challenge-4',
      url: 'https://example.com/challenge4',
      title: 'Test Challenge 4',
      description: 'Challenge Description 4',
      discordAuthorId: 'user4',
      createdAt: new Date('2025-01-04T10:00:00Z'),
    },
    {
      id: 1,
      externalId: 'challenge-1',
      url: 'https://example.com/challenge1',
      title: 'Test Challenge 1',
      description: 'Challenge Description 1',
      discordAuthorId: 'user1',
      createdAt: new Date('2025-01-03T10:00:00Z'),
    },
    {
      id: 2,
      externalId: 'challenge-2',
      url: 'https://example.com/challenge2',
      title: 'Test Challenge 2',
      description: 'Challenge Description 2',
      discordAuthorId: 'user2',
      createdAt: new Date('2025-01-02T10:00:00Z'),
    },
    {
      id: 3,
      externalId: 'challenge-3',
      url: null,
      title: 'Test Challenge 3',
      description: 'Challenge Description 3',
      discordAuthorId: 'user3',
      createdAt: new Date('2025-01-01T10:00:00Z'),
    },
  ]

  let currentTable: any = null
  let limitValue: number | undefined = undefined

  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn((table) => {
      currentTable = table
      return {
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn((limit) => {
          limitValue = limit
          // Return actual sorted and limited data based on table
          if (currentTable === videoArchives) {
            return Promise.resolve(mockVideoData.slice(0, limit))
          } else if (currentTable === challengeArchives) {
            return Promise.resolve(mockChallengeData.slice(0, limit))
          }
          return Promise.resolve([])
        }),
      }
    }),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn((limit) => {
      limitValue = limit
      // Return actual sorted and limited data based on table
      if (currentTable === videoArchives) {
        return Promise.resolve(mockVideoData.slice(0, limit))
      } else if (currentTable === challengeArchives) {
        return Promise.resolve(mockChallengeData.slice(0, limit))
      }
      return Promise.resolve([])
    }),
  }
}

describe('Latest Archives Repository', () => {
  it('should fetch latest video archives with actual seed-like data', async () => {
    const mockDb = createMockDb()
    const result = await getLatestVideoArchives(mockDb as any, 3)
    
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(3)
    
    // Verify the database methods were called correctly
    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalledWith(videoArchives)
    
    // Verify we get actual data sorted by creation date (newest first)
    expect(result[0].title).toBe('Test Video 4') // 2025-01-04
    expect(result[1].title).toBe('Test Video 1') // 2025-01-03
    expect(result[2].title).toBe('Test Video 2') // 2025-01-02
    
    // Verify data structure
    expect(result[0]).toHaveProperty('id')
    expect(result[0]).toHaveProperty('externalId')
    expect(result[0]).toHaveProperty('url')
    expect(result[0]).toHaveProperty('title')
    expect(result[0]).toHaveProperty('description')
    expect(result[0]).toHaveProperty('imageUrl')
    expect(result[0]).toHaveProperty('discordAuthorId')
    expect(result[0]).toHaveProperty('createdAt')
  })

  it('should fetch latest challenge archives with actual seed-like data', async () => {
    const mockDb = createMockDb()
    const result = await getLatestChallengeArchives(mockDb as any, 3)
    
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(3)
    
    // Verify the database methods were called correctly
    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalledWith(challengeArchives)
    
    // Verify we get actual data sorted by creation date (newest first)
    expect(result[0].title).toBe('Test Challenge 4') // 2025-01-04
    expect(result[1].title).toBe('Test Challenge 1') // 2025-01-03
    expect(result[2].title).toBe('Test Challenge 2') // 2025-01-02
    
    // Verify data structure
    expect(result[0]).toHaveProperty('id')
    expect(result[0]).toHaveProperty('externalId')
    expect(result[0]).toHaveProperty('url')
    expect(result[0]).toHaveProperty('title')
    expect(result[0]).toHaveProperty('description')
    expect(result[0]).toHaveProperty('discordAuthorId')
    expect(result[0]).toHaveProperty('createdAt')
  })

  it('should use default limit of 3 when no limit provided for video archives', async () => {
    const mockDb = createMockDb()
    const result = await getLatestVideoArchives(mockDb as any)
    
    expect(result.length).toBe(3)
    expect(result[0].title).toBe('Test Video 4')
  })

  it('should respect custom limit for video archives', async () => {
    const mockDb = createMockDb()
    const result = await getLatestVideoArchives(mockDb as any, 2)
    
    expect(result.length).toBe(2)
    expect(result[0].title).toBe('Test Video 4')
    expect(result[1].title).toBe('Test Video 1')
  })

  it('should respect custom limit for challenge archives', async () => {
    const mockDb = createMockDb()
    const result = await getLatestChallengeArchives(mockDb as any, 2)
    
    expect(result.length).toBe(2)
    expect(result[0].title).toBe('Test Challenge 4')
    expect(result[1].title).toBe('Test Challenge 1')
  })

  it('should handle challenge archives with null URL', async () => {
    const mockDb = createMockDb()
    const result = await getLatestChallengeArchives(mockDb as any, 4)
    
    expect(result.length).toBe(4)
    const challengeWithNullUrl = result.find(c => c.externalId === 'challenge-3')
    expect(challengeWithNullUrl).toBeDefined()
    expect(challengeWithNullUrl!.url).toBeNull()
  })

  it('should call database with correct order by parameters', async () => {
    const mockDb = createMockDb()
    
    // Mock the orderBy method to capture calls
    const orderBySpy = vi.fn().mockReturnThis()
    mockDb.from = vi.fn(() => ({
      orderBy: orderBySpy,
      limit: vi.fn().mockResolvedValue([]),
    }))
    
    await getLatestVideoArchives(mockDb as any, 3)
    
    // Verify orderBy is called with desc(createdAt) and asc(id)
    expect(orderBySpy).toHaveBeenCalledWith(
      desc(videoArchives.createdAt),
      asc(videoArchives.id)
    )
  })
})
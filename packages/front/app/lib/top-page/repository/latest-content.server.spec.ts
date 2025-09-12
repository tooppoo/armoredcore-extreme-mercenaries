import { describe, it, expect, vi } from 'vitest'
import { 
  getLatestVideoArchives, 
  getLatestChallengeArchives, 
  getLatestUpdates, 
  getLatestContent 
} from './latest-content.server'

// Mock the dependencies
vi.mock('~/lib/updates/repository/read.server', () => ({
  pageUpdates: vi.fn(),
}))

// Mock drizzle ORM functions
vi.mock('drizzle-orm', () => ({
  desc: vi.fn(),
  asc: vi.fn(),
}))

// Mock schema
vi.mock('~/db/schema.server', () => ({
  videoArchives: { createdAt: 'createdAt', id: 'id' },
  challengeArchives: { createdAt: 'createdAt', id: 'id' },
}))

describe('latest-content.server', () => {
  describe('getLatestVideoArchives', () => {
    it('should fetch latest 3 video archives ordered by creation date', async () => {
      const mockVideos = [
        { externalId: '1', title: 'Video 1', description: 'Desc 1', imageUrl: 'img1', url: 'url1' },
        { externalId: '2', title: 'Video 2', description: 'Desc 2', imageUrl: 'img2', url: 'url2' },
        { externalId: '3', title: 'Video 3', description: 'Desc 3', imageUrl: 'img3', url: 'url3' },
      ]
      
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockVideos),
      } as any
      
      const result = await getLatestVideoArchives(mockDb)
      
      expect(result).toEqual(mockVideos)
      expect(mockDb.limit).toHaveBeenCalledWith(3)
    })
  })

  describe('getLatestChallengeArchives', () => {
    it('should fetch latest 3 challenge archives ordered by creation date', async () => {
      const mockChallenges = [
        { externalId: '1', title: 'Challenge 1', description: 'Desc 1', url: 'url1', createdAt: new Date() },
        { externalId: '2', title: 'Challenge 2', description: 'Desc 2', url: null, createdAt: new Date() },
        { externalId: '3', title: 'Challenge 3', description: 'Desc 3', url: 'url3', createdAt: new Date() },
      ]
      
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockChallenges),
      } as any
      
      const result = await getLatestChallengeArchives(mockDb)
      
      expect(result).toEqual(mockChallenges)
      expect(mockDb.limit).toHaveBeenCalledWith(3)
    })
  })

  describe('getLatestUpdates', () => {
    it('should fetch latest 3 updates', async () => {
      const mockUpdates = [
        { externalId: '1', title: 'Update 1', caption: 'Caption 1', createdAt: new Date(), content: 'Content 1' },
        { externalId: '2', title: 'Update 2', caption: 'Caption 2', createdAt: new Date(), content: 'Content 2' },
        { externalId: '3', title: 'Update 3', caption: 'Caption 3', createdAt: new Date(), content: 'Content 3' },
        { externalId: '4', title: 'Update 4', caption: 'Caption 4', createdAt: new Date(), content: 'Content 4' },
      ]
      
      const { pageUpdates } = await import('~/lib/updates/repository/read.server')
      vi.mocked(pageUpdates).mockResolvedValueOnce(mockUpdates)
      
      const result = await getLatestUpdates()
      
      expect(result).toEqual(mockUpdates.slice(0, 3))
      expect(pageUpdates).toHaveBeenCalledWith({ page: 1 })
    })
  })

  describe('getLatestContent', () => {
    it('should fetch all latest content concurrently', async () => {
      const mockVideos = [{ externalId: '1', title: 'Video', description: 'Desc', imageUrl: 'img', url: 'url' }]
      const mockChallenges = [{ externalId: '1', title: 'Challenge', description: 'Desc', url: 'url', createdAt: new Date() }]
      const mockUpdates = [{ externalId: '1', title: 'Update', caption: 'Caption', createdAt: new Date(), content: 'Content' }]
      
      // Mock the database for both video and challenge queries
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn()
          .mockResolvedValueOnce(mockVideos)
          .mockResolvedValueOnce(mockChallenges),
      } as any
      
      const { pageUpdates } = await import('~/lib/updates/repository/read.server')
      vi.mocked(pageUpdates).mockResolvedValueOnce(mockUpdates)
      
      const result = await getLatestContent(mockDb)
      
      expect(result).toEqual({
        videos: mockVideos,
        challenges: mockChallenges,
        updates: mockUpdates,
      })
    })
  })
})
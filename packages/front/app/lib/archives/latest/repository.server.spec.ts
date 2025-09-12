import { describe, it, expect, vi } from 'vitest'
import { getLatestVideoArchives, getLatestChallengeArchives } from './repository.server'

// Mock database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
}

describe('Latest Archives Repository', () => {
  it('should fetch latest video archives with correct parameters', async () => {
    await getLatestVideoArchives(mockDb as any, 3)
    
    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalled()
    expect(mockDb.orderBy).toHaveBeenCalled()
    expect(mockDb.limit).toHaveBeenCalledWith(3)
  })

  it('should fetch latest challenge archives with correct parameters', async () => {
    await getLatestChallengeArchives(mockDb as any, 3)
    
    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalled()
    expect(mockDb.orderBy).toHaveBeenCalled()
    expect(mockDb.limit).toHaveBeenCalledWith(3)
  })

  it('should use default limit of 3 when no limit provided', async () => {
    await getLatestVideoArchives(mockDb as any)
    
    expect(mockDb.limit).toHaveBeenCalledWith(3)
  })
})
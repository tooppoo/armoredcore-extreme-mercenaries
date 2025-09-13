import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Database } from '~/db/driver.server'
import {
  getLatestVideoArchives,
  getLatestChallengeArchives,
} from './repository.server'

// レビューコメント対応: e2eテストでseedデータを検証し、こちらは単体テストとして機能を検証
describe('Latest Archives Repository Functions', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnValue([]),
  } as unknown as Database

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getLatestVideoArchives', () => {
    it('正しいクエリ構造でデータベースを呼び出す', async () => {
      await getLatestVideoArchives(mockDb, 5)

      expect(mockDb.select).toHaveBeenCalledTimes(1)
      expect(mockDb.from).toHaveBeenCalledTimes(1)
      expect(mockDb.orderBy).toHaveBeenCalledTimes(1)
      expect(mockDb.limit).toHaveBeenCalledWith(5)
    })

    it('デフォルトlimitが3である', async () => {
      await getLatestVideoArchives(mockDb)

      expect(mockDb.limit).toHaveBeenCalledWith(3)
    })
  })

  describe('getLatestChallengeArchives', () => {
    it('正しいクエリ構造でデータベースを呼び出す', async () => {
      await getLatestChallengeArchives(mockDb, 4)

      expect(mockDb.select).toHaveBeenCalledTimes(1)
      expect(mockDb.from).toHaveBeenCalledTimes(1)
      expect(mockDb.orderBy).toHaveBeenCalledTimes(1)
      expect(mockDb.limit).toHaveBeenCalledWith(4)
    })

    it('デフォルトlimitが3である', async () => {
      await getLatestChallengeArchives(mockDb)

      expect(mockDb.limit).toHaveBeenCalledWith(3)
    })
  })
})

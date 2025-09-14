import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Database } from '~/db/driver.server'
import {
  getLatestVideoArchives,
  getLatestChallengeArchives,
} from './repository.server'

// レビューコメント対応: e2eテストでseedデータを検証し、こちらは単体テストとして機能を検証
describe('Latest Archives Repository Functions', () => {
  // Drizzleの型では `from/orderBy/limit` は select() 後のビルダーに属するため、
  // 期待呼び出し検証は any で保持したコアを参照し、DB引数には Database として渡す。
  const mockDbCore = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnValue([]),
  }
  const mockDb = mockDbCore as unknown as Database

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getLatestVideoArchives', () => {
    it('正しいクエリ構造でデータベースを呼び出す', async () => {
      await getLatestVideoArchives(mockDb, 5)

      expect(mockDbCore.select).toHaveBeenCalledTimes(1)
      expect(mockDbCore.from).toHaveBeenCalledTimes(1)
      expect(mockDbCore.orderBy).toHaveBeenCalledTimes(1)
      expect(mockDbCore.limit).toHaveBeenCalledWith(5)
    })

    it('デフォルトlimitが3である', async () => {
      await getLatestVideoArchives(mockDb)

      expect(mockDbCore.limit).toHaveBeenCalledWith(3)
    })
  })

  describe('getLatestChallengeArchives', () => {
    it('正しいクエリ構造でデータベースを呼び出す', async () => {
      await getLatestChallengeArchives(mockDb, 4)

      expect(mockDbCore.select).toHaveBeenCalledTimes(1)
      expect(mockDbCore.from).toHaveBeenCalledTimes(1)
      expect(mockDbCore.orderBy).toHaveBeenCalledTimes(1)
      expect(mockDbCore.limit).toHaveBeenCalledWith(4)
    })

    it('デフォルトlimitが3である', async () => {
      await getLatestChallengeArchives(mockDb)

      expect(mockDbCore.limit).toHaveBeenCalledWith(3)
  })
})
})

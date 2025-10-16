import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  upsertVideo,
  upsertChallenge,
  type DiscordUserId,
  type DiscordDisplayName,
} from './archive-repository'
import * as driverModule from '../../../db/driver.server'
import * as videoFunctions from '../../archives/video/upload/functions.server'
import * as videoRepository from '../../archives/video/upload/repository/save-video-archive.server'
import * as challengeFunctions from '../../archives/challenge/upload/functions.server'
import * as challengeRepository from '../../archives/challenge/upload/repository/save-challenge-archive.server'
import {
  duplicatedUrl,
  unsupportedUrl,
  failedGetOGP,
} from '../../archives/common/errors.server'

vi.mock('../../../db/driver.server')
vi.mock('../../archives/video/upload/functions.server')
vi.mock('../../archives/video/upload/repository/save-video-archive.server')
vi.mock('../../archives/challenge/upload/functions.server')
vi.mock(
  '../../archives/challenge/upload/repository/save-challenge-archive.server',
)

describe('archive-repository', () => {
  const mockEnv = {} as Env
  const mockDB = {} as driverModule.Database
  const testUser = {
    id: 'test-user-123' as DiscordUserId,
    name: 'Test User' as DiscordDisplayName,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(driverModule.getDB).mockReturnValue(mockDB)
  })

  describe('upsertVideo', () => {
    it('should successfully upsert video archive', async () => {
      const mockContents = {
        externalId: 'test-video-id',
        url: new URL('https://www.youtube.com/watch?v=test'),
        title: 'Test Video',
        description: 'Test Description',
        imageUrl: new URL('https://example.com/thumb.jpg'),
      }

      vi.mocked(videoFunctions.buildVideoArchiveFromUrl).mockResolvedValue(
        mockContents,
      )
      vi.mocked(videoRepository.saveVideoArchive).mockResolvedValue()

      const result = await upsertVideo(
        {
          url: 'https://www.youtube.com/watch?v=test',
          user: testUser,
        },
        mockEnv,
      )

      expect(result).toEqual({ ok: true })
      expect(videoFunctions.buildVideoArchiveFromUrl).toHaveBeenCalledOnce()
      expect(videoRepository.saveVideoArchive).toHaveBeenCalledOnce()
    })

    it('should override title and description when provided', async () => {
      const mockContents = {
        externalId: 'test-video-id',
        url: new URL('https://www.youtube.com/watch?v=test'),
        title: 'Original Title',
        description: 'Original Description',
        imageUrl: new URL('https://example.com/thumb.jpg'),
      }

      vi.mocked(videoFunctions.buildVideoArchiveFromUrl).mockResolvedValue(
        mockContents,
      )
      vi.mocked(videoRepository.saveVideoArchive).mockResolvedValue()

      await upsertVideo(
        {
          url: 'https://www.youtube.com/watch?v=test',
          title: 'Custom Title',
          description: 'Custom Description',
          user: testUser,
        },
        mockEnv,
      )

      expect(videoRepository.saveVideoArchive).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.objectContaining({
            title: 'Custom Title',
            description: 'Custom Description',
          }),
          uploader: testUser,
        }),
        mockDB,
      )
    })

    it('should return duplicate error when URL is already registered', async () => {
      const duplicateError = {
        code: duplicatedUrl,
        message: 'URL already exists',
      }
      vi.mocked(videoFunctions.buildVideoArchiveFromUrl).mockRejectedValue(
        duplicateError,
      )

      const result = await upsertVideo(
        {
          url: 'https://www.youtube.com/watch?v=duplicate',
          user: testUser,
        },
        mockEnv,
      )

      expect(result).toEqual({ ok: false, code: 'duplicate' })
    })

    it('should return unsupported error for unsupported URL', async () => {
      const unsupportedError = {
        code: unsupportedUrl,
        message: 'Unsupported URL',
      }
      vi.mocked(videoFunctions.buildVideoArchiveFromUrl).mockRejectedValue(
        unsupportedError,
      )

      const result = await upsertVideo(
        {
          url: 'https://unsupported-site.com/video',
          user: testUser,
        },
        mockEnv,
      )

      expect(result).toEqual({ ok: false, code: 'unsupported' })
    })

    it('should return ogp_fetch_failed error when OGP fetch fails', async () => {
      const ogpError = {
        code: failedGetOGP,
        message: 'Failed to fetch OGP',
      }
      vi.mocked(videoFunctions.buildVideoArchiveFromUrl).mockRejectedValue(
        ogpError,
      )

      const result = await upsertVideo(
        {
          url: 'https://www.youtube.com/watch?v=ogp-fail',
          user: testUser,
        },
        mockEnv,
      )

      expect(result).toEqual({ ok: false, code: 'ogp_fetch_failed' })
    })

    it('should return unexpected error for unknown errors', async () => {
      vi.mocked(videoFunctions.buildVideoArchiveFromUrl).mockRejectedValue(
        new Error('Unknown error'),
      )

      const result = await upsertVideo(
        {
          url: 'https://www.youtube.com/watch?v=error',
          user: testUser,
        },
        mockEnv,
      )

      expect(result).toEqual({ ok: false, code: 'unexpected' })
    })
  })

  describe('upsertChallenge', () => {
    it('should successfully upsert challenge archive', async () => {
      const mockContents = {
        externalId: 'test-challenge-id',
        title: 'Test Challenge',
        url: new URL('https://www.youtube.com/watch?v=test'),
        description: 'Test Description',
      }

      vi.mocked(
        challengeFunctions.buildChallengeArchiveFromUrl,
      ).mockResolvedValue(mockContents)
      vi.mocked(challengeRepository.saveChallengeArchive).mockResolvedValue()

      const result = await upsertChallenge(
        {
          title: 'Test Challenge',
          url: 'https://www.youtube.com/watch?v=test',
          user: testUser,
        },
        mockEnv,
      )

      expect(result).toEqual({ ok: true })
      expect(
        challengeFunctions.buildChallengeArchiveFromUrl,
      ).toHaveBeenCalledWith(
        {
          title: 'Test Challenge',
          url: 'https://www.youtube.com/watch?v=test',
          description: undefined,
        },
        expect.any(Object),
      )
      expect(challengeRepository.saveChallengeArchive).toHaveBeenCalledWith(
        {
          contents: mockContents,
          uploader: testUser,
        },
        mockDB,
      )
    })

    it('should include optional description', async () => {
      const mockContents = {
        externalId: 'test-challenge-id',
        title: 'Test Challenge',
        url: new URL('https://www.youtube.com/watch?v=test'),
        description: 'Custom Description',
      }

      vi.mocked(
        challengeFunctions.buildChallengeArchiveFromUrl,
      ).mockResolvedValue(mockContents)
      vi.mocked(challengeRepository.saveChallengeArchive).mockResolvedValue()

      await upsertChallenge(
        {
          title: 'Test Challenge',
          url: 'https://www.youtube.com/watch?v=test',
          description: 'Custom Description',
          user: testUser,
        },
        mockEnv,
      )

      expect(
        challengeFunctions.buildChallengeArchiveFromUrl,
      ).toHaveBeenCalledWith(
        {
          title: 'Test Challenge',
          url: 'https://www.youtube.com/watch?v=test',
          description: 'Custom Description',
        },
        expect.any(Object),
      )
    })

    it('should return duplicate error when URL is already registered', async () => {
      const duplicateError = {
        code: duplicatedUrl,
        message: 'URL already exists',
      }
      vi.mocked(
        challengeFunctions.buildChallengeArchiveFromUrl,
      ).mockRejectedValue(duplicateError)

      const result = await upsertChallenge(
        {
          title: 'Duplicate Challenge',
          url: 'https://www.youtube.com/watch?v=duplicate',
          user: testUser,
        },
        mockEnv,
      )

      expect(result).toEqual({ ok: false, code: 'duplicate' })
    })

    it('should return unsupported error for unsupported URL', async () => {
      const unsupportedError = {
        code: unsupportedUrl,
        message: 'Unsupported URL',
      }
      vi.mocked(
        challengeFunctions.buildChallengeArchiveFromUrl,
      ).mockRejectedValue(unsupportedError)

      const result = await upsertChallenge(
        {
          title: 'Unsupported Challenge',
          url: 'https://unsupported-site.com/video',
          user: testUser,
        },
        mockEnv,
      )

      expect(result).toEqual({ ok: false, code: 'unsupported' })
    })

    it('should return ogp_fetch_failed error when OGP fetch fails', async () => {
      const ogpError = {
        code: failedGetOGP,
        message: 'Failed to fetch OGP',
      }
      vi.mocked(
        challengeFunctions.buildChallengeArchiveFromUrl,
      ).mockRejectedValue(ogpError)

      const result = await upsertChallenge(
        {
          title: 'OGP Fail Challenge',
          url: 'https://www.youtube.com/watch?v=ogp-fail',
          user: testUser,
        },
        mockEnv,
      )

      expect(result).toEqual({ ok: false, code: 'ogp_fetch_failed' })
    })

    it('should return unexpected error for unknown errors', async () => {
      vi.mocked(
        challengeFunctions.buildChallengeArchiveFromUrl,
      ).mockRejectedValue(new Error('Unknown error'))

      const result = await upsertChallenge(
        {
          title: 'Error Challenge',
          url: 'https://www.youtube.com/watch?v=error',
          user: testUser,
        },
        mockEnv,
      )

      expect(result).toEqual({ ok: false, code: 'unexpected' })
    })
  })
})

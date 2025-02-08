import { describe, it, expect, vi } from 'vitest'
import { buildChallengeArchiveFromUrl } from './functions.server'
import type { GetOGPStrategy, OGP } from '~/lib/archives/common/ogp/ogp-strategy.server'
import { duplicatedUrl } from '~/lib/archives/common/errors.server'
import { FindArchiveByURL } from '~/lib/archives/common/url/find-archive-by-url'

describe('buildArchiveFromUrl', () => {
  const env: Env = {} as unknown as Env

  it('should use the correct strategy and return the resulting ArchiveContents', async () => {
    const mockUrl = new URL('https://www.youtube.com/watch?v=abc123')
    const mockStrategyResult: OGP = { title: 'video title', description: 'video description', image: 'https://example.com/video.jpg' }

    const getOGPStrategyMock: GetOGPStrategy = vi.fn().mockImplementation(() =>
      async () => mockStrategyResult
    )

    const findByURLMock: FindArchiveByURL = vi.fn().mockResolvedValue(null)

    const result = await buildChallengeArchiveFromUrl(mockUrl, {
      env,
      getOGPStrategy: getOGPStrategyMock,
      findArchiveByURL: findByURLMock,
    })

    expect(getOGPStrategyMock).toHaveBeenCalledWith(mockUrl)
    expect(findByURLMock).toHaveBeenCalledWith(mockUrl)
    expect(result).toMatchObject({
      url: mockUrl,
      title: mockStrategyResult.title,
      description: mockStrategyResult.description,
    })
  })

  it('should throw if the same URL already exists in the archive', async () => {
    const mockUrl = new URL('https://www.youtube.com/watch?v=dup123')
    const getOGPStrategyMock: GetOGPStrategy = vi.fn().mockImplementation(() => {
      return async () => ({ title: 'video title', description: 'video description', image: 'https://example.com/video.jpg' })
    })

    const findByURLMock: FindArchiveByURL = vi.fn().mockResolvedValue({
      id: 1,
      externalId: 'abc',
      url: mockUrl.toString(),
      description: 'duplicate url',
      title: 'title',
    })

    const action = () => buildChallengeArchiveFromUrl(mockUrl, {
      env,
      getOGPStrategy: getOGPStrategyMock,
      findArchiveByURL: findByURLMock,
    })

    await expect(action()).rejects.toMatchObject({ code: duplicatedUrl })
    expect(getOGPStrategyMock).toHaveBeenCalledWith(mockUrl)
    expect(findByURLMock).toHaveBeenCalledWith(mockUrl)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { buildArchiveFromUrl } from './functions.server'
import type { GetOGPStrategy, OGP } from './ogp/ogp-strategy.server'
import type { SearchSameURLArchive } from './functions.server'
import { unsupportedUrl, duplicatedUrl, failedGetOGP } from '~/lib/archives/video/upload/errors.server'

describe('buildArchiveFromUrl', () => {
  const env: Env = {} as unknown as Env

  it('should use the correct strategy and return the resulting ArchiveContents', async () => {
    const mockUrl = new URL('https://www.youtube.com/watch?v=abc123')
    const mockStrategyResult: OGP = { title: 'video title', description: 'video description', image: 'https://example.com/video.jpg' }

    const getOGPStrategyMock: GetOGPStrategy = vi.fn().mockImplementation(() =>
      async () => mockStrategyResult
    )

    const findByURLMock: SearchSameURLArchive = vi.fn().mockResolvedValue(null)

    const result = await buildArchiveFromUrl(mockUrl, {
      env,
      getOGPStrategy: getOGPStrategyMock,
      findByURL: findByURLMock,
    })

    expect(getOGPStrategyMock).toHaveBeenCalledWith(mockUrl)
    expect(findByURLMock).toHaveBeenCalledWith(mockUrl)
    expect(result).toMatchObject({
      url: mockUrl,
      title: mockStrategyResult.title,
      description: mockStrategyResult.description,
      imageUrl: new URL(mockStrategyResult.image)
    })
  })

  it('should throw when URL is unsupported', async () => {
    const mockUrl = new URL('https://www.example.com/unsupported')
    const getOGPStrategyMock: GetOGPStrategy = vi.fn().mockReturnValue(null)
    const findByURLMock: SearchSameURLArchive = vi.fn().mockResolvedValue(null)

    const action = () => buildArchiveFromUrl(mockUrl, {
      env,
      getOGPStrategy: getOGPStrategyMock,
      findByURL: findByURLMock,
    })

    await expect(action()).rejects.toMatchObject({ code: unsupportedUrl })
    expect(getOGPStrategyMock).toHaveBeenCalledWith(mockUrl)
    expect(findByURLMock).not.toHaveBeenCalledOnce()
  })

  it('should throw if the same URL already exists in the archive', async () => {
    const mockUrl = new URL('https://www.youtube.com/watch?v=dup123')
    const getOGPStrategyMock: GetOGPStrategy = vi.fn().mockImplementation(() => {
      return async () => ({ title: 'video title', description: 'video description', image: 'https://example.com/video.jpg' })
    })

    const findByURLMock: SearchSameURLArchive = vi.fn().mockResolvedValue({
      id: 1,
      externalId: 'abc',
      url: mockUrl.toString(),
      description: 'duplicate url',
      title: 'title',
    })

    const action = () => buildArchiveFromUrl(mockUrl, {
      env,
      getOGPStrategy: getOGPStrategyMock,
      findByURL: findByURLMock,
    })

    await expect(action()).rejects.toMatchObject({ code: duplicatedUrl })
    expect(getOGPStrategyMock).toHaveBeenCalledWith(mockUrl)
    expect(findByURLMock).toHaveBeenCalledWith(mockUrl)
  })

  it('should throw if OGP extraction fails', async () => {
    const mockUrl = new URL('https://www.youtube.com/watch?v=failure')
    const getOGPStrategyMock: GetOGPStrategy = vi.fn().mockImplementation(() =>
      async () => { throw new Error('test') }
    )
    const findByURLMock: SearchSameURLArchive = vi.fn().mockResolvedValue(null)

    const action = () => buildArchiveFromUrl(mockUrl, {
      env,
      getOGPStrategy: getOGPStrategyMock,
      findByURL: findByURLMock,
    })
    await expect(action()).rejects.toMatchObject({ code: failedGetOGP })
  })
})
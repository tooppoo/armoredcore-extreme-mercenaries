import { describe, it, expect, vi } from 'vitest'
import { buildChallengeArchiveFromUrl } from './functions.server'
import type { GetOGPStrategy, OGP } from '~/lib/archives/common/ogp/ogp-strategy.server'
import { duplicatedUrl } from '~/lib/archives/common/errors.server'
import { FindArchiveByURL } from '~/lib/archives/common/url/find-archive-by-url'

describe('buildArchiveFromUrl', () => {
  const env: Env = {} as unknown as Env

  it('should use the correct strategy and return the resulting ArchiveContents', async () => {
    const mockUrl = 'https://x.com/example/status/12345678'
    const mockStrategyResult: OGP = { title: 'video title', description: 'video description', image: 'https://example.com/video.jpg' }
    const mockRun = vi.fn().mockImplementation(async () => mockStrategyResult)

    const getOGPStrategyMock: GetOGPStrategy = () => ({
      name: 'mock',
      condition: () => true,
      run: mockRun
    })

    const findByURLMock: FindArchiveByURL = vi.fn().mockResolvedValue(null)

    const result = await buildChallengeArchiveFromUrl({ url: mockUrl, title: 'test' }, {
      env,
      getOGPStrategy: getOGPStrategyMock,
      findArchiveByURL: findByURLMock,
    })

    expect(mockRun).toHaveBeenCalledWith(new URL(mockUrl), expect.anything())
    expect(findByURLMock).toHaveBeenCalledWith(new URL(mockUrl))
    expect(result).toMatchObject({
      url: new URL(mockUrl),
      title: 'test',
      description: mockStrategyResult.description,
    })
  })

  it('should throw if the same URL already exists in the archive', async () => {
    const mockUrl = 'https://x.com/example/status/12345678'
    const mockStrategyResult: OGP = { title: 'video title', description: 'video description', image: 'https://example.com/video.jpg' }
    const mockRun = vi.fn().mockImplementation(async () => mockStrategyResult)

    const getOGPStrategyMock: GetOGPStrategy = () => ({
      name: 'mock',
      condition: () => true,
      run: mockRun
    })

    const findByURLMock: FindArchiveByURL = vi.fn().mockResolvedValue({
      id: 1,
      externalId: 'abc',
      url: mockUrl.toString(),
      description: 'duplicate url',
      title: 'title',
    })

    const action = () => buildChallengeArchiveFromUrl({ url: mockUrl, title: 'test' }, {
      env,
      getOGPStrategy: getOGPStrategyMock,
      findArchiveByURL: findByURLMock,
    })

    await expect(action()).rejects.toMatchObject({ code: duplicatedUrl })
    expect(mockRun).not.toHaveBeenCalled()
    expect(findByURLMock).toHaveBeenCalledWith(new URL(mockUrl))
  })
})

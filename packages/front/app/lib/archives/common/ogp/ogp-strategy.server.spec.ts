import { describe, expect, it } from 'vitest'
import {
  getOGPStrategy,
  withOGPScanner,
  withYouTubeData,
} from '~/lib/archives/common/ogp/ogp-strategy.server'

describe('getOgpStrategy', () => {
  it('should return withYouTubeData when url is youtube watch', () => {
    const url = new URL('https://www.youtube.com/watch?v=123')
    expect(getOGPStrategy(url, [withYouTubeData()]).name).toEqual(
      withYouTubeData().name,
    )
  })
  it('should return withYouTubeData when url is youtu.be', () => {
    const url = new URL('https://youtu.be/123')
    expect(getOGPStrategy(url, [withYouTubeData()]).name).toEqual(
      withYouTubeData().name,
    )
  })
  it('should return withYouTubeData when url is youtube live', () => {
    const url = new URL('https://www.youtube.com/live/123')
    expect(getOGPStrategy(url, [withYouTubeData()]).name).toEqual(
      withYouTubeData().name,
    )
  })
  it('should return withYouTubeData when url is youtube shorts', () => {
    const url = new URL('https://www.youtube.com/shorts/123')
    expect(getOGPStrategy(url, [withYouTubeData()]).name).toEqual(
      withYouTubeData().name,
    )
  })
  it('should return withYouTubeData when url is mobile youtube', () => {
    const url = new URL('https://m.youtube.com/watch?v=123')
    expect(getOGPStrategy(url, [withYouTubeData()]).name).toEqual(
      withYouTubeData().name,
    )
  })
  it('should return withOGPScanner when withOGPScanner is enable', () => {
    const url = new URL('https://www.nicovideo.jp/watch/sm12345678')
    expect(getOGPStrategy(url, [withOGPScanner()]).name).toEqual(
      withOGPScanner().name,
    )
  })
  it('should throw when url is not supported', () => {
    const url = new URL('https://example.com/12345')
    expect(() => getOGPStrategy(url, [])).toThrowError()
  })
})

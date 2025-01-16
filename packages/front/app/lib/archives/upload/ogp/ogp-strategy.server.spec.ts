import { describe, expect, it } from 'vitest'
import { getOGPStrategy, withOGPScanner, withYouTubeData } from '~/lib/archives/upload/ogp/ogp-strategy.server'

describe('getOgpStrategy', () => {
  it('should return withYouTubeEmbed when url is youtube', () => {
    const url = new URL('https://www.youtube.com/watch?v=123')
    expect(getOGPStrategy(url)).toBe(withYouTubeData)
  })
  it('should return withYouTubeEmbed when url is youtu.be', () => {
    const url = new URL('https://youtu.be/123')
    expect(getOGPStrategy(url)).toBe(withYouTubeData)
  })
  it('should return withOGPScanner when url is niconico', () => {
    const url = new URL('https://www.nicovideo.jp/watch/sm12345678')
    expect(getOGPStrategy(url)).toBe(withOGPScanner)
  })
  it('should return withOGPScanner when url is twitter', () => {
    const url = new URL('https://twitter.com/user/status/1234567890')
    expect(getOGPStrategy(url)).toBe(withOGPScanner)
  })
  it('should return withOGPScanner when url is x', () => {
    const url = new URL('https://x.com/user/status/1234567890')
    expect(getOGPStrategy(url)).toBe(withOGPScanner)
  })
})

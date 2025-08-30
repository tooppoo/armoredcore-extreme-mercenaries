import { describe, it, expect } from 'vitest'
import { normalizeUrl } from '~/lib/archives/common/url/support-url.server'

describe('URL normalization for existing archives', () => {
  it('should normalize YouTube live URL to watch format', () => {
    const liveUrl = new URL('https://www.youtube.com/live/dQw4w9WgXcQ')
    const result = normalizeUrl(liveUrl)
    expect(result.toString()).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
  })

  it('should normalize YouTube shorts URL to watch format', () => {
    const shortsUrl = new URL('https://www.youtube.com/shorts/dQw4w9WgXcQ')
    const result = normalizeUrl(shortsUrl)
    expect(result.toString()).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
  })

  it('should normalize youtu.be URL to watch format', () => {
    const shortUrl = new URL('https://youtu.be/dQw4w9WgXcQ')
    const result = normalizeUrl(shortUrl)
    expect(result.toString()).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
  })

  it('should normalize mobile YouTube URL to watch format', () => {
    const mobileUrl = new URL(
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=share',
    )
    const result = normalizeUrl(mobileUrl)
    expect(result.toString()).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
  })

  it('should keep already normalized YouTube URLs unchanged', () => {
    const watchUrl = new URL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    const result = normalizeUrl(watchUrl)
    expect(result.toString()).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
  })

  it('should preserve non-YouTube URLs while removing query parameters', () => {
    const niconicoUrl = new URL(
      'https://www.nicovideo.jp/watch/sm12345?ref=search',
    )
    const result = normalizeUrl(niconicoUrl)
    expect(result.toString()).toBe('https://www.nicovideo.jp/watch/sm12345')
  })
})

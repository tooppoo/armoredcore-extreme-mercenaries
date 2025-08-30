import { describe, it, expect } from 'vitest'
import { normalizeUrlForStorage } from './support-url.server'

describe('support-url', () => {
  describe('normalizeUrlForStorage', () => {
    describe.each([
      [
        'should normalize standard YouTube URL and remove extra params',
        'https://www.youtube.com/watch?v=abc123&foo=bar#myVideo',
        'https://www.youtube.com/watch?v=abc123',
      ],
      [
        'should normalize mobile YouTube URL and remove extra params',
        'https://m.youtube.com/watch?v=abc123&foo=bar#myVideo',
        'https://www.youtube.com/watch?v=abc123',
      ],
      [
        'should normalize youtu.be URL to watch format',
        'https://youtu.be/abc123?foo=bar&baz=123#embed',
        'https://www.youtube.com/watch?v=abc123',
      ],
      [
        'should normalize YouTube live URL to watch format',
        'https://www.youtube.com/live/abc123?foo=bar#live',
        'https://www.youtube.com/watch?v=abc123',
      ],
      [
        'should normalize mobile YouTube live URL to watch format',
        'https://m.youtube.com/live/abc123?foo=bar#live',
        'https://www.youtube.com/watch?v=abc123',
      ],
      [
        'should normalize YouTube shorts URL to watch format',
        'https://www.youtube.com/shorts/abc123?foo=bar#shorts',
        'https://www.youtube.com/watch?v=abc123',
      ],
      [
        'should normalize mobile YouTube shorts URL to watch format',
        'https://m.youtube.com/shorts/abc123?foo=bar#shorts',
        'https://www.youtube.com/watch?v=abc123',
      ],
      [
        'should handle YouTube video IDs with special characters',
        'https://www.youtube.com/live/dQw4w9WgXcQ-ABC_123',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ-ABC_123',
      ],
      [
        'should remove query params and hash for niconico URL',
        'https://www.nicovideo.jp/watch/sm12345678?foo=bar#player',
        'https://www.nicovideo.jp/watch/sm12345678',
      ],
      [
        'should remove query params and hash for Twitter URL',
        'https://twitter.com/user/status/1234567890?foo=bar#tweet',
        'https://twitter.com/user/status/1234567890',
      ],
      [
        'should remove query params and hash for X URL',
        'https://x.com/user/status/1234567890?foo=bar#post',
        'https://x.com/user/status/1234567890',
      ],
      [
        'should remove all query parameters and hash for a general URL',
        'https://www.example.com/?param=123&foo=bar#myHash',
        'https://www.example.com/',
      ],
    ])('%s', (_, originalUrl, expectedUrl) => {
      it(`from ${originalUrl}`, () => {
        const original = new URL(originalUrl)
        const normalized = normalizeUrlForStorage(original)
        expect(normalized.toString()).toBe(expectedUrl)
      })
    })
  })
})

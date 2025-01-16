import { describe, it, expect } from 'vitest'
import { isSupported, normalizeUrl } from './support-url.server'

describe('support-url', () => {
  describe.each([
    ['https://www.youtube.com/watch?v=abc123', true],
    ['https://youtube.com/watch?v=abc123', true],
    ['https://youtu.be/123', true],
    ['https://www.nicovideo.jp/watch/sm12345678', true],
    ['https://nicovideo.jp/watch/sm99999999', true],
    ['https://twitter.com/user/status/1234567890', true],
    ['https://x.com/user/status/1234567890', true],
    ['https://www.example.com', false],
  ])('isSupported: %s -> %s', (urlString, expected) => {
    it(`should return ${expected}`, () => {
      const url = new URL(urlString)
      expect(isSupported(url)).toBe(expected)
    })
  })

  describe('normalizeUrl', () => {
    describe.each([
      [
        'should remove query params and hash for standard YouTube URL',
        'https://www.youtube.com/watch?v=abc123&foo=bar#myVideo',
        'https://www.youtube.com/watch?v=abc123',
      ],
      [
        'should remove query params and hash for youtu.be URL',
        'https://youtu.be/123?foo=bar&baz=123#embed',
        'https://youtu.be/123',
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
        const normalized = normalizeUrl(original)
        expect(normalized.toString()).toBe(expectedUrl)
      })
    })
  })
})

import { clearParameters, cloneURLSearchParams } from '~/lib/utils/url'

// 短縮URLにも対応
export const youtubePattern = /^https:\/\/(www\.)?youtu.be\/[^\s]+$/
export const youtubeWithQueryPattern = /^https:\/\/(www\.)?youtube.com\/watch\?[^\s]+$/
export const niconicoPattern = /^https:\/\/(www\.)?nicovideo.jp\/[^\s]+$/
export const twitterPattern = /^https:\/\/(www\.)?(x|twitter).com\/[^\s]+$/

const patterns = [
  youtubePattern,
  youtubeWithQueryPattern,
  niconicoPattern,
  twitterPattern,
]

export function isSupported(url: URL): boolean {
  return patterns.some(p => p.test(url.toString()))
}

export function normalizeUrl(url: URL): URL {
  if (youtubeWithQueryPattern.test(url.toString())) {
    const query = cloneURLSearchParams(url.searchParams)
    const vId = query.get('v')
    const parent = clearParameters(url)

    return new URL(`${parent.toString()}?v=${vId}`)
  }

  return clearParameters(url)
} 
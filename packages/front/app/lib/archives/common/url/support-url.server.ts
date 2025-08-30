import { clearParameters } from '~/lib/utils/url'

// 短縮URLにも対応
export const youtubePattern = /^https:\/\/(www\.)?youtu.be\/[^\s]+$/
export const youtubeWithQueryPattern =
  /^https:\/\/((www|m)\.)?youtube.com\/watch\?[^\s]+$/
export const youtubeLivePattern =
  /^https:\/\/((www|m)\.)?youtube.com\/live\/[^\s]+$/
export const youtubeShortsPattern =
  /^https:\/\/((www|m)\.)?youtube.com\/shorts\/[^\s]+$/
export const niconicoPattern = /^https:\/\/(www\.)?nicovideo.jp\/[^\s]+$/
export const twitterPattern = /^https:\/\/(www\.)?(x|twitter).com\/[^\s]+$/

function extractYouTubeVideoId(url: URL): string | null {
  // For /watch?v=<ID> URLs
  if (youtubeWithQueryPattern.test(url.toString())) {
    return url.searchParams.get('v')
  }

  // For youtu.be/<ID> URLs
  if (youtubePattern.test(url.toString())) {
    return url.pathname.replace('/', '')
  }

  // For /live/<ID> URLs
  if (youtubeLivePattern.test(url.toString())) {
    return url.pathname.replace('/live/', '')
  }

  // For /shorts/<ID> URLs
  if (youtubeShortsPattern.test(url.toString())) {
    return url.pathname.replace('/shorts/', '')
  }

  return null
}

export function normalizeUrl(url: URL): URL {
  const videoId = extractYouTubeVideoId(url)

  if (videoId) {
    // Normalize all YouTube URLs to standard watch format
    return new URL(`https://www.youtube.com/watch?v=${videoId}`)
  }

  return clearParameters(url)
}

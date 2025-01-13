
export const youtubePattern = /^https:\/\/(www\.)?youtube.com\/[^\s]+$/
export const niconicoPattern = /^https:\/\/(www\.)?nicovideo.jp\/[^\s]+$/
export const twitterPattern = /^https:\/\/(www\.)?(x|twitter).com\/[^\s]+$/

const patterns = [youtubePattern, niconicoPattern, twitterPattern]

export function isSupported(url: string): boolean {
  return patterns.some(p => p.test(url))
}
export function matchSupported(text: string) {
  for(const p of patterns) {
    const result = text.match(p)

    if (result !== null) {
      return result
    }
  }

  return null
}

import { isSupported, youtubePattern, youtubeWithQueryPattern } from '~/lib/archives/upload/url/support-url.server'

export type OGP = Readonly<{
  title: string
  description: string
  image: string
}>

export type OGPStrategy = (url: URL) => Promise<OGP>
type OGPScannerResponse = Readonly<{
  ogp: {
    'og:title': [string]
    'og:description': [string]
    'og:image': [string]
  }
}>
export const withOGPScanner: OGPStrategy = async (url) => {
  const res = await fetch(`https://ogp-scanner.kunon.jp/v1/ogp_info?url=${encodeURI(url.toString())}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })
  const json = await res.json<OGPScannerResponse>()

  return {
    title: json.ogp['og:title'][0],
    description: json.ogp['og:description'][0],
    image: json.ogp['og:image'][0],
  }
}

type YouTubeEmbed = Readonly<{
  title: string
  thumbnail_url: string
}>
export const withYouTubeEmbed: OGPStrategy = async (url) => {
  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURI(url.toString())}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  const json = await res.json<YouTubeEmbed>()

  return {
    title: json.title,
    image: json.thumbnail_url,
    description: '',
  }
}

export type GetOGPStrategy = (url: URL) => OGPStrategy | null
export const getOGPStrategy: GetOGPStrategy = (url) => {
  if (!isSupported(url)) {
    return null
  }

  if (
    youtubePattern.test(url.toString()) ||
    youtubeWithQueryPattern.test(url.toString())
  ) {
    return withYouTubeEmbed
  }
  else {
    return withOGPScanner
  }
}

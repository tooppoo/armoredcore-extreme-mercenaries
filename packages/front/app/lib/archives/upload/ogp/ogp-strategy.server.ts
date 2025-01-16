import { isSupported, youtubePattern, youtubeWithQueryPattern } from '~/lib/archives/upload/url/support-url.server'
import { youtube, youtube_v3 } from '@googleapis/youtube'

export type OGP = Readonly<{
  title: string
  description: string
  image: string
}>

export type OGPStrategy = (url: URL, env: Env) => Promise<OGP>
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

export const withYouTubeData: OGPStrategy = (() => {
  let youtubeClient: youtube_v3.Youtube

  return async (url, env) => {
    if (youtubeClient === undefined) {
      youtubeClient = youtube({
        version: 'v3',
        auth: env.YOUTUBE_PUBLIC_DATA_API_KEY,
      })
    }
    const id = url.searchParams.get('v') || url.pathname.replace('/','')

    const res = await youtubeClient.videos.list({
      id: [id],
      part: ['snippet'],
    })
    const target = res.data.items?.[0]

    if (!target) {
      throw new Error(`no video found by ${id}`)
    }

    return {
      title: target.snippet?.title || '',
      description: target.snippet?.description || '',
      image: target.snippet?.thumbnails?.high?.url || '',
    }
  }
})()

export type GetOGPStrategy = (url: URL) => OGPStrategy | null
export const getOGPStrategy: GetOGPStrategy = (url) => {
  if (!isSupported(url)) {
    return null
  }

  if (
    youtubePattern.test(url.toString()) ||
    youtubeWithQueryPattern.test(url.toString())
  ) {
    return withYouTubeData
  }
  else {
    return withOGPScanner
  }
}

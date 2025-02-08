import { isSupported, youtubePattern, youtubeWithQueryPattern } from '~/lib/archives/common/url/support-url.server'
import { youtube, youtube_v3 } from '@googleapis/youtube'
import { failedGetOGP, FailedGetOGPError, unsupportedUrl, UnsupportedUrlError } from '~/lib/archives/common/errors.server'
import { makeCatchesSerializable } from '~/lib/error'

export type OGP = Readonly<{
  title: string
  description: string
  image: string
}>

export type OGPStrategy = (url: URL, env: Env) => Promise<OGP>
export type GetOGPStrategy = (url: URL) => OGPStrategy 
export const getOGPStrategy: GetOGPStrategy = (url) => {
  if (!isSupported(url)) {
    throw {
      code: unsupportedUrl,
      message: `${url.toString()} is not supported`,
      detail: {
        url: url.toString(),
      }
    } satisfies UnsupportedUrlError
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

type OGPScannerResponse = Readonly<{
  ogp: {
    'og:title': [string]
    'og:description': [string]
    'og:image': [string]
  }
}>
export const withOGPScanner: OGPStrategy = defineStrategy(async (url) => {
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
})

export const withYouTubeData: OGPStrategy = defineStrategy((() => {
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
})())

function defineStrategy(strategy: OGPStrategy): OGPStrategy {
  return (url, env) => strategy(url, env).catch((error) => {
    throw {
      code: failedGetOGP,
      message: error instanceof Error
        ? error.message
        : JSON.stringify(error),
      detail: makeCatchesSerializable(error),
    } satisfies FailedGetOGPError
  })
}

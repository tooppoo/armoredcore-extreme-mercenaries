import {
  youtubePattern,
  youtubeWithQueryPattern,
  youtubeLivePattern,
  youtubeShortsPattern,
  normalizeUrl,
} from '~/lib/archives/common/url/support-url.server'
import {
  failedGetOGP,
  FailedGetOGPError,
  unsupportedUrl,
  UnsupportedUrlError,
} from '~/lib/archives/common/errors.server'
import { makeCatchesSerializable } from '~/lib/error'

export type OGP = Readonly<{
  title: string
  description: string
  image: string
}>

type OGPStrategy = Readonly<{
  name: string
  condition: OGPStrategyCondition
  run: OGPStrategyFunction
}>
type OGPStrategyCondition = (url: URL) => boolean
type OGPStrategyFunction = (url: URL, env: Env) => Promise<OGP>
export type GetOGPStrategy = (
  url: URL,
  strategies: OGPStrategy[],
) => OGPStrategy
export const getOGPStrategy: GetOGPStrategy = (url, strategies) => {
  for (const strategy of strategies) {
    if (strategy.condition(url)) {
      return strategy
    }
  }

  throw {
    code: unsupportedUrl,
    message: `${url.toString()} is not supported`,
    detail: {
      url: url.toString(),
    },
  } satisfies UnsupportedUrlError
}

type OGPScannerResponse = Readonly<{
  ogp: {
    'og:title': [string]
    'og:description': [string]
    'og:image': [string]
  }
}>
export const withOGPScanner = (
  cond: OGPStrategyCondition = () => true,
): OGPStrategy =>
  defineStrategy('withOGPScanner', cond, async (url) => {
    const res = await fetch(
      `https://ogp-scanner.kunon.jp/v1/ogp_info?url=${encodeURI(url.toString())}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    )
    const json = await res.json<OGPScannerResponse>()

    return {
      title: json.ogp['og:title'][0],
      description: json.ogp['og:description'][0],
      image: json.ogp['og:image'][0],
    }
  })

export const withYouTubeData = (): OGPStrategy =>
  defineStrategy(
    'withYouTubeData',
    (url) =>
      youtubePattern.test(url.toString()) ||
      youtubeWithQueryPattern.test(url.toString()) ||
      youtubeLivePattern.test(url.toString()) ||
      youtubeShortsPattern.test(url.toString()),
    ((): OGPStrategyFunction => {
      return async (url, env) => {
        // Normalize URL to extract video ID consistently
        const normalizedUrl = normalizeUrl(url)
        const id = normalizedUrl.searchParams.get('v')

        if (!id) {
          throw new Error(
            `Unable to extract video ID from URL: ${url.toString()}`,
          )
        }

        // Call YouTube Data API v3 via fetch (Workers-safe)
        const apiUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
        apiUrl.searchParams.set('part', 'snippet')
        apiUrl.searchParams.set('id', id)
        apiUrl.searchParams.set('key', env.YOUTUBE_PUBLIC_DATA_API_KEY)

        const res = await fetch(apiUrl.toString(), {
          method: 'GET',
          headers: { Accept: 'application/json' },
        })

        if (!res.ok) {
          throw new Error(
            `YouTube API request failed: ${res.status} ${res.statusText}`,
          )
        }

        type YouTubeVideosResponse = {
          items?: Array<{
            snippet?: {
              title?: string
              description?: string
              thumbnails?: {
                high?: { url?: string }
                standard?: { url?: string }
                maxres?: { url?: string }
              }
            }
          }>
        }

        const data = (await res.json()) as YouTubeVideosResponse
        const target = data.items?.[0]
        if (!target || !target.snippet) {
          throw new Error(`no video found by ${id}`)
        }

        const imageUrl =
          target.snippet.thumbnails?.high?.url ||
          target.snippet.thumbnails?.standard?.url ||
          target.snippet.thumbnails?.maxres?.url ||
          ''

        return {
          title: target.snippet.title || '',
          description: target.snippet.description || '',
          image: imageUrl,
        }
      }
    })(),
  )

function defineStrategy(
  name: string,
  condition: OGPStrategyCondition,
  run: OGPStrategyFunction,
): OGPStrategy {
  return {
    name,
    condition,
    run: (url, env) =>
      run(url, env).catch((error) => {
        throw {
          code: failedGetOGP,
          message:
            error instanceof Error ? error.message : JSON.stringify(error),
          detail: makeCatchesSerializable(error),
        } satisfies FailedGetOGPError
      }),
  }
}

import {
  youtubePattern,
  youtubeWithQueryPattern,
  youtubeLivePattern,
  youtubeShortsPattern,
  normalizeUrl,
} from '~/lib/archives/common/url/support-url.server'
import { youtube, youtube_v3 } from '@googleapis/youtube'
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
    (() => {
      let youtubeClient: youtube_v3.Youtube

      return async (url, env) => {
        if (youtubeClient === undefined) {
          youtubeClient = youtube({
            version: 'v3',
            auth: env.YOUTUBE_PUBLIC_DATA_API_KEY,
          })
        }

        // Normalize URL to extract video ID consistently
        const normalizedUrl = normalizeUrl(url)
        const id = normalizedUrl.searchParams.get('v')

        if (!id) {
          throw new Error(
            `Unable to extract video ID from URL: ${url.toString()}`,
          )
        }

        const res = (await youtubeClient.videos.list({
          id: [id],
          part: ['snippet'],
        })) as { data: { items?: youtube_v3.Schema$Video[] } }
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

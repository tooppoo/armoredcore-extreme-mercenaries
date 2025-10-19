import {
  createRequestHandler,
  type GetLoadContextFunction,
} from '@react-router/cloudflare'
import type { ServerBuild } from 'react-router'
import * as build from './build/server'
import { getLoadContext } from './load-context'
import { handleDiscordInteractions } from './functions/api/discord/interactions'

const buildWithHackedType = build as unknown as ServerBuild
const getLoadContextHackedType =
  getLoadContext as unknown as GetLoadContextFunction

const handleRequest = createRequestHandler<Env>({
  build: buildWithHackedType,
  getLoadContext: getLoadContextHackedType,
})

type WorkerEventContext = Parameters<typeof handleRequest>[0]

const isDiscordInteractionsRoute = (request: Request): boolean => {
  const url = new URL(request.url)
  return url.pathname === '/api/discord/interactions'
}

const tryFetchAsset = async (
  request: Request,
  env: Env,
): Promise<Response | undefined> => {
  const assets = env.ASSETS
  if (!assets) return undefined

  const assetRequest = new Request(request.url, request)
  assetRequest.headers.delete('if-none-match')

  try {
    const assetResponse = await assets.fetch(assetRequest)
    if (
      assetResponse &&
      assetResponse.status >= 200 &&
      assetResponse.status < 400
    ) {
      return new Response(assetResponse.body, assetResponse)
    }
  } catch (error) {
    // 資産取得が失敗した場合はSSRにフォールバックする
    if (env.APP_ENV !== 'production') {
      console.error('Failed to fetch asset, falling back to SSR', error)
    }
  }

  return undefined
}

const handleApp = (
  context: WorkerEventContext,
): ReturnType<typeof handleRequest> => {
  return handleRequest(context)
}

const createEventContext = (
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
): WorkerEventContext => {
  const typedRequest = request as WorkerEventContext['request']
  const waitUntil = executionContext.waitUntil.bind(executionContext)
  const passThroughOnException =
    executionContext.passThroughOnException.bind(executionContext)

  const next: WorkerEventContext['next'] = (input?: Request | string, init?) => {
    if (!env.ASSETS) {
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    }

    if (input instanceof Request) {
      return env.ASSETS.fetch(input, init)
    }

    if (typeof input === 'string') {
      return env.ASSETS.fetch(input, init)
    }

    return env.ASSETS.fetch(request, init)
  }

  const baseContext: WorkerEventContext = {
    request: typedRequest,
    env,
    waitUntil,
    passThroughOnException,
    functionPath: 'worker',
    next,
    params: {} as WorkerEventContext['params'],
    data: {} as WorkerEventContext['data'],
  }

  const globalCaches =
    (globalThis as { caches?: CacheStorage }).caches ??
    ({} as CacheStorage)

  const cloudflareContext = {
    ...baseContext,
    cf: (typedRequest as Request & { cf?: IncomingRequestCfProperties<unknown> })
      .cf,
    ctx: {
      waitUntil,
      passThroughOnException,
    },
    caches: globalCaches,
  }

  return Object.assign(baseContext, { cloudflare: cloudflareContext }) as WorkerEventContext
}

const handleWithFallback = async (
  context: WorkerEventContext,
): Promise<Response> => {
  if (isDiscordInteractionsRoute(context.request)) {
    return handleDiscordInteractions({
      request: context.request,
      env: context.env,
      waitUntil: context.waitUntil,
    })
  }

  const assetResponse = await tryFetchAsset(context.request, context.env)
  if (assetResponse) return assetResponse

  try {
    return await handleApp(context)
  } catch (error) {
    if (context.env.APP_ENV !== 'production' && error instanceof Error) {
      console.error(error)
      return new Response(error.message ?? error.toString(), {
        status: 500,
      })
    }

    return new Response('Internal Error', { status: 500 })
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    const context = createEventContext(request, env, executionContext)
    return handleWithFallback(context)
  },
}

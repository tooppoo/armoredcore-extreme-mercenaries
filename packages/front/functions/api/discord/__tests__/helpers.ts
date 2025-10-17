import type { onRequest } from '../interactions'

export type RequestContext = Parameters<typeof onRequest>[0]

export const baseEnv: Partial<RequestContext['env']> = {
  ASSETS: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  },
  DISCORD_PUBLIC_KEY: 'test-key',
  DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS: '111',
  DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS: '111',
}

/**
 * テスト用のリクエストコンテキストを生成する共通ヘルパー関数
 *
 * @param init - リクエストの初期化オプション
 * @param init.method - HTTPメソッド（デフォルト: 'POST'）
 * @param init.body - リクエストボディ（オブジェクト）
 * @param init.rawBody - 生のリクエストボディ（文字列、bodyより優先）
 * @param init.headers - リクエストヘッダー
 * @param init.env - 環境変数（baseEnvとマージ）
 * @returns テスト用のリクエストコンテキスト
 */
export const makeCtx = (init?: {
  method?: string
  body?: unknown
  rawBody?: string
  headers?: HeadersInit
  env?: Partial<RequestContext['env']>
}): RequestContext => {
  const method = init?.method ?? 'POST'
  const body = (() => {
    if (init?.rawBody !== undefined) return init.rawBody
    if (init?.body !== undefined) return JSON.stringify(init.body)
    return undefined
  })()
  const headers = new Headers(init?.headers)
  const req = new Request('http://localhost/api/discord/interactions', {
    method,
    body,
    headers,
  })
  const env = { ...baseEnv, ...init?.env } as RequestContext['env']
  return {
    request: req as RequestContext['request'],
    env,
    params: {} as RequestContext['params'],
    data: {} as RequestContext['data'],
    waitUntil: () => {},
    next: () => Promise.resolve(new Response('NEXT')),
    functionPath: '',
    passThroughOnException: () => {},
  } satisfies RequestContext
}

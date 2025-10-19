import type { DiscordInteractionsHandlerContext } from '../interactions'

type AssetConnect = Env['ASSETS']['connect']
type AssetSocket = ReturnType<AssetConnect>
type AssetSocketOpened = Awaited<AssetSocket['opened']>

const createMockSocket = (): AssetSocket => ({
  readable: new ReadableStream(),
  writable: new WritableStream(),
  closed: Promise.resolve(),
  opened: Promise.resolve({} as AssetSocketOpened),
  upgraded: false,
  secureTransport: 'off',
  close: async () => {},
  startTls: () => createMockSocket(),
})

const assetsMock: Env['ASSETS'] = {
  fetch: (input, init) =>
    fetch(input as RequestInfo | URL, init as RequestInit),
  connect: ((...args: Parameters<AssetConnect>) => {
    void args
    return createMockSocket()
  }) as AssetConnect,
}

export type RequestContext = DiscordInteractionsHandlerContext

export const baseEnv: Partial<RequestContext['env']> = {
  ASSETS: assetsMock,
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
    request: req,
    env,
    waitUntil: () => {},
    passThroughOnException: () => {},
  }
}

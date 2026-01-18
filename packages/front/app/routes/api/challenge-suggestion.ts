import { forbidden } from '~/lib/http/response/json/error.server'
import { handleZodError, parseJson } from '~/lib/http/request/parser.server'
import {
  challengeSuggestionRequestSchema,
  type ChallengeSuggestionResponse,
  type ChallengeSuggestionError,
} from '~/lib/challenge-suggestion/types'
import { findSimilarChallenges } from '~/lib/challenge-suggestion/embedding/similarity.server'
import { generateChallenge } from '~/lib/challenge-suggestion/generation/generator.server'
import { logger } from '~/lib/observability/logger'
import type { Route } from './+types/challenge-suggestion'

export const action = async (args: Route.ActionArgs) => {
  switch (args.request.method.toUpperCase()) {
    case 'POST':
      return post(args)
    default:
      throw forbidden(null)
  }
}

const post = async ({
  request,
  context,
}: Route.ActionArgs): Promise<Response> => {
  const { env } = context.cloudflare
  const { db } = context

  // 環境変数チェック
  const apiKey = env.OPENAI_API_KEY
  if (!apiKey) {
    logger.error('openai_api_key_not_configured', {})
    return createErrorResponse(
      'SERVICE_UNAVAILABLE',
      'サービスが利用できません',
    )
  }
  const apiModel = env.OPENAI_MODEL || 'gpt-5-nano'

  // リクエストパース
  const json = await parseJson(request)
  const data = await challengeSuggestionRequestSchema
    .parseAsync(json)
    .catch(handleZodError)

  logger.info('challenge_suggestion_requested', {
    consultationLength: data.consultation.length,
  })

  // 類似チャレンジ検索およびチャレンジ生成
  try {
    // NOTE: CHALLENGE_VECTORIZE は未設定の場合 undefined
    const vectorize = (env as { CHALLENGE_VECTORIZE?: VectorizeIndex })
      .CHALLENGE_VECTORIZE
    const { challenges: similarChallenges } = await findSimilarChallenges(
      data.consultation,
      apiKey,
      vectorize,
      db,
    )

    // 新規チャレンジ生成
    const { suggestion } = await generateChallenge(
      data.consultation,
      similarChallenges,
      apiKey,
      apiModel,
    )

    const response: ChallengeSuggestionResponse = {
      similarChallenges,
      suggestion,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    logger.error('challenge_suggestion_generation_failed', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage:
        error instanceof Error ? error.message : '不明なエラーが発生しました',
    })

    // OpenAI API や埋め込み検索の失敗時は利用者に内部情報を開示せず、
    // サービス一時停止として扱う
    return createErrorResponse(
      'SERVICE_UNAVAILABLE',
      'サービスが利用できません',
    )
  }
}

const createErrorResponse = (
  code: ChallengeSuggestionError['code'],
  message: string,
): Response => {
  const error: ChallengeSuggestionError = { code, message }
  return new Response(JSON.stringify({ error }), {
    status: code === 'INVALID_INPUT' ? 400 : 503,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

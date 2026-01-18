import { z } from 'zod'

// リクエストのバリデーションスキーマ
export const challengeSuggestionRequestSchema = z.object({
  consultation: z
    .string()
    .min(1, '相談内容を入力してください')
    .max(1000, '相談内容は1000文字以内で入力してください'),
})

export type ChallengeSuggestionRequest = z.infer<
  typeof challengeSuggestionRequestSchema
>

// 類似チャレンジ
export interface SimilarChallenge {
  externalId: string
  title: string
  description: string
  url: string | null
  similarity: number
}

// 新規チャレンジ提案
export interface ChallengeSuggestion {
  title: string
  description: string
  hashtag: string
}

// APIレスポンス
export interface ChallengeSuggestionResponse {
  similarChallenges: SimilarChallenge[]
  suggestion: ChallengeSuggestion
}

// エラーコード
export type ChallengeSuggestionErrorCode =
  | 'INVALID_INPUT'
  | 'SERVICE_UNAVAILABLE'

// エラーレスポンス
export interface ChallengeSuggestionError {
  code: ChallengeSuggestionErrorCode
  message: string
}

// Vectorize メタデータ
export interface ChallengeEmbeddingMetadata {
  challengeId: number
  externalId: string
  title: string
}


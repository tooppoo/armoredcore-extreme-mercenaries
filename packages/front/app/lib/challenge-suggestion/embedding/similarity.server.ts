import { desc, inArray } from 'drizzle-orm'
import type { Database } from '~/db/driver.server'
import { challengeArchives } from '~/db/schema.server'
import type { SimilarChallenge, ChallengeEmbeddingMetadata } from '../types'
import { createEmbedding } from './client.server'
import { logger } from '~/lib/observability/logger'

const TOP_K = 5

/**
 * Vectorize を使用して類似チャレンジを検索
 * NOTE: Vectorizeが未設定の場合はD1フォールバックを使用
 */
export const searchSimilarChallenges = async (
  queryEmbedding: number[],
  vectorize: VectorizeIndex | undefined,
  db: Database,
): Promise<SimilarChallenge[]> => {
  if (vectorize) {
    return searchWithVectorize(queryEmbedding, vectorize, db)
  }

  logger.warn('vectorize_not_configured', {
    message: 'Vectorize is not configured, using D1 fallback',
  })
  return searchWithD1Fallback(db)
}

/**
 * Vectorizeを使用した類似検索
 */
const searchWithVectorize = async (
  queryEmbedding: number[],
  vectorize: VectorizeIndex,
  db: Database,
): Promise<SimilarChallenge[]> => {
  const results = await vectorize.query(queryEmbedding, {
    topK: TOP_K,
    returnMetadata: 'all',
  })

  if (results.matches.length === 0) {
    return []
  }

  const candidatesOfChallengeList = results.matches
    .map((match) => {
      const metadata = match.metadata as unknown as ChallengeEmbeddingMetadata
      return metadata.challengeId
    })
    .filter((challengeId): challengeId is number =>
      Number.isFinite(challengeId),
    )

  if (candidatesOfChallengeList.length === 0) {
    logger.warn('similar_challenges_metadata_missing', {
      count: results.matches.length,
    })
    return []
  }

  const uniqueChallengeIdList = Array.from(new Set(candidatesOfChallengeList))

  // D1からチャレンジ詳細を取得（Vectorizeの結果に限定）
  const challenges = await db
    .select()
    .from(challengeArchives)
    .where(inArray(challengeArchives.id, uniqueChallengeIdList))

  const challengeMap = new Map(challenges.map((c) => [c.id, c]))

  return results.matches
    .map((match) => {
      const metadata = match.metadata as unknown as ChallengeEmbeddingMetadata
      const challenge = challengeMap.get(metadata.challengeId)

      if (!challenge) {
        return null
      }

      return {
        externalId: challenge.externalId,
        title: challenge.title,
        description: challenge.description,
        url: challenge.url,
        similarity: match.score,
      }
    })
    .filter((c): c is SimilarChallenge => c !== null)
}

/**
 * D1フォールバック: 最新のチャレンジを返す（Vectorize未設定時）
 */
const searchWithD1Fallback = async (
  db: Database,
): Promise<SimilarChallenge[]> => {
  const challenges = await db
    .select()
    .from(challengeArchives)
    .orderBy(desc(challengeArchives.createdAt))
    .limit(TOP_K)

  return challenges.map((c) => ({
    externalId: c.externalId,
    title: c.title,
    description: c.description,
    url: c.url,
    similarity: 0, // フォールバック時は類似度なし
  }))
}

/**
 * 相談内容から類似チャレンジを検索
 */
export const findSimilarChallenges = async (
  consultation: string,
  apiKey: string,
  vectorize: VectorizeIndex | undefined,
  db: Database,
): Promise<{ challenges: SimilarChallenge[]; embeddingTokens: number }> => {
  const { embedding, tokensUsed } = await createEmbedding(consultation, apiKey)
  const challenges = await searchSimilarChallenges(embedding, vectorize, db)

  logger.info('similar_challenges_found', {
    count: challenges.length,
    embeddingTokens: tokensUsed,
  })

  return {
    challenges,
    embeddingTokens: tokensUsed,
  }
}

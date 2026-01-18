import { drizzle } from 'drizzle-orm/d1'
import { challengeArchives } from '~/db/schema.server'
import { createEmbeddings } from './client.server'
import { logger } from '~/lib/observability/logger'

const BATCH_SIZE = 100

interface GenerateEmbeddingsResult {
  processed: number
  totalTokens: number
}

/**
 * チャレンジを検索用テキストに変換
 */
const buildSearchText = (title: string, description: string): string => {
  return `${title}\n${description}`
}

/**
 * D1から全チャレンジを取得し、Embeddingを生成してVectorizeに書き込む
 */
export const generateChallengeEmbeddings = async (
  db: D1Database,
  vectorize: VectorizeIndex,
  apiKey: string,
): Promise<GenerateEmbeddingsResult> => {
  const drizzleDb = drizzle(db)

  // D1から全チャレンジを取得
  logger.info('fetching_challenges_from_d1', {})
  const challenges = await drizzleDb.select().from(challengeArchives)

  if (challenges.length === 0) {
    logger.info('no_challenges_found', {})
    return { processed: 0, totalTokens: 0 }
  }

  logger.info('challenges_fetched', { count: challenges.length })

  let totalProcessed = 0
  let totalTokens = 0

  // バッチ処理
  for (let i = 0; i < challenges.length; i += BATCH_SIZE) {
    const batch = challenges.slice(i, i + BATCH_SIZE)
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(challenges.length / BATCH_SIZE)

    logger.info('processing_batch', {
      batch: batchNumber,
      totalBatches,
      batchSize: batch.length,
    })

    // 各チャレンジのEmbeddingを一括生成
    const textInBatch = batch.map((challenge) =>
      buildSearchText(challenge.title, challenge.description),
    )
    const { embeddings, tokensUsed } = await createEmbeddings(
      textInBatch,
      apiKey,
    )

    if (embeddings.length !== batch.length) {
      logger.error('embeddings_count_mismatch', {
        expected: batch.length,
        actual: embeddings.length,
      })
      throw new Error('Embedding generation result count does not match')
    }

    const vectors = batch.map((challenge, index) => ({
      id: `challenge-${challenge.id}`,
      values: embeddings[index],
      metadata: {
        challengeId: challenge.id,
        externalId: challenge.externalId,
        title: challenge.title,
      },
    }))

    totalTokens += tokensUsed

    // Vectorizeに書き込み
    await vectorize.upsert(vectors)

    totalProcessed += batch.length

    logger.info('batch_completed', {
      batch: batchNumber,
      processed: batch.length,
      tokens: tokensUsed,
    })
  }

  logger.info('embedding_generation_completed', {
    totalProcessed,
    totalTokens,
  })

  return { processed: totalProcessed, totalTokens }
}

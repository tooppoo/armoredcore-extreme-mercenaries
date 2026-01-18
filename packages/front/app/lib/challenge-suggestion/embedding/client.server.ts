import { OpenAI } from 'openai'
import { logger } from '~/lib/observability/logger'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536

export interface EmbeddingResult {
  embedding: number[]
  tokensUsed: number
}

/**
 * テキストをEmbeddingベクトルに変換する
 */
export const createEmbedding = async (
  text: string,
  apiKey: string,
): Promise<EmbeddingResult> => {
  const client = new OpenAI({ apiKey })

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  })

  logger.debug('embedding_created', {
    model: EMBEDDING_MODEL,
    tokensUsed: response.usage.total_tokens,
    textLength: text.length,
  })

  return {
    embedding: response.data[0].embedding,
    tokensUsed: response.usage.total_tokens,
  }
}

/**
 * 複数テキストを一括でEmbeddingベクトルに変換する
 */
export const createEmbeddings = async (
  texts: string[],
  apiKey: string,
): Promise<{ embeddings: number[][]; tokensUsed: number }> => {
  const client = new OpenAI({ apiKey })

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  })

  logger.debug('embeddings_created', {
    model: EMBEDDING_MODEL,
    tokensUsed: response.usage.total_tokens,
    count: texts.length,
  })

  return {
    embeddings: response.data.map((d) => d.embedding),
    tokensUsed: response.usage.total_tokens,
  }
}

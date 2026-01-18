import OpenAI from 'openai'
import type { SimilarChallenge, ChallengeSuggestion } from '../types'
import { logger } from '~/lib/observability/logger'

const SYSTEM_PROMPT = `あなたはアーマードコア6のチャレンジ（縛りプレイ）を提案するAIです。
ユーザーの相談内容と、過去のチャレンジを参考に、新しいチャレンジを提案してください。

チャレンジは以下の形式で提案してください：
- タイトル: キャッチーで覚えやすい名前（例：「ヘリアンサスチャレンジ」）
- 詳細条件: 対象ミッション、使用機体・パーツの制約、クリア条件など
- ハッシュタグ: SNS共有用のハッシュタグ（例：#ヘリアンサスチャレンジ）

チャレンジの難易度はユーザーの相談内容に合わせて調整してください。
初心者向けの相談であれば簡単めに、上級者向けであれば難しめに設定してください。

出力は以下のJSON形式で返してください：
{
  "title": "チャレンジ名",
  "description": "詳細な条件説明",
  "hashtag": "#チャレンジ名"
}`

interface GenerationResult {
  suggestion: ChallengeSuggestion
  completionTokens: number
}

/**
 * 類似チャレンジと相談内容から新規チャレンジを生成
 */
export const generateChallenge = async (
  consultation: string,
  similarChallenges: SimilarChallenge[],
  apiKey: string,
  aiModel: string,
): Promise<GenerationResult> => {
  const client = new OpenAI({ apiKey })

  const userPrompt = buildUserPrompt(consultation, similarChallenges)

  const response = await client.chat.completions.create({
    model: aiModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('OpenAI returned empty content')
  }

  const suggestion = parseChallengeSuggestion(content)
  const completionTokens = response.usage?.total_tokens ?? 0

  logger.debug('challenge_generated', {
    model: aiModel,
    completionTokens,
    suggestionTitle: suggestion.title,
  })

  return {
    suggestion,
    completionTokens,
  }
}

/**
 * ユーザープロンプトを構築
 */
const buildUserPrompt = (
  consultation: string,
  similarChallenges: SimilarChallenge[],
): string => {
  const challengeExamples =
    similarChallenges.length > 0
      ? similarChallenges
          .map(
            (c, i) =>
              `【例${i + 1}】${c.title}\n${c.description}`,
          )
          .join('\n\n')
      : 'なし'

  return `## ユーザーの相談内容
${consultation}

## 参考になる過去のチャレンジ
${challengeExamples}

上記の相談内容と過去のチャレンジを参考に、新しいチャレンジを1つ提案してください。`
}

/**
 * OpenAIの出力をパースしてChallengeSuggestionに変換
 */
const parseChallengeSuggestion = (content: string): ChallengeSuggestion => {
  const parsed = JSON.parse(content) as {
    title?: string
    description?: string
    hashtag?: string
  }

  if (!parsed.title || !parsed.description || !parsed.hashtag) {
    throw new Error('Invalid challenge suggestion format')
  }

  return {
    title: parsed.title,
    description: parsed.description,
    hashtag: parsed.hashtag,
  }
}

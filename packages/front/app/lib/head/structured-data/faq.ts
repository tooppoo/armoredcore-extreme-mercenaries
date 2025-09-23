import type { FaqEntry, JsonLdSchema } from './types'

/**
 * FAQ用のJSON-LDスキーマを生成する
 *
 * FaqEntry配列をSchema.orgのQuestion/Answer形式のJSON-LDスキーマに変換
 * 生成されたスキーマはcombine.tsのbuildStructuredData関数で統合される
 *
 * @param entries FAQ項目の配列
 * @returns Schema.orgのQuestion形式のJSON-LDスキーマ配列
 */
export function buildFaqSchema(entries: FaqEntry[]): JsonLdSchema[] {
  return entries.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  }))
}

/**
 * 外部データ形式からFAQ構造化データ形式に変換する
 *
 * 主にroutes/index.tsxのfaqItemsのような外部データ形式を
 * 内部のFaqEntry形式に変換するためのヘルパー関数
 * answerTextプロパティをanswerプロパティにマッピング
 *
 * @param faqItems 外部形式のFAQ項目配列（answerTextプロパティを持つ）
 * @returns 内部形式のFaqEntry配列
 */
export function createFaqStructuredData(
  faqItems: { question: string; answerText: string }[],
): FaqEntry[] {
  return faqItems.map((item) => ({
    question: item.question,
    answer: item.answerText,
  }))
}

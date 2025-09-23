import type { FaqEntry } from '../structured-data/types'

/**
 * テスト用のFAQデータ（複数項目）
 *
 * 複数のFAQ項目を含むシナリオのテストで使用
 * 配列操作や統合処理のテストに適している
 */
export const mockFaqData: FaqEntry[] = [
  {
    question: '質問1',
    answer: '回答1',
  },
  {
    question: '質問2',
    answer: '回答2',
  },
]

/**
 * テスト用のFAQデータ（単一項目）
 *
 * 単一のFAQ項目でのテストで使用
 * 基本的な機能検証や詳細な内容確認に適している
 */
export const mockSingleFaqData: FaqEntry[] = [
  {
    question: 'テスト質問',
    answer: 'テスト回答',
  },
]

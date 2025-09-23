import { describe, it, expect } from 'vitest'
import { buildFaqSchema, createFaqStructuredData } from './faq'
import {
  mockFaqData,
  mockSingleFaqData,
} from '../test-fixtures/structured-data'

describe('FAQ structured data', () => {
  describe('buildFaqSchema', () => {
    it('should generate valid FAQ schema', () => {
      const result = buildFaqSchema(mockSingleFaqData)

      expect(result).toStrictEqual([
        {
          '@type': 'Question',
          name: 'テスト質問',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'テスト回答',
          },
        },
      ])
    })

    it('should handle multiple FAQ entries', () => {
      const result = buildFaqSchema(mockFaqData)

      expect(result).toHaveLength(2)
      expect(result[0]['@type']).toBe('Question')
      expect(result[1]['@type']).toBe('Question')
    })

    it('should return empty array for empty input', () => {
      const result = buildFaqSchema([])
      expect(result).toStrictEqual([])
    })
  })

  describe('createFaqStructuredData', () => {
    it('should convert FAQ items to structured data format', () => {
      const faqItems = [
        { question: 'Q1', answerText: 'A1' },
        { question: 'Q2', answerText: 'A2' },
      ]

      const result = createFaqStructuredData(faqItems)

      expect(result).toStrictEqual([
        { question: 'Q1', answer: 'A1' },
        { question: 'Q2', answer: 'A2' },
      ])
    })
  })
})

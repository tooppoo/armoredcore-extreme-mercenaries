import { describe, it, expect } from 'vitest'
import { buildStructuredData } from './combine'
import { mockFaqData } from '../test-fixtures/structured-data'
import { expectValidJsonLd, expectFaqSchema, hasStructuredData } from '../test-helpers/structured-data'

describe('combineStructuredData', () => {
  const baseArgs = {
    title: 'Test Title',
    description: 'Test Description',
    url: 'https://example.com/test',
  }

  it('should generate basic JSON-LD when no structured data provided', () => {
    const result = buildStructuredData(undefined, baseArgs)

    expectValidJsonLd(result)
    expect(hasStructuredData(result)).toBe(true)
  })

  it('should generate basic JSON-LD when empty structured data provided', () => {
    const result = buildStructuredData({}, baseArgs)

    expectValidJsonLd(result)
    expect(hasStructuredData(result)).toBe(true)
  })

  it('should integrate FAQ structured data', () => {
    const result = buildStructuredData({ faq: mockFaqData }, baseArgs)

    expectValidJsonLd(result)
    expectFaqSchema(result, 2)
  })

  it('should handle FAQ with empty array', () => {
    const result = buildStructuredData({ faq: [] }, baseArgs)

    expectValidJsonLd(result)
    expect(hasStructuredData(result)).toBe(true)
  })
})
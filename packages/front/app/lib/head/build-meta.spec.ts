import { describe, it, expect } from 'vitest'
import { buildMeta } from './build-meta'
import { siteName } from '~/lib/constants'
import { expectValidJsonLd, expectFaqSchema, hasStructuredData } from './test-helpers/structured-data'
import { mockSingleFaqData } from './test-fixtures/structured-data'

describe('buildMeta', () => {
  it('should include basic SEO tags and structured data', () => {
    const args = {
      title: 'Test Title',
      description: 'Test Description',
      pathname: '/test-path',
    }
    const meta = buildMeta(args)

    // Check basic meta tags
    expect(meta).toContainEqual({ title: `Test Title | ${siteName}` })
    expect(meta).toContainEqual({ property: 'og:title', content: `Test Title | ${siteName}` })
    expect(meta).toContainEqual({ name: 'description', content: 'Test Description' })
    expect(meta).toContainEqual({ property: 'og:description', content: 'Test Description' })
    expect(meta).toContainEqual({ property: 'og:site_name', content: siteName })
    expect(meta).toContainEqual({ property: 'og:type', content: 'website' })
    expect(meta).toContainEqual({ name: 'twitter:card', content: 'summary' })
    expect(meta).toContainEqual({ name: 'twitter:creator', content: '@Philomagi' })

    // Check structured data is included
    expectValidJsonLd(meta)
  })

  it('should integrate structured data when provided', () => {
    const meta = buildMeta({
      title: 'FAQ Title',
      description: 'FAQ Description',
      pathname: '/',
      structuredData: {
        faq: mockSingleFaqData
      }
    })

    expectValidJsonLd(meta)
    expectFaqSchema(meta, 1)
    expect(hasStructuredData(meta)).toBe(true)
  })
})

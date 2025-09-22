import { describe, it, expect } from 'vitest'
import { buildMeta } from './build-meta'
import { cacheKey, siteName } from '~/lib/constants'

describe('buildMeta', () => {
  it('should include SEO related tags', () => {
    const args = {
      title: 'Test Title',
      description: 'Test Description',
      pathname: '/test-path',
    }
    const meta = buildMeta(args)

    expect(meta).toStrictEqual([
      { title: `Test Title | ${siteName}` },
      { property: 'og:title', content: `Test Title | ${siteName}` },
      { name: 'description', content: 'Test Description' },
      { property: 'og:description', content: 'Test Description' },
      {
        'script:ld+json': {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id':
                'https://armoredcore-extreme-mercenaries.philomagi.dev/#org',
              name: siteName,
              url: 'https://armoredcore-extreme-mercenaries.philomagi.dev/',
              logo: {
                '@type': 'ImageObject',
                url: `https://philomagi.dev/ogp-full.jpg?c=${cacheKey}`,
              },
              sameAs: [
                'https://x.com/Philomagi',
                'https://github.com/tooppoo/armoredcore-extreme-mercenaries',
              ],
            },
            {
              '@type': 'WebPage',
              '@id':
                'https://armoredcore-extreme-mercenaries.philomagi.dev/#webpage',
              url: 'https://armoredcore-extreme-mercenaries.philomagi.dev/test-path',
              name: siteName,
              headline: 'Test Title',
              inLanguage: 'ja',
              description: 'Test Description',
              isPartOf: {
                '@id':
                  'https://armoredcore-extreme-mercenaries.philomagi.dev/#website',
              },
            },
            {
              '@type': 'WebSite',
              '@id':
                'https://armoredcore-extreme-mercenaries.philomagi.dev/#website',
              url: 'https://armoredcore-extreme-mercenaries.philomagi.dev/',
              name: siteName,
              publisher: {
                '@id':
                  'https://armoredcore-extreme-mercenaries.philomagi.dev/#org',
              },
            },
          ],
        },
      },
      {
        property: 'og:url',
        content:
          'https://armoredcore-extreme-mercenaries.philomagi.dev/test-path',
      },
      {
        tagName: 'link',
        rel: 'canonical',
        href: 'https://armoredcore-extreme-mercenaries.philomagi.dev/test-path',
      },
      { property: 'og:site_name', content: siteName },
      { property: 'og:type', content: 'website' },
      {
        property: 'og:image',
        content: `https://philomagi.dev/ogp-full.jpg?c=${cacheKey}`,
      },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:creator', content: '@Philomagi' },
    ])
  })

  it('should embed FAQ schema when faq entries are provided', () => {
    const meta = buildMeta({
      title: 'FAQ Title',
      description: 'FAQ Description',
      pathname: '/',
      faq: [
        {
          question: '質問1',
          answer: '回答1',
        },
      ],
    })

    const schema = meta.find(
      (item): item is {
        'script:ld+json': {
          '@context': string
          '@graph': unknown[]
        }
      } => 'script:ld+json' in item,
    )

    expect(schema).toBeDefined()
    const webPageNode = schema?.['script:ld+json']['@graph'].find(
      (node): node is {
        '@id': string
        '@type': string[]
        mainEntity: unknown[]
      } =>
        typeof node === 'object' &&
        node !== null &&
        '@id' in node &&
        (node as { '@id': string })['@id'] ===
          'https://armoredcore-extreme-mercenaries.philomagi.dev/#webpage',
    )

    expect(webPageNode).toBeDefined()
    expect(webPageNode?.['@type']).toStrictEqual(['WebPage', 'FAQPage'])
    expect(webPageNode?.mainEntity).toStrictEqual([
      {
        '@type': 'Question',
        name: '質問1',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '回答1',
        },
      },
    ])
  })
})

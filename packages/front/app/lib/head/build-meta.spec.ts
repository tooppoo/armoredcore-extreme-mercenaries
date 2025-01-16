import { describe, it, expect } from 'vitest'
import { buildMeta } from './build-meta'
import { siteName } from '~/lib/constants'

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
      { name: 'og:title', content: `Test Title | ${siteName}` },
      { name: 'description', content: 'Test Description' },
      { name: 'og:description', content: 'Test Description' },
      {
        'script:ld+json': {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          'name': siteName,
          'headline': 'Test Title',
          'description': 'Test Description',
          'url': 'https://armoredcore-extreme-mercenaries.philomagi.dev/test-path'
        },
      },
      { name: 'og:url', content: 'https://armoredcore-extreme-mercenaries.philomagi.dev/test-path' },
      { tagName: 'link', rel: 'canonical', href: 'https://armoredcore-extreme-mercenaries.philomagi.dev/test-path' },
      { name: 'og:site_name', content: siteName },
      { name: 'og:type', content: 'website' },
    ])
  })
})

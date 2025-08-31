import { MetaDescriptor } from 'react-router'
import { cacheKey, origin, siteName } from '~/lib/constants'

type Meta = MetaDescriptor[]

export type BuildMetaArgs = Readonly<{
  title: string
  description: string
  pathname: string
}>
export function buildMeta(args: BuildMetaArgs): Meta {
  const url = origin + args.pathname

  return [
    ...title(args.title),
    ...description(args.description),
    ...jsonLd({
      ...args,
      url,
    }),
    ...buildUrl(url),
    { property: 'og:site_name', content: siteName },
    { property: 'og:type', content: 'website' },
    {
      property: 'og:image',
      content: `https://philomagi.dev/ogp-full.jpg?c=${cacheKey}`,
    },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:creator', content: '@Philomagi' },
  ]
}

export const unofficialServer = `ARMORED CORE のやりこみ攻略に特化した非公式コミュニティ「${siteName}」`

function title(s: string): Meta {
  return [{ title: _title(s) }, { property: 'og:title', content: _title(s) }]
}
function _title(s: string): string {
  return `${s} | ${siteName}`
}

function description(text: string): Meta {
  return [
    { name: 'description', content: text },
    { property: 'og:description', content: text },
  ]
}

type JsonLdArgs = Readonly<{
  title: string
  description: string
  url: string
}>
function jsonLd({ title, description, url }: JsonLdArgs): Meta {
  const orgId = `${origin}/#org`
  const websiteId = `${origin}/#website`
  const webpageId = `${origin}/#webpage`

  return [
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': orgId,
            name: siteName,
            url: origin + '/',
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
            '@id': webpageId,
            url,
            name: siteName,
            headline: title,
            inLanguage: 'ja',
            description,
            isPartOf: { '@id': websiteId },
          },
          {
            '@type': 'WebSite',
            '@id': websiteId,
            url: origin + '/',
            name: siteName,
            publisher: { '@id': orgId },
          },
        ],
      },
    },
  ]
}

function buildUrl(url: string): Meta {
  return [
    { property: 'og:url', content: url },
    { tagName: 'link', rel: 'canonical', href: url },
  ]
}

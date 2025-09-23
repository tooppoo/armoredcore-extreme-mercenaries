import { MetaDescriptor } from 'react-router'
import { cacheKey, origin, siteName } from '~/lib/constants'
import type { StructuredDataOptions, JsonLdSchema } from './types'
import { buildFaqSchema } from './faq'

type Meta = MetaDescriptor[]

/**
 * 構造化データを統合してJSON-LDメタタグを生成する
 *
 * 各構造化データタイプ（FAQ、Breadcrumb等）のスキーマを統合し、
 * Organization、WebSite、WebPageと組み合わせて完全なJSON-LDを構築する
 *
 * このモジュールが構造化データアーキテクチャの中核であり、
 * 新しい構造化データタイプの追加時はここに処理を追加する
 *
 * @param options 構造化データオプション（undefined可）
 * @param args ページの基本情報（タイトル、説明、URL）
 * @returns React Router用のMetaDescriptor配列
 */
export function buildStructuredData(
  options: StructuredDataOptions | undefined,
  args: { title: string; description: string; url: string },
): Meta {
  if (!options || Object.keys(options).length === 0) {
    return buildBasicJsonLd(args)
  }

  const schemas: JsonLdSchema[] = []

  if (options.faq && options.faq.length > 0) {
    schemas.push(...buildFaqSchema(options.faq))
  }

  // 将来的に他の構造化データタイプもここに追加
  // if (options.breadcrumb) schemas.push(...buildBreadcrumbSchema(options.breadcrumb))
  // if (options.product) schemas.push(...buildProductSchema(options.product))

  return buildJsonLdWithStructuredData(args, schemas)
}

/**
 * 構造化データがない場合の基本的なJSON-LDを生成する
 * Organization、WebSite、WebPageのみを含むシンプルな構造
 */
function buildBasicJsonLd({
  title,
  description,
  url,
}: {
  title: string
  description: string
  url: string
}): Meta {
  const orgId = `${origin}/#org`
  const websiteId = `${origin}/#website`
  const webpageId = `${origin}/#webpage`

  return [
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@graph': [
          buildOrganizationSchema(orgId),
          buildWebPageSchema({ webpageId, websiteId, title, description, url }),
          buildWebSiteSchema({ websiteId, orgId }),
        ],
      },
    },
  ]
}

/**
 * 構造化データ付きJSON-LDを生成する
 *
 * 各構造化データスキーマをWebPageノードに統合し、
 * 適切な@typeやmainEntityプロパティを設定する
 *
 * @param args ページの基本情報
 * @param structuredDataSchemas 各構造化データタイプから生成されたスキーマ配列
 */
function buildJsonLdWithStructuredData(
  {
    title,
    description,
    url,
  }: { title: string; description: string; url: string },
  structuredDataSchemas: JsonLdSchema[],
): Meta {
  const orgId = `${origin}/#org`
  const websiteId = `${origin}/#website`
  const webpageId = `${origin}/#webpage`

  const webPageNode: Record<string, unknown> = buildWebPageSchema({
    webpageId,
    websiteId,
    title,
    description,
    url,
  })

  if (structuredDataSchemas.length > 0) {
    const hasFaq = structuredDataSchemas.some(
      (schema) => schema['@type'] === 'Question',
    )

    if (hasFaq) {
      webPageNode['@type'] = ['WebPage', 'FAQPage']
      webPageNode.mainEntity = structuredDataSchemas.filter(
        (schema) => schema['@type'] === 'Question',
      )
    }
  }

  return [
    {
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@graph': [
          buildOrganizationSchema(orgId),
          webPageNode,
          buildWebSiteSchema({ websiteId, orgId }),
        ],
      },
    },
  ]
}

/**
 * Organizationスキーマを生成する
 * サイト運営組織の情報を記述
 */
function buildOrganizationSchema(orgId: string): JsonLdSchema {
  return {
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
  }
}

/**
 * WebPageスキーマを生成する
 * 個別ページの情報を記述。構造化データがある場合は後から拡張される
 */
function buildWebPageSchema({
  webpageId,
  websiteId,
  title,
  description,
  url,
}: {
  webpageId: string
  websiteId: string
  title: string
  description: string
  url: string
}): JsonLdSchema {
  return {
    '@type': 'WebPage',
    '@id': webpageId,
    url,
    name: siteName,
    headline: title,
    inLanguage: 'ja',
    description,
    isPartOf: { '@id': websiteId },
  }
}

/**
 * WebSiteスキーマを生成する
 * サイト全体の情報を記述
 */
function buildWebSiteSchema({
  websiteId,
  orgId,
}: {
  websiteId: string
  orgId: string
}): JsonLdSchema {
  return {
    '@type': 'WebSite',
    '@id': websiteId,
    url: origin + '/',
    name: siteName,
    publisher: { '@id': orgId },
  }
}

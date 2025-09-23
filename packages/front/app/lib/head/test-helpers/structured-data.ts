import { MetaDescriptor } from 'react-router'
import { expect } from 'vitest'

type Meta = MetaDescriptor[]

/**
 * メタデータからJSON-LDスキーマを抽出する
 *
 * React RouterのMetaDescriptor配列からscript:ld+json要素を検索し、
 * JSON-LDスキーマオブジェクトを返す
 *
 * @param meta React RouterのMetaDescriptor配列
 * @returns JSON-LDスキーマオブジェクト（見つからない場合はundefined）
 */
export function findJsonLdSchema(meta: Meta) {
  const schema = meta.find(
    (item): item is {
      'script:ld+json': {
        '@context': string
        '@graph': unknown[]
      }
    } => 'script:ld+json' in item,
  )
  return schema?.['script:ld+json']
}

/**
 * JSON-LDスキーマからWebPageノードを検索する
 *
 * @graphプロパティからWebPageタイプのノードを探し、
 * IDに'#webpage'を含むノードを返す
 *
 * @param meta React RouterのMetaDescriptor配列
 * @returns WebPageノード（見つからない場合はnull）
 */
export function findWebPageNode(meta: Meta) {
  const schema = findJsonLdSchema(meta)
  if (!schema) return null

  return schema['@graph'].find(
    (node): node is Record<string, unknown> =>
      typeof node === 'object' &&
      node !== null &&
      '@id' in node &&
      typeof node['@id'] === 'string' &&
      node['@id'].includes('#webpage')
  )
}

/**
 * 有効なJSON-LDスキーマの存在をテストする
 *
 * メタデータに正しい形式のJSON-LDスキーマが含まれているかを検証
 * Schema.orgのコンテキストが正しく設定されているかもチェック
 *
 * @param meta テスト対象のMetaDescriptor配列
 */
export function expectValidJsonLd(meta: Meta) {
  const schema = findJsonLdSchema(meta)
  expect(schema).toBeDefined()
  expect(schema?.['@context']).toBe('https://schema.org')
}

/**
 * FAQスキーマの正しい生成をテストする
 *
 * WebPageノードがFAQPageタイプに設定され、
 * 期待される数のFAQ項目が含まれているかを検証
 *
 * @param meta テスト対象のMetaDescriptor配列
 * @param expectedCount 期待されるFAQ項目数
 */
export function expectFaqSchema(meta: Meta, expectedCount: number) {
  const webPage = findWebPageNode(meta)
  expect(webPage).toBeDefined()
  expect(webPage?.['@type']).toEqual(['WebPage', 'FAQPage'])
  expect(Array.isArray(webPage?.mainEntity)).toBe(true)
  expect(webPage?.mainEntity).toHaveLength(expectedCount)
}

/**
 * 構造化データの有無をチェックする
 *
 * メタデータに何らかの構造化データが含まれているかを判定
 * テストでの条件分岐や状態確認に使用
 *
 * @param meta チェック対象のMetaDescriptor配列
 * @returns 構造化データが存在する場合true
 */
export function hasStructuredData(meta: Meta): boolean {
  const schema = findJsonLdSchema(meta)
  return schema !== undefined
}
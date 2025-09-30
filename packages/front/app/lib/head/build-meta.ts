import { MetaDescriptor } from 'react-router'
import { cacheKey, origin, siteName } from '~/lib/constants'
import {
  buildStructuredData,
  type StructuredDataOptions,
} from './structured-data'

type Meta = MetaDescriptor[]

/**
 * 基本的なメタデータ生成用の引数型
 * 後方互換性のためオーバーロードで使用
 */
export type BuildMetaArgs = Readonly<{
  title: string
  description: string
  pathname: string
}>

/**
 * 構造化データ付きメタデータ生成用の引数型
 * オーバーロードにより既存コードを破壊せずに段階的移行を可能にする
 */
export type BuildMetaWithStructuredDataArgs = BuildMetaArgs & {
  structuredData?: StructuredDataOptions
}
/**
 * Reactアプリケーション用のメタデータを生成する
 *
 * 基本的なSEOメタタグ（title、description、OGP、Twitter Card等）と
 * オプションの構造化データ（JSON-LD）を統合してReact Router用のMetaDescriptorを生成する
 *
 * 構造化データの具体的な生成は ./structured-data モジュールに委譲し、
 * このモジュールは基本メタタグと統合処理のみを担当する
 *
 * @param args 基本メタデータ引数（タイトル、説明、パス名）
 * @returns React Router用のMetaDescriptor配列
 */
export function buildMeta(args: BuildMetaArgs): Meta
/**
 * 構造化データ付きメタデータを生成する（オーバーロード）
 *
 * @param args 構造化データオプション付きの引数
 * @returns React Router用のMetaDescriptor配列
 */
export function buildMeta(args: BuildMetaWithStructuredDataArgs): Meta
export function buildMeta(args: BuildMetaWithStructuredDataArgs): Meta {
  const url = origin + args.pathname

  return [
    ...title(args.title),
    ...description(args.description),
    ...buildStructuredData(args.structuredData, {
      title: args.title,
      description: args.description,
      url,
    }),
    ...buildUrl(url),
    { property: 'og:site_name', content: siteName },
    { property: 'og:type', content: 'website' },
    {
      property: 'og:image',
      content: `/ogp-full.jpg?c=${cacheKey}`,
    },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:creator', content: '@Philomagi' },
  ]
}

export const unofficialServer = `ARMORED CORE のやりこみ攻略に特化した非公式コミュニティ「${siteName}」`

/**
 * タイトル用のメタタグを生成する
 * サイト名を付加したタイトルをページタイトルとOGPタイトルに設定
 */
function title(s: string): Meta {
  return [{ title: _title(s) }, { property: 'og:title', content: _title(s) }]
}

/**
 * サイト名付きのタイトルを生成する内部関数
 */
function _title(s: string): string {
  return `${s} | ${siteName}`
}

/**
 * 説明文用のメタタグを生成する
 * meta descriptionとOGP descriptionに同じ内容を設定
 */
function description(text: string): Meta {
  return [
    { name: 'description', content: text },
    { property: 'og:description', content: text },
  ]
}

/**
 * URL関連のメタタグを生成する
 * OGP URLとcanonical linkを設定
 */
function buildUrl(url: string): Meta {
  return [
    { property: 'og:url', content: url },
    { tagName: 'link', rel: 'canonical', href: url },
  ]
}

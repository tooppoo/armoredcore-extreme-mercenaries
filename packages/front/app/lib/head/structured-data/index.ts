/**
 * 構造化データモジュールの公開API
 *
 * このモジュールは構造化データ生成機能の統一されたインターフェースを提供する
 * 外部モジュール（build-meta.ts等）はこのファイルからのみインポートを行う
 *
 * 新しい構造化データタイプを追加する際は、必要な型と関数をここから公開すること
 */

export type { FaqEntry, BreadcrumbEntry, StructuredDataOptions } from './types'
export { createFaqStructuredData } from './faq'
export { buildStructuredData } from './combine'

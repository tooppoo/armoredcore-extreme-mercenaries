/**
 * FAQ項目の型定義
 * routes/index.tsxのfaqItemsとは異なり、answerTextではなくanswerプロパティを使用
 */
export type FaqEntry = Readonly<{
  question: string
  answer: string
}>

/**
 * パンくずリスト項目の型定義（将来用）
 * Schema.orgのBreadcrumbList構造化データに対応
 */
export type BreadcrumbEntry = Readonly<{
  name: string
  url: string
}>

/**
 * 構造化データオプションの統合型
 * 新しい構造化データタイプはここに追加し、combine.tsでの処理実装も必要
 */
export type StructuredDataOptions = Readonly<{
  faq?: FaqEntry[]
  breadcrumb?: BreadcrumbEntry[]
}>

/**
 * JSON-LDスキーマの基底型
 * Schema.orgの仕様に準拠した構造化データオブジェクトを表現
 */
export type JsonLdSchema = Record<string, unknown>

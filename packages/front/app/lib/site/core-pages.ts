export type LastmodResolver = (ctx: { db: Database }) => Promise<Date | null>

import type { Database } from '~/db/driver.server'
import { getChallengeArchiveListUpdatedAt } from '~/lib/archives/challenge/revision/repository'
import { getVideoArchiveListUpdatedAt } from '~/lib/archives/video/revision/repository'

export type CorePage = Readonly<{
  path: string
  lastmod?: 'challenge' | 'video' | 'both'
  label?: string
  showInFooter?: boolean
  showInHeader?: boolean
}>

export type NavLink = Readonly<{
  href: string
  text: string
  ariaCurrent?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean
}>

/**
 * コア（静的/一覧）ページの定義を一元管理
 * - sitemap.core.xml の生成
 * - ヘッダー/フッターのナビゲーション生成
 * - サイト内リンクはcorePages経由で管理する方針
 */
export const corePages: readonly CorePage[] = [
  { path: '/', lastmod: 'both', label: 'TOP', showInFooter: true, showInHeader: false },
  { path: '/rule', label: '利用規約', showInFooter: true, showInHeader: false },
  { path: '/penalties', label: '罰則規定', showInFooter: true, showInHeader: false },
  { path: '/updates', label: '更新履歴', showInFooter: true, showInHeader: false },
  { path: '/archives', lastmod: 'both', label: 'アーカイブ', showInFooter: true, showInHeader: false },
  { path: '/archives/challenge', lastmod: 'challenge', label: 'チャレンジアーカイブ', showInFooter: false, showInHeader: false },
  { path: '/archives/video', lastmod: 'video', label: '動画アーカイブ', showInFooter: false, showInHeader: false },
]

export async function resolveLastmod(
  key: CorePage['lastmod'] | undefined,
  ctx: { db: Database },
): Promise<Date | null> {
  if (!key) return null
  if (key === 'challenge') return getChallengeArchiveListUpdatedAt(ctx.db)
  if (key === 'video') return getVideoArchiveListUpdatedAt(ctx.db)
  // both: 最大の更新時刻を採用
  const [c, v] = await Promise.all([
    getChallengeArchiveListUpdatedAt(ctx.db),
    getVideoArchiveListUpdatedAt(ctx.db),
  ])
  if (!c && !v) return null
  if (c && !v) return c
  if (!c && v) return v
  return (c!.getTime() > v!.getTime() ? c : v)!
}

/**
 * フッター用ナビゲーションリンク生成
 * @param currentPath 現在のパス（aria-current設定用）
 */
export function generateFooterLinks(currentPath?: string): NavLink[] {
  return corePages
    .filter((page) => page.showInFooter)
    .map((page) => ({
      href: page.path,
      text: page.label || page.path,
      ariaCurrent: currentPath === page.path ? 'page' : undefined,
    }))
}

/**
 * ヘッダー用ナビゲーションリンク生成
 * @param currentPath 現在のパス（aria-current設定用）
 */
export function generateHeaderLinks(currentPath?: string): NavLink[] {
  return corePages
    .filter((page) => page.showInHeader)
    .map((page) => ({
      href: page.path,
      text: page.label || page.path,
      ariaCurrent: currentPath === page.path ? 'page' : undefined,
    }))
}

/**
 * 特定パスのページ情報取得
 */
export function findCorePage(path: string): CorePage | undefined {
  return corePages.find((page) => page.path === path)
}

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
  {
    path: '/',
    lastmod: 'both',
    label: 'TOP',
    showInFooter: true,
    showInHeader: false,
  },
  { path: '/rule', label: '利用規約', showInFooter: true, showInHeader: false },
  {
    path: '/penalties',
    label: '罰則規定',
    showInFooter: true,
    showInHeader: false,
  },
  {
    path: '/updates',
    label: '更新履歴',
    showInFooter: true,
    showInHeader: false,
  },
  {
    path: '/archives',
    lastmod: 'both',
    label: 'アーカイブ',
    showInFooter: true,
    showInHeader: false,
  },
  {
    path: '/archives/challenge',
    lastmod: 'challenge',
    label: 'チャレンジアーカイブ',
    showInFooter: false,
    showInHeader: false,
  },
  {
    path: '/archives/video',
    lastmod: 'video',
    label: '動画アーカイブ',
    showInFooter: false,
    showInHeader: false,
  },
]

/**
 * ナビゲーションリンク生成共通関数
 * @param filter フィルター関数
 * @param currentPath 現在のパス（aria-current設定用）
 */
function generateNavigationLinks(
  filter: (page: CorePage) => boolean,
  currentPath?: string,
): NavLink[] {
  return corePages.filter(filter).map((page) => ({
    href: page.path,
    text: page.label || page.path,
    ariaCurrent: currentPath === page.path ? 'page' : undefined,
  }))
}

/**
 * フッター用ナビゲーションリンク生成
 * @param currentPath 現在のパス（aria-current設定用）
 */
export function generateFooterLinks(currentPath?: string): NavLink[] {
  return generateNavigationLinks((page) => page.showInFooter, currentPath)
}

/**
 * ヘッダー用ナビゲーションリンク生成
 * @param currentPath 現在のパス（aria-current設定用）
 */
export function generateHeaderLinks(currentPath?: string): NavLink[] {
  return generateNavigationLinks((page) => page.showInHeader, currentPath)
}

/**
 * 特定パスのページ情報取得
 */
export function findCorePage(path: string): CorePage | undefined {
  return corePages.find((page) => page.path === path)
}

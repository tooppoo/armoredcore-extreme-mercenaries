import { TZDate } from '@date-fns/tz'
import { siteName, timezone } from '~/lib/constants'

export type Update = Readonly<{
  externalId: string
  title: string
  createdAt: Date
  content: string
}> 

export const records: readonly Update[][] = [
  [
    {
      externalId: 'ccbb6c5c-90e5-9506-a6fb-701f142db1c1',
      title: '初版公開',
      createdAt: new TZDate(2024, 9, 3, timezone),
      content: `${siteName}のドキュメント初版を公開しました`,
    },
    // {
    //   externalId: 'ab9a8c84-dfc9-3783-240e-d32eb4fa7809',
    //   title: 'アーカイブ一覧 公開',
    //   createdAt: new TZDate(2025, 1, 15, timezone),
    //   content: `
    //   <p>
    //     ・<a href="/archives">アーカイブ一覧ページ</a>を公開しました
    //   </p>
    //   <div style="margin-top: 5px; margin-bottom: 5px;" />
    //   <p>
    //     ・TOPページに<a href="/#archives">アーカイブ一覧ページへのリンク</a>を追加しました
    //   </p>
    //   `,
    // },
  ],
]

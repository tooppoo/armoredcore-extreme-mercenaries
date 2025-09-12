import { TZDate } from '@date-fns/tz'
import { siteName, timezone } from '~/lib/constants'
import { diff } from '~/lib/utils/highlight'

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
    {
      externalId: 'ab9a8c84-dfc9-3783-240e-d32eb4fa7809',
      title: 'アーカイブ一覧 公開',
      createdAt: new TZDate(2025, 1, 17, 19, timezone),
      content: `
      <p>
        ・<a href="/archives">アーカイブ一覧ページ</a>を公開しました
      </p>
      <div style="margin-top: 5px; margin-bottom: 5px;" />
      <p>
        ・TOPページに<a href="/#archives">アーカイブ一覧ページへのリンク</a>を追加しました
      </p>
      `,
    },
    {
      externalId: 'b4c4b1e4-3e1b-1c3b-0f3d-3d1e2b4c1b4e',
      title: '利用規約 更新',
      createdAt: new TZDate(2025, 1, 17, 20, timezone),
      content:
        `
<p>
  利用規約<a href="/rule#denied-contents">11. 禁止コンテンツについて</a>を更新しました
</p>
<div style="margin-top: 10px; margin-bottom: 10px;" />
<code>` +
        diff(
          `
  ・これらに類する話題が続く場合は管理者・運営から注意する場合があります
  ・話題が上記コンテンツに近づいた場合は、速やかに話題を切り替えるなどしてください
- ・上記コンテンツに繰り返し言及する場合、管理者・運営から罰則を与える場合があります。詳細は罰則規定を参照してください
+ ・これらに類する内容を含むアーカイブの登録も禁止となります
+ ・本サーバー内で上記コンテンツを繰り返し取り扱う場合、管理者・運営から罰則を与える場合があります。詳細は罰則規定を参照してください

`,
        ).replaceAll('\n', '<br>') +
        '</code>',
    },
    {
      externalId: '668e2da7-05fa-6cd5-a2c1-a5f3b9ebef5c',
      title: 'チャレンジアーカイブ 追加',
      createdAt: new TZDate(2025, 2, 9, 15, timezone),
      content: `
      <p>
        ・<a href="/archives/challenge">チャレンジアーカイブ一覧ページ</a>を公開しました
      </p>
      <div style="margin-top: 5px; margin-bottom: 5px;" />
      <p>
        ・TOPページから<a href="/archives">アーカイブ一覧ページへのリンク</a>を変更しました
      </p>
      `,
    },
    {
      externalId: 'd31ed353-4ed6-deb7-19d5-4b19d3813677',
      title: 'お問い合わせフォーム 追加',
      createdAt: new TZDate(2025, 2, 13, 0, timezone),
      content: `
      <p>
        <a href="/#inquiry">外部向けお問い合わせフォームへのリンク</a>を、TOPページに追加しました
      </p>
      `,
    },
    {
      externalId: 'ba53c467-9486-c62c-c132-9298745138d3',
      title: 'TOPページ更新',
      createdAt: new TZDate(2025, 7, 26, 20, timezone),
      content: 'TOPページの内容を、より詳しく更新しました',
    },
    {
      externalId: '7a943eab-5506-4e17-b132-6baba586089e',
      title: 'デザインの更新',
      createdAt: new TZDate(2025, 11, 26, 12, timezone),
      content: 'ページのデザインをより読みやすいように更新しました',
    },
    {
      externalId: '8c2f9e1a-7b4d-4e3f-a1c2-5d8e9f2a3b4c',
      title: '動画アーカイブページのデザイン更新',
      createdAt: new TZDate(2025, 8, 12, 21, timezone),
      content: '動画アーカイブページのデザインを更新しました',
    },
  ],
]

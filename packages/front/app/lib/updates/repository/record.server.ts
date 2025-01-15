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
  ],
]

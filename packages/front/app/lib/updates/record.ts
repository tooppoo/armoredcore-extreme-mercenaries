import { TZDate } from '@date-fns/tz'
import { siteName, timezone } from 'packages/front/app/lib/constants'

export type Update = Readonly<{
  external_id: string
  title: string
  published_at: Date
  content: string
}> 

export const updates: readonly Update[] = [
  {
    external_id: 'ccbb6c5c-90e5-9506-a6fb-701f142db1c1',
    title: '初版公開',
    published_at: new TZDate(2024, 9, 3, timezone),
    content: `${siteName}のドキュメント初版を公開しました`,
  },
]

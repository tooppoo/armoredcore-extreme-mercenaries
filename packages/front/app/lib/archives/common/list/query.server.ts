import { z } from 'zod'
import { orderQueryKeys } from './query'
import { SQL } from 'drizzle-orm'

export const querySchema = (orderByCreated: OrderFunction) =>
  z.object({
    p: z
      .string()
      .default('1')
      .transform((v) => parseInt(v, 10))
      .pipe(z.number().min(1))
      .catch(1),
    k: z.string().optional().default(''),
    o: z
      .enum(orderQueryKeys)
      .optional()
      .default('created.desc')
      .catch('created.desc')
      .transform((key) => {
        switch (key) {
          case 'created.asc':
            return {
              key,
              order: orderByCreated('asc'),
            }
          case 'created.desc':
            return {
              key,
              order: orderByCreated('desc'),
            }
        }
      }),
    // 動画ソースのフィルター（動画一覧のみで利用）
    // all: すべて, yt: YouTube, x: X(Twitter), nico: ニコニコ
    s: z
      .enum(['all', 'yt', 'x', 'nico'] as const)
      .optional()
      .default('all')
      .catch('all'),
    // 表示モード（動画一覧のみで利用）
    v: z
      .enum(['card', 'list'] as const)
      .optional()
      .default('card')
      .catch('card'),
  })
export type QuerySchema = Readonly<z.infer<ReturnType<typeof querySchema>>>

export type OrderFunction = (o: OrderDirection) => Order
type OrderDirection = 'asc' | 'desc'
export type Order = Readonly<{
  order(): [SQL, SQL]
}>

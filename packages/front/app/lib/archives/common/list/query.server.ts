import { z } from 'zod'
import { zx } from 'zodix'
import { orderQueryKeys } from './query'
import { SQL } from 'drizzle-orm'

export const querySchema = (orderByCreated: OrderFunction) => ({
  p: zx.IntAsString.optional()
    .pipe(z.number().min(1).default(1).catch(1))
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
})
export type QuerySchema = Readonly<
  z.infer<ReturnType<typeof z.object<ReturnType<typeof querySchema>>>>
>

export type OrderFunction = (o: OrderDirection) => Order
type OrderDirection = 'asc' | 'desc'
export type Order = Readonly<{
  order(): [SQL, SQL]
}>

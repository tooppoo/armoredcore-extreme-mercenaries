
export const orderQueryKeys = [
  'created.asc',
  'created.desc',
] as const

export type OrderQueryKey = (typeof orderQueryKeys)[number]

export const orderQueryMap = {
  'created.asc': {
    label: '登録が古い順',
  },
  'created.desc': {
    label: '登録が新しい順',
  },
} as const satisfies Record<OrderQueryKey, { label: string }> 

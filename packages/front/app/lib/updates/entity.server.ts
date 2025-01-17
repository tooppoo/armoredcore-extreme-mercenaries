import { type ReactNode } from 'react'

export type ReadUpdate = Readonly<{
  externalId: string
  title: string
  caption: string
  createdAt: Date
  content: ReactNode
}>

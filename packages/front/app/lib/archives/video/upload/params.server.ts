import { z } from 'zod'

export const postArchiveBody = z.object({
  url: z.string().url().min(1),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  discord_user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
})

export type PostArchiveBody = z.infer<typeof postArchiveBody>

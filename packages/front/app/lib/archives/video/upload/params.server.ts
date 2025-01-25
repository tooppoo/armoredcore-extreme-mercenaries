import { z } from 'zod';

export const postArchiveBody = z.object({
  url: z.string().url().nonempty(),
  discord_user: z.object({
    id: z.string().nonempty(),
    name: z.string().nonempty(),
  }),
})

export type PostArchiveBody = z.infer<typeof postArchiveBody>

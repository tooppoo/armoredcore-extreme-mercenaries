import { z } from 'zod'

const postChallengeArchiveLinkBody = z.object({
  type: z.literal('link'),
  title: z.string().min(1),
  url: z.string().url().min(1),
  description: z.string().min(1).optional(),
  discord_user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
})
const postChallengeArchiveTextBody = z.object({
  type: z.literal('text'),
  title: z.string().min(1),
  text: z.string().min(1),
  discord_user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
})
export const postChallengeArchiveBody = z.union([
  postChallengeArchiveLinkBody,
  postChallengeArchiveTextBody,
])

export type PostChallengeArchiveLinkBody = z.infer<
  typeof postChallengeArchiveLinkBody
>
export type PostChallengeArchiveTextBody = z.infer<
  typeof postChallengeArchiveTextBody
>
export type PostChallengeArchiveBody = z.infer<typeof postChallengeArchiveBody>

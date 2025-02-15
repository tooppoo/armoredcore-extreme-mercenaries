import { z } from 'zod'

const postChallengeArchiveLinkBody = z.object({
  type: z.literal('link'),
  title: z.string().nonempty(),
  url: z.string().url().nonempty(),
  discord_user: z.object({
    id: z.string().nonempty(),
    name: z.string().nonempty(),
  }),
})
const postChallengeArchiveTextBody = z.object({
  type: z.literal('text'),
  title: z.string().nonempty(),
  text: z.string().nonempty(),
  discord_user: z.object({
    id: z.string().nonempty(),
    name: z.string().nonempty(),
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

import { LoaderFunctionArgs } from 'react-router';

export type LoadDiscord = Readonly<{
  discord: Readonly<{
    invite: string
    question: string
    suggestion: string
  }>
}>
export const loadDiscord = ({ context }: LoaderFunctionArgs): LoadDiscord => ({
  discord: {
    invite: context.cloudflare.env.DISCORD_LINK_INVITE,
    question: context.cloudflare.env.DISCORD_LINK_QUESTION,
    suggestion: context.cloudflare.env.DISCORD_LINK_SUGGESTION,
  },
})

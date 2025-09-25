/**
 * Discordユーザー情報
 */
export interface DiscordUser {
  id: string
  name: string
}

/**
 * チャレンジアーカイブAPIリクエストボディ
 */
export interface ChallengeArchiveRequestBody {
  type: 'link'
  title: string
  url: string
  description?: string
  discord_user: DiscordUser
}

/**
 * 動画アーカイブAPIリクエストボディ
 */
export interface VideoArchiveRequestBody {
  url: string
  title?: string
  description?: string
  discord_user: DiscordUser
}

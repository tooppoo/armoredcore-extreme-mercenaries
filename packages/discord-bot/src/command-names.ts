/**
 * Discordコマンド名の定数定義
 *
 * このモジュールはコマンド名の単一真実源として機能し、
 * discord-botとfrontの両方から参照される。
 */

export const ARCHIVE_VIDEO_COMMAND_NAME = 'archive-video' as const
export const ARCHIVE_CHALLENGE_COMMAND_NAME = 'archive-challenge' as const

/**
 * すべてのコマンド名のユニオン型
 */
export type CommandName =
  | typeof ARCHIVE_VIDEO_COMMAND_NAME
  | typeof ARCHIVE_CHALLENGE_COMMAND_NAME

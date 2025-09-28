import { log } from './log.js'

/**
 * 必須の環境変数リスト
 */
const REQUIRED_ENV_VARS = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'DISCORD_GUILD_ID',
  'DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS',
  'DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS',
  'DISCORD_DEV_ALERT_CHANNEL_ID',
  'FRONT_URL',
  'FRONT_AUTH_UPLOAD_ARCHIVE',
] as const

/**
 * 起動時に必要な環境変数がすべて設定されているかチェックする
 * 不足している環境変数があればエラーを起こして起動をキャンセルする
 */
export function validateEnvironmentVariables(): void {
  const missingVars: string[] = []

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`
    log('error', errorMessage)
    throw new Error(errorMessage)
  }

  log(
    'info',
    'Environment variables validation completed: All required variables are set',
  )
}

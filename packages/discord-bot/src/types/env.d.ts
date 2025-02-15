declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        ENV: 'local' | 'production'
        PORT?: string
        LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error'

        DISCORD_TOKEN: string
        DISCORD_CLIENT_ID: string
        DISCORD_GUILD_ID: string

        DISCORD_VIDEO_ARCHIVE_CHANNEL: string
        DISCORD_CHALLENGE_ARCHIVE_CHANNEL: string

        FRONT_URL: string
        FRONT_AUTH_UPLOAD_ARCHIVE: string
      }
    }
  }
}

declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error'

        DISCORD_TOKEN: string
        DISCORD_CLIENT_ID: string
        DISCORD_GUILD_ID: string
      }
    }
  }
}

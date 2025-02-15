import type { Collection } from 'discord.js'
import type { Command } from '../bot/commands'
import type { MessageHandler } from '../bot/messages'

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>
    messageHandlers: Collection<string, MessageHandler>
  }
}

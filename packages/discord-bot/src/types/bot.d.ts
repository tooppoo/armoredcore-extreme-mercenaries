import type { CacheType, Client, Collection, Interaction, SlashCommandBuilder } from 'discord.js';

declare module 'discord.js' {
  export type Command = Readonly<{
    data: Pick<SlashCommandBuilder, 'name' | 'description' | 'toJSON'>
    execute: (interaction: Interaction<CacheType>) => Promise<void>
  }>

  interface Client {
    commands: Collection<string, Command>
  }
}

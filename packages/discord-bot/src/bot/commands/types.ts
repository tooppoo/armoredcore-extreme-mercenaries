import type { SlashCommandBuilder } from 'discord.js'

export type Command = Readonly<{
  data: Pick<SlashCommandBuilder, 'name' | 'description' | 'toJSON'>
}>


import type { CacheType, Interaction, SlashCommandBuilder } from 'discord.js';

export type Command = Readonly<{
  data: Pick<SlashCommandBuilder, 'name' | 'description' | 'toJSON'>
  execute: (interaction: Interaction<CacheType>) => Promise<void>
}>

export const commands: readonly Command[] = []

import type { CacheType, Interaction, SlashCommandBuilder } from 'discord.js'
import { archiveChallengeCommand } from './archive-challenge.js'

export type Command = Readonly<{
  data: Pick<SlashCommandBuilder, 'name' | 'description' | 'toJSON'>
  execute: (interaction: Interaction<CacheType>) => Promise<void>
}>

export const commands: readonly Command[] = [archiveChallengeCommand]

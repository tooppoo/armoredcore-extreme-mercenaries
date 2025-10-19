import { SlashCommandBuilder } from 'discord.js'
import { createArchiveCommand } from './lib/archive-command-factory.js'
import { ARCHIVE_CHALLENGE_COMMAND_NAME } from '../../command-names.js'

export const commandName = ARCHIVE_CHALLENGE_COMMAND_NAME

const data = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription('チャレンジアーカイブを登録します')
  .addStringOption((option) =>
    option
      .setName('title')
      .setDescription('タイトル（必須）')
      .setRequired(true),
  )
  .addStringOption((option) =>
    option.setName('url').setDescription('対象のURL（必須）').setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName('description')
      .setDescription('説明（未指定の場合は自動取得）')
      .setRequired(false),
  )

export const archiveChallengeCommand = createArchiveCommand(data)

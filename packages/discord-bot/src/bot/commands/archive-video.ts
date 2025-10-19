import { SlashCommandBuilder } from 'discord.js'
import {
  createArchiveCommand,
} from './lib/archive-command-factory.js'

const data = new SlashCommandBuilder()
  .setName('archive-video')
  .setDescription('動画アーカイブを登録します')
  .addStringOption((option) =>
    option.setName('url').setDescription('対象のURL（必須）').setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName('title')
      .setDescription('タイトル（未指定の場合は自動取得）')
      .setRequired(false),
  )
  .addStringOption((option) =>
    option
      .setName('description')
      .setDescription('説明（未指定の場合は自動取得）')
      .setRequired(false),
  )

export const archiveVideoCommand = createArchiveCommand(
  data,
)

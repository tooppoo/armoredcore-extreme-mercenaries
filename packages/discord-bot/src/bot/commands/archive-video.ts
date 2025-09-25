import { SlashCommandBuilder } from 'discord.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import {
  createArchiveCommand,
  type BaseCommandParameters,
} from '../lib/archive-command-factory.js'
import { type VideoArchiveRequestBody } from '../types/archive.js'

interface VideoArchiveParameters extends BaseCommandParameters {
  title?: string
  description?: string
}

function extractParams(
  interaction: ChatInputCommandInteraction,
): VideoArchiveParameters {
  return {
    url: interaction.options.getString('url', true).trim(),
    title: interaction.options.getString('title')?.trim(),
    description: interaction.options.getString('description')?.trim(),
  }
}

function createSuccessMessage(params: VideoArchiveParameters): string {
  const lines = [
    'アーカイブに登録しました',
    '',
    `**URL:** ${params.url}`, // URLプレビューを表示してユーザーが指定したURLの内容を確認できるようにする
  ]

  if (params.title) {
    lines.push(`**タイトル:** ${params.title}`)
  }

  if (params.description) {
    lines.push(`**説明:** ${params.description}`)
  }

  return lines.join('\n')
}

function createFailureMessage(
  baseMessage: string,
  params: VideoArchiveParameters,
  correlationId?: string,
): string {
  const lines = [
    baseMessage,
    '',
    `**URL:** ${params.url}`, // URLプレビューを表示してユーザーが指定したURLの内容を確認できるようにする
  ]

  if (params.title) {
    lines.push(`**タイトル:** ${params.title}`)
  }

  if (params.description) {
    lines.push(`**説明:** ${params.description}`)
  }

  if (correlationId) {
    lines.push('', `**トレース ID:** ${correlationId}`)
  }

  return lines.join('\n')
}

function createRequestBody(
  params: VideoArchiveParameters,
  interaction: ChatInputCommandInteraction,
): VideoArchiveRequestBody {
  return {
    url: params.url,
    discord_user: {
      id: interaction.user.id,
      name: interaction.user.username,
    },
    ...(params.title && { title: params.title }),
    ...(params.description && { description: params.description }),
  }
}

const errorMessageMap: Record<string, string> = {
  'unsupported-url': 'サポート外のURLなのでスキップしました',
  'duplicated-url': '既にアーカイブ済みのURLなのでスキップしました',
  'failed-get-ogp': 'アーカイブの情報を取得できませんでした',
}

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
  {
    commandName: 'video-archive',
    commandDescription: '動画アーカイブを登録します',
    apiEndpoint: '/api/archives/video',
    allowedChannelIdsEnvVar: 'DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS',
    errorMessageMap,
    developerAlertPrefix: '動画アーカイブ登録',
  },
  createSuccessMessage,
  createFailureMessage,
  createRequestBody,
  extractParams,
)

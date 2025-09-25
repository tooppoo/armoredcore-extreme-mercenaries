import { SlashCommandBuilder } from 'discord.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import {
  createArchiveCommand,
  type BaseCommandParameters,
} from '../lib/archive-command-factory.js'
import { type ChallengeArchiveRequestBody } from '../types/archive.js'

interface ChallengeArchiveParameters extends BaseCommandParameters {
  title: string // 必須フィールド
  description?: string
}

function extractParams(
  interaction: ChatInputCommandInteraction,
): ChallengeArchiveParameters {
  return {
    url: interaction.options.getString('url', true).trim(),
    title: interaction.options.getString('title', true).trim(),
    description: interaction.options.getString('description')?.trim(),
  }
}

function createSuccessMessage(params: ChallengeArchiveParameters): string {
  const lines = [
    'アーカイブに登録しました',
    '',
    `**タイトル:** ${params.title}`,
    `**URL:** ${params.url}`, // URLプレビューを表示してユーザーが指定したURLの内容を確認できるようにする
  ]

  if (params.description) {
    lines.push(`**説明:** ${params.description}`)
  }

  return lines.join('\n')
}

function createFailureMessage(
  baseMessage: string,
  params: ChallengeArchiveParameters,
  correlationId?: string,
): string {
  const lines = [
    baseMessage,
    '',
    `**タイトル:** ${params.title}`,
    `**URL:** ${params.url}`, // URLプレビューを表示してユーザーが指定したURLの内容を確認できるようにする
  ]

  if (params.description) {
    lines.push(`**説明:** ${params.description}`)
  }

  if (correlationId) {
    lines.push('', `**トレース ID:** ${correlationId}`)
  }

  return lines.join('\n')
}

function createRequestBody(
  params: ChallengeArchiveParameters,
  interaction: ChatInputCommandInteraction,
): ChallengeArchiveRequestBody {
  return {
    type: 'link',
    title: params.title,
    url: params.url,
    discord_user: {
      id: interaction.user.id,
      name: interaction.user.username,
    },
    ...(params.description && { description: params.description }),
  }
}

const errorMessageMap: Record<string, string> = {
  'unsupported-url': 'サポート外のURLなのでスキップしました',
  'duplicated-url': '登録済みのアーカイブなので、スキップしました',
}

const data = new SlashCommandBuilder()
  .setName('archive-challenge')
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

export const archiveChallengeCommand = createArchiveCommand(
  data,
  {
    commandName: 'challenge-archive',
    commandDescription: 'チャレンジアーカイブを登録します',
    apiEndpoint: '/api/archives/challenge',
    allowedChannelIdsEnvVar: 'DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS',
    errorMessageMap,
    developerAlertPrefix: 'チャレンジアーカイブ登録',
  },
  createSuccessMessage,
  createFailureMessage,
  createRequestBody,
  extractParams,
)

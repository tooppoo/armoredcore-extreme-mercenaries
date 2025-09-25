import { SlashCommandBuilder } from 'discord.js'
import { frontApi } from '../lib/front.js'
import { log } from '../../lib/log.js'
import { makeCatchesSerializable } from '../../lib/error.js'
import { parseAllowedChannelIds } from '../lib/channel.js'
import { sendDeveloperAlert } from '../lib/notification.js'
import { type ChallengeArchiveRequestBody } from '../types/archive.js'
import { type Command } from './index.js'

function createSuccessMessage(
  title: string,
  url: string,
  description?: string,
): string {
  const lines = [
    'アーカイブに登録しました',
    '',
    `**タイトル:** ${title}`,
    `**URL:** ${url}`, // URLプレビューを表示してユーザーが指定したURLの内容を確認できるようにする
  ]

  if (description) {
    lines.push(`**説明:** ${description}`)
  }

  return lines.join('\n')
}

function createFailureMessage(
  baseMessage: string,
  title: string,
  url: string,
  correlationId: string,
  description?: string,
): string {
  const lines = [
    baseMessage,
    '',
    `**タイトル:** ${title}`,
    `**URL:** ${url}`, // URLプレビューを表示してユーザーが指定したURLの内容を確認できるようにする
  ]

  if (description) {
    lines.push(`**説明:** ${description}`)
  }

  lines.push('', `**トレース ID:** ${correlationId}`)

  return lines.join('\n')
}
const invalidResponseMessage = 'アーカイブ追加中にエラーが発生しました'
const commandFailureMessage = 'アーカイブ追加に失敗しました'
const disallowedChannelMessage =
  'このコマンドは許可されたチャンネルでのみ利用できます'
const fallbackErrorMessage = 'アーカイブに登録されませんでした'

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

export const archiveChallengeCommand: Command = {
  data,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) {
      return
    }

    const correlationId = interaction.id
    const allowedChannelIdsEnv =
      process.env.DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS
    if (!allowedChannelIdsEnv) {
      await interaction.reply({
        content:
          'コマンドの実行が許可されていません。管理者にお問い合わせください。',
      })
      log('error', {
        message: 'DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS is not set',
        correlationId,
      })
      return
    }

    const allowedChannelIds = parseAllowedChannelIds(allowedChannelIdsEnv)

    if (
      allowedChannelIds.size > 0 &&
      !allowedChannelIds.has(interaction.channelId ?? '')
    ) {
      await interaction.reply({ content: disallowedChannelMessage })
      log('info', {
        message: 'Slash command invoked from disallowed channel',
        command: interaction.commandName,
        channelId: interaction.channelId,
        correlationId,
      })
      return
    }

    const authToken = process.env.FRONT_AUTH_UPLOAD_ARCHIVE
    if (!authToken) {
      await interaction.reply({ content: commandFailureMessage })
      log('error', {
        message: 'FRONT_AUTH_UPLOAD_ARCHIVE is not set',
        correlationId,
      })
      return
    }

    const title = interaction.options.getString('title', true).trim()
    const url = interaction.options.getString('url', true).trim()
    const descriptionOption = interaction.options
      .getString('description')
      ?.trim()

    await interaction.deferReply()

    const requestBody: ChallengeArchiveRequestBody = {
      type: 'link',
      title,
      url,
      discord_user: {
        id: interaction.user.id,
        name: interaction.user.username,
      },
      ...(descriptionOption && { description: descriptionOption }),
    }

    try {
      const response = await fetch(frontApi('/api/archives/challenge'), {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'X-Correlation-ID': correlationId,
        },
      })

      log('debug', {
        message: 'Received response from challenge archive API',
        status: response.status,
        correlationId,
      })

      if (response.ok) {
        const successMessage = createSuccessMessage(
          title,
          url,
          descriptionOption,
        )
        await interaction.editReply({ content: successMessage })
        return
      }

      let errorCode = 'unknown'
      try {
        const body = (await response.json()) as { code?: string }
        if (typeof body?.code === 'string' && body.code.length > 0) {
          errorCode = body.code
        }
      } catch (error) {
        log('error', {
          message: 'Failed to parse error response from challenge archive API',
          detail: makeCatchesSerializable(error),
          correlationId,
        })
        const failureMessage = createFailureMessage(
          invalidResponseMessage,
          title,
          url,
          correlationId,
          descriptionOption,
        )
        await interaction.editReply({ content: failureMessage })
        return
      }

      if (response.status >= 500) {
        const failureMessage = createFailureMessage(
          `予期しないエラーが発生しました (コード: ${errorCode})`,
          title,
          url,
          correlationId,
          descriptionOption,
        )
        await interaction.editReply({
          content: failureMessage,
        })
        const alertContent = [
          'チャレンジアーカイブ登録でエラーが発生しました',
          `コード: ${errorCode}`,
          `Correlation ID: ${correlationId}`,
          `User: ${interaction.user.username} (${interaction.user.id})`,
          `Channel: ${interaction.channelId ?? 'unknown'}`,
          `Title: ${title}`,
          `URL: ${url}`,
        ].join('\n')

        await sendDeveloperAlert(interaction, alertContent, {
          correlationId,
          errorCode,
          title,
          url,
        })
        return
      }

      const baseMessage = errorMessageMap[errorCode] ?? fallbackErrorMessage
      const failureMessage = createFailureMessage(
        baseMessage,
        title,
        url,
        correlationId,
        descriptionOption,
      )
      await interaction.editReply({ content: failureMessage })
    } catch (error) {
      log('error', {
        message: 'Failed to call challenge archive API',
        detail: makeCatchesSerializable(error),
        correlationId,
      })
      const failureMessage = createFailureMessage(
        commandFailureMessage,
        title,
        url,
        correlationId,
        descriptionOption,
      )
      await interaction.editReply({ content: failureMessage })
    }
  },
}

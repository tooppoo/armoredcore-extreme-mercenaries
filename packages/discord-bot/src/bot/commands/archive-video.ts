import { SlashCommandBuilder } from 'discord.js'
import { frontApi } from '../lib/front.js'
import { log } from '../../lib/log.js'
import { makeCatchesSerializable } from '../../lib/error.js'
import { parseAllowedChannelIds } from '../lib/channel.js'
import { sendDeveloperAlert } from '../lib/notification.js'
import { type VideoArchiveRequestBody } from '../types/archive.js'
import { type Command } from './index.js'

function createSuccessMessage(
  url: string,
  title?: string,
  description?: string,
): string {
  const lines = [
    'アーカイブに登録しました',
    '',
    `**URL:** ${url}`, // URLプレビューを表示してユーザーが指定したURLの内容を確認できるようにする
  ]

  if (title) {
    lines.push(`**タイトル:** ${title}`)
  }

  if (description) {
    lines.push(`**説明:** ${description}`)
  }

  return lines.join('\n')
}

function createFailureMessage(
  baseMessage: string,
  url: string,
  correlationId: string,
  title?: string,
  description?: string,
): string {
  const lines = [
    baseMessage,
    '',
    `**URL:** ${url}`, // URLプレビューを表示してユーザーが指定したURLの内容を確認できるようにする
  ]

  if (title) {
    lines.push(`**タイトル:** ${title}`)
  }

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

export const archiveVideoCommand: Command = {
  data,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) {
      return
    }

    const correlationId = interaction.id
    const allowedChannelIdsEnv =
      process.env.DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS
    if (!allowedChannelIdsEnv) {
      await interaction.reply({
        content:
          'コマンドの実行が許可されていません。管理者にお問い合わせください。',
      })
      log('error', {
        message: 'DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS is not set',
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
      const failureMessage = createFailureMessage(
        commandFailureMessage,
        interaction.options.getString('url', true).trim(),
        correlationId,
        interaction.options.getString('title')?.trim(),
        interaction.options.getString('description')?.trim(),
      )
      await interaction.reply({ content: failureMessage })
      log('error', {
        message: 'FRONT_AUTH_UPLOAD_ARCHIVE is not set',
        correlationId,
      })
      return
    }

    const url = interaction.options.getString('url', true).trim()
    const titleOption = interaction.options.getString('title')?.trim()
    const descriptionOption = interaction.options
      .getString('description')
      ?.trim()

    await interaction.deferReply()

    const requestBody: VideoArchiveRequestBody = {
      url,
      discord_user: {
        id: interaction.user.id,
        name: interaction.user.username,
      },
      ...(titleOption && { title: titleOption }),
      ...(descriptionOption && { description: descriptionOption }),
    }

    try {
      const response = await fetch(frontApi('/api/archives/video'), {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'X-Correlation-ID': correlationId,
        },
      })

      log('debug', {
        message: 'Received response from video archive API',
        status: response.status,
        correlationId,
      })

      if (response.ok) {
        const successMessage = createSuccessMessage(
          url,
          titleOption,
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
          message: 'Failed to parse error response from video archive API',
          detail: makeCatchesSerializable(error),
          correlationId,
        })
        const failureMessage = createFailureMessage(
          invalidResponseMessage,
          url,
          correlationId,
          titleOption,
          descriptionOption,
        )
        await interaction.editReply({ content: failureMessage })
        return
      }

      if (response.status >= 500) {
        const failureMessage = createFailureMessage(
          `予期しないエラーが発生しました (コード: ${errorCode})`,
          url,
          correlationId,
          titleOption,
          descriptionOption,
        )
        await interaction.editReply({
          content: failureMessage,
        })
        const alertContentLines = [
          '動画アーカイブ登録でエラーが発生しました',
          `コード: ${errorCode}`,
          `Correlation ID: ${correlationId}`,
          `User: ${interaction.user.username} (${interaction.user.id})`,
          `Channel: ${interaction.channelId ?? 'unknown'}`,
          `URL: ${url}`,
          ...(titleOption ? [`Title: ${titleOption}`] : []),
          ...(descriptionOption ? [`Description: ${descriptionOption}`] : []),
        ]

        const alertContent = alertContentLines.join('\n')

        await sendDeveloperAlert(interaction, alertContent, {
          correlationId,
          errorCode,
          url,
          title: titleOption,
          description: descriptionOption,
        })
        return
      }

      const baseMessage = errorMessageMap[errorCode] ?? fallbackErrorMessage
      const failureMessage = createFailureMessage(
        baseMessage,
        url,
        correlationId,
        titleOption,
        descriptionOption,
      )
      await interaction.editReply({ content: failureMessage })
    } catch (error) {
      log('error', {
        message: 'Failed to call video archive API',
        detail: makeCatchesSerializable(error),
        correlationId,
      })
      const failureMessage = createFailureMessage(
        commandFailureMessage,
        url,
        correlationId,
        titleOption,
        descriptionOption,
      )
      await interaction.editReply({ content: failureMessage })
    }
  },
}

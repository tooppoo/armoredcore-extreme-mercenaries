import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { frontApi } from '../lib/front.js'
import { log } from '../../lib/log.js'
import { makeCatchesSerializable } from '../../lib/error.js'
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

const DEV_ALERT_RETRY_ATTEMPTS = 3
const RETRY_WAIT_MS = 1000

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

    const requestBody: Record<string, unknown> = {
      url,
      discord_user: {
        id: interaction.user.id,
        name: interaction.user.username,
      },
    }

    if (titleOption) {
      requestBody.title = titleOption
    }

    if (descriptionOption) {
      requestBody.description = descriptionOption
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
        await notifyDeveloper(interaction, {
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

type DeveloperNotificationPayload = Readonly<{
  correlationId: string
  errorCode: string
  url: string
  title?: string
  description?: string
}>

async function notifyDeveloper(
  interaction: ChatInputCommandInteraction,
  {
    correlationId,
    errorCode,
    url,
    title,
    description,
  }: DeveloperNotificationPayload,
): Promise<void> {
  const channelId = process.env.DISCORD_DEV_ALERT_CHANNEL_ID

  const contentLines = [
    '動画アーカイブ登録でエラーが発生しました',
    `コード: ${errorCode}`,
    `Correlation ID: ${correlationId}`,
    `User: ${interaction.user.username} (${interaction.user.id})`,
    `Channel: ${interaction.channelId ?? 'unknown'}`,
    `URL: ${url}`,
  ]

  if (title) {
    contentLines.push(`Title: ${title}`)
  }

  if (description) {
    contentLines.push(`Description: ${description}`)
  }

  const content = contentLines.join('\n')

  // 通知に失敗したら、一定回数リトライ
  for (let attempt = 1; attempt <= DEV_ALERT_RETRY_ATTEMPTS; attempt++) {
    try {
      const channel = await interaction.client.channels.fetch(channelId)
      if (!channel || !channel.isSendable()) {
        throw new Error('Developer alert channel is not sendable')
      }

      await channel.send({ content })
      log('info', {
        message: 'Sent developer alert for video archive error',
        correlationId,
        errorCode,
        attempt,
      })
      return
    } catch (error) {
      log('error', {
        message: 'Failed to send developer alert',
        attempt,
        correlationId,
        errorCode,
        detail: makeCatchesSerializable(error),
      })

      if (attempt < DEV_ALERT_RETRY_ATTEMPTS) {
        await wait(RETRY_WAIT_MS)
      }
    }
  }

  log('error', {
    message: 'Developer alert retries exhausted',
    correlationId,
    errorCode,
  })
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseAllowedChannelIds(value?: string): Set<string> {
  if (!value) {
    return new Set<string>()
  }

  return new Set(
    value
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  )
}

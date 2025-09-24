import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { frontApi } from '../lib/front.js'
import { log } from '../../lib/log.js'
import { makeCatchesSerializable } from '../../lib/error.js'
import { type Command } from './index.js'

const successMessage = 'アーカイブに登録しました'
const invalidResponseMessage = 'アーカイブ追加中にエラーが発生しました'
const commandFailureMessage = 'アーカイブ追加に失敗しました'
const disallowedChannelMessage =
  'このコマンドは #チャレンジアーカイブ チャンネルでのみ利用できます'
const fallbackErrorMessage = 'アーカイブに登録されませんでした'

const errorMessageMap: Record<string, string> = {
  'unsupported-url': 'サポート外のURLなのでスキップしました',
  'duplicated-url': '登録済みのアーカイブなので、スキップしました',
}

const data = new SlashCommandBuilder()
  .setName('archive-challenge')
  .setDescription('チャレンジアーカイブを登録します')
  .addStringOption((option) =>
    option.setName('title').setDescription('タイトル').setRequired(true),
  )
  .addStringOption((option) =>
    option.setName('url').setDescription('対象のURL').setRequired(true),
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
      await interaction.reply({ content: 'コマンドの実行が許可されていません。管理者にお問い合わせください。' })
      log('error', {
        message: 'DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS is not set',
        correlationId,
      })
      return
    }
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

    const requestBody: Record<string, unknown> = {
      type: 'link',
      title,
      url,
      discord_user: {
        id: interaction.user.id,
        name: interaction.user.username,
      },
    }

    if (descriptionOption) {
      requestBody.description = descriptionOption
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
        await interaction.editReply({ content: invalidResponseMessage })
        return
      }

      if (response.status >= 500) {
        await interaction.editReply({
          content: `予期しないエラーが発生しました (コード: ${errorCode})`,
        })
        await notifyDeveloper(interaction, {
          correlationId,
          errorCode,
          title,
          url,
        })
        return
      }

      const message = errorMessageMap[errorCode] ?? fallbackErrorMessage
      await interaction.editReply({ content: message })
    } catch (error) {
      log('error', {
        message: 'Failed to call challenge archive API',
        detail: makeCatchesSerializable(error),
        correlationId,
      })
      await interaction.editReply({ content: commandFailureMessage })
    }
  },
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

type DeveloperNotificationPayload = Readonly<{
  correlationId: string
  errorCode: string
  title: string
  url: string
}>

async function notifyDeveloper(
  interaction: ChatInputCommandInteraction,
  { correlationId, errorCode, title, url }: DeveloperNotificationPayload,
): Promise<void> {
  const channelId = process.env.DISCORD_DEV_ALERT_CHANNEL_ID

  const content = [
    'チャレンジアーカイブ登録でエラーが発生しました',
    `コード: ${errorCode}`,
    `Correlation ID: ${correlationId}`,
    `User: ${interaction.user.username} (${interaction.user.id})`,
    `Channel: ${interaction.channelId ?? 'unknown'}`,
    `Title: ${title}`,
    `URL: ${url}`,
  ].join('\n')

  // 通知に失敗したら、一定回数リトライ
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const channel = await interaction.client.channels.fetch(channelId)
      if (!channel || !channel.isSendable()) {
        throw new Error('Developer alert channel is not sendable')
      }

      await channel.send({ content })
      log('info', {
        message: 'Sent developer alert for challenge archive error',
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

      if (attempt < 3) {
        await wait(1000)
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

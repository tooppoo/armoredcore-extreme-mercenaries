import type {
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  ChatInputCommandInteraction,
} from 'discord.js'
import { frontApi } from './front.js'
import { log } from '../../lib/log.js'
import { makeCatchesSerializable } from '../../lib/error.js'
import { parseAllowedChannelIds } from './channel.js'
import { sendDeveloperAlert } from './notification.js'
import { type Command } from '../commands/index.js'

/**
 * アーカイブコマンドの設定
 */
export interface ArchiveCommandConfig {
  /** コマンド名 */
  commandName: string
  /** コマンドの説明 */
  commandDescription: string
  /** APIエンドポイント */
  apiEndpoint: string
  /** 許可チャンネルIDsの環境変数名 */
  allowedChannelIdsEnvVar: string
  /** エラーマップ */
  errorMessageMap: Record<string, string>
  /** 開発者通知のプレフィックス */
  developerAlertPrefix: string
}

/**
 * 基本パラメータの設定
 */
export interface BaseCommandParameters {
  url: string
  title?: string
  description?: string
}

/**
 * 成功メッセージ作成関数の型
 */
export type SuccessMessageCreator<T extends BaseCommandParameters> = (
  params: T,
) => string

/**
 * 失敗メッセージ作成関数の型
 */
export type FailureMessageCreator<T extends BaseCommandParameters> = (
  baseMessage: string,
  params: T,
  correlationId?: string,
) => string

/**
 * リクエストボディ作成関数の型
 */
export type RequestBodyCreator<T extends BaseCommandParameters> = (
  params: T,
  interaction: ChatInputCommandInteraction,
) => unknown

/**
 * 汎用的なアーカイブコマンドファクトリ
 */
export function createArchiveCommand<T extends BaseCommandParameters>(
  commandBuilder: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder,
  config: ArchiveCommandConfig,
  createSuccessMessage: SuccessMessageCreator<T>,
  createFailureMessage: FailureMessageCreator<T>,
  createRequestBody: RequestBodyCreator<T>,
  extractParams: (interaction: ChatInputCommandInteraction) => T,
): Command {
  const {
    allowedChannelIdsEnvVar,
    apiEndpoint,
    errorMessageMap,
    developerAlertPrefix,
  } = config

  const invalidResponseMessage = 'アーカイブ追加中にエラーが発生しました'
  const commandFailureMessage = 'アーカイブ追加に失敗しました'
  const disallowedChannelMessage =
    'このコマンドは許可されたチャンネルでのみ利用できます'
  const fallbackErrorMessage = 'アーカイブに登録されませんでした'

  return {
    data: commandBuilder,
    async execute(interaction) {
      if (!interaction.isChatInputCommand()) {
        return
      }

      const correlationId = interaction.id as string
      const allowedChannelIdsEnv = process.env[allowedChannelIdsEnvVar]
      if (!allowedChannelIdsEnv) {
        await interaction.reply({
          content:
            'コマンドの実行が許可されていません。管理者にお問い合わせください。',
        })
        log('error', {
          message: `${allowedChannelIdsEnvVar} is not set`,
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
      const params = extractParams(interaction)

      if (!authToken) {
        const failureMessage = createFailureMessage(
          commandFailureMessage,
          params,
          correlationId,
        )
        await interaction.reply({ content: failureMessage })
        log('error', {
          message: 'FRONT_AUTH_UPLOAD_ARCHIVE is not set',
          correlationId,
        })
        return
      }

      await interaction.deferReply()

      const requestBody = createRequestBody(params, interaction)

      try {
        const response = await fetch(frontApi(apiEndpoint), {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
            'X-Correlation-ID': correlationId,
          },
        })

        log('debug', {
          message: `Received response from ${config.commandName} API`,
          status: response.status,
          correlationId,
        })

        if (response.ok) {
          const successMessage = createSuccessMessage(params)
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
            message: `Failed to parse error response from ${config.commandName} API`,
            detail: makeCatchesSerializable(error),
            correlationId,
          })
          const failureMessage = createFailureMessage(
            invalidResponseMessage,
            params,
            correlationId,
          )
          await interaction.editReply({ content: failureMessage })
          return
        }

        if (response.status >= 500) {
          const failureMessage = createFailureMessage(
            `予期しないエラーが発生しました (コード: ${errorCode})`,
            params,
            correlationId,
          )
          await interaction.editReply({
            content: failureMessage,
          })

          // 開発者アラート
          const alertContentLines = [
            `${developerAlertPrefix}でエラーが発生しました`,
            `コード: ${errorCode}`,
            `Correlation ID: ${correlationId}`,
            `User: ${interaction.user.username} (${interaction.user.id})`,
            `Channel: ${interaction.channelId ?? 'unknown'}`,
            `URL: ${params.url}`,
            ...(params.title ? [`Title: ${params.title}`] : []),
            ...(params.description
              ? [`Description: ${params.description}`]
              : []),
          ]

          // パラメータの詳細をアラートに追加
          Object.entries(params).forEach(([key, value]) => {
            if (key !== 'url' && value !== undefined) {
              alertContentLines.push(`${key}: ${value}`)
            }
          })

          const alertContent = alertContentLines.join('\n')

          await sendDeveloperAlert(interaction, alertContent, {
            correlationId,
            errorCode,
            ...(params as Record<string, unknown>),
          })
          return
        }

        const baseMessage = errorMessageMap[errorCode] ?? fallbackErrorMessage
        const failureMessage = createFailureMessage(
          baseMessage,
          params,
          correlationId,
        )
        await interaction.editReply({ content: failureMessage })
      } catch (error) {
        log('error', {
          message: `Failed to call ${config.commandName} API`,
          detail: makeCatchesSerializable(error),
          correlationId,
        })
        const failureMessage = createFailureMessage(
          commandFailureMessage,
          params,
          correlationId,
        )
        await interaction.editReply({ content: failureMessage })
      }
    },
  }
}

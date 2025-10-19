import type {
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  ChatInputCommandInteraction,
} from 'discord.js'
import { type Command } from '../types.js'

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
export function createArchiveCommand(
  commandBuilder: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder,
): Command {
  return {
    data: commandBuilder,
  }
}

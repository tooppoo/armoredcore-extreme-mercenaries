import type { ChatInputCommandInteraction } from 'discord.js'
import { log } from '../../lib/log.js'
import { makeCatchesSerializable } from '../../lib/error.js'
import { wait } from '../../lib/async.js'

const DEV_ALERT_RETRY_ATTEMPTS = 3
const RETRY_WAIT_MS = 1000

/**
 * 開発者通知の追加メタデータ
 */
export interface DeveloperAlertMetadata {
  correlationId: string
  [key: string]: unknown
}

/**
 * 開発者専用チャンネルにアラートを送信する
 * @param interaction Discord Interaction
 * @param content 通知メッセージ
 * @param metadata メタデータ（correlationIdを含む）
 */
export async function sendDeveloperAlert(
  interaction: ChatInputCommandInteraction,
  content: string,
  metadata: DeveloperAlertMetadata,
): Promise<void> {
  const channelId = process.env.DISCORD_DEV_ALERT_CHANNEL_ID

  // 通知に失敗したら、一定回数リトライ
  for (let attempt = 1; attempt <= DEV_ALERT_RETRY_ATTEMPTS; attempt++) {
    try {
      const channel = await interaction.client.channels.fetch(channelId)
      if (!channel || !channel.isSendable()) {
        throw new Error('Developer alert channel is not sendable')
      }

      await channel.send({ content })
      log('info', {
        message: 'Sent developer alert',
        attempt,
        ...metadata,
      })
      return
    } catch (error) {
      log('error', {
        message: 'Failed to send developer alert',
        attempt,
        detail: makeCatchesSerializable(error),
        ...metadata,
      })

      if (attempt < DEV_ALERT_RETRY_ATTEMPTS) {
        await wait(RETRY_WAIT_MS)
      }
    }
  }

  log('error', {
    message: 'Developer alert retries exhausted',
    ...metadata,
  })
}

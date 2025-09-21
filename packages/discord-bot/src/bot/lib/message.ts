import type {
  Client,
  Message,
  OmitPartialGroupDMChannel,
  SendableChannels,
} from 'discord.js'
import { log } from '../../lib/log.js'

export type UserMessage = OmitPartialGroupDMChannel<Message<boolean>>

export type BotMessageContent = Readonly<{
  message: string
}>
type BotMessage = Parameters<SendableChannels['send']>[0]

export type SendMessage = (
  botMessageContent: BotMessageContent,
) => Promise<void>
export type SendMessageBuilder = (userMessage: UserMessage) => SendMessage

export function setupMessageSender(client: Client): SendMessageBuilder {
  return (userMessage) => async (botMessageContent) => {
    const channel = await client.channels.fetch(userMessage.channelId)
    if (channel === null) {
      log('debug', 'channel not found')
      return Promise.resolve()
    }

    if (channel.isSendable()) {
      const botMessage: BotMessage = {
        content: botMessageContent.message,
        reply: {
          messageReference: userMessage,
        },
      }
      return channel
        .send(botMessage)
        .catch((error) => {
          log('error', { message: 'failed to send message', detail: error })
        })
        .then(() => {
          log('debug', 'sent message')
        })
    } else {
      log('debug', 'not send message because the channel is not sendable')
      return Promise.resolve()
    }
  }
}

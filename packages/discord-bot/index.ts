import 'dotenv/config'
import { Client, Events, GatewayIntentBits, SendableChannels } from 'discord.js'
import { uploadArchive, UploadResult } from './lib/upload-archive';
import { log } from './lib/log';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, () => {
  log('info', 'AC ARCHIVE BOT Ready')
})
client.on(Events.MessageCreate, async (message) => {
  log('debug', {
    event: Events.MessageCreate,
    message: message.content,
    author: message.author.username
  })

  if (message.author.bot) {
    log('debug', 'ignore bot message')
    return
  }

  switch (message.channelId) {
    case process.env.ARCHIVE_CHANNEL:
      await uploadArchive(message)
        .then((res: UploadResult) =>
          sendMessage(message.channelId, {
            content: res.message,
            reply: {
              messageReference: message,
            }
          })
        )
        .catch((e: UploadResult) =>
          sendMessage(message.channelId, {
            content: e.message,
            reply: {
              messageReference: message,
            }
          })
        )
    default:
      log('debug', 'not handling')
      return
  }
})

client.login(process.env.DISCORD_TOKEN)

async function sendMessage(channelId: string, message: Parameters<SendableChannels['send']>[0]) {
  const channel = await client.channels.fetch(channelId)
  if (channel === null) {
    log('debug', 'channel not found')
    return Promise.resolve()
  }

  if (channel.isSendable()) {
    return channel.send(message).catch((error) => {
      log('error', { message: 'failed to send message', detail: error })
    })
  }
  else {
    log('debug', 'not send message because the channel is not sendable')
    return Promise.resolve()
  }
}
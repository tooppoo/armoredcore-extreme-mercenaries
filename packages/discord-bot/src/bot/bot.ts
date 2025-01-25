import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { uploadVideoArchive } from './lib/handler/upload-video-archive';
import { log } from './lib/log';
import { setupMessageSender } from './lib/message';

export function startBot() {
  const client = setupClient();

  client.login(process.env.DISCORD_TOKEN)
}

function setupClient() {
  const c = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  const sendMessageBuilder = setupMessageSender(c)

  c.once(Events.ClientReady, () => {
    log('info', 'AC ARCHIVE BOT Ready')
  })
  c.on(Events.MessageCreate, async (message) => {
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
      case process.env.DISCORD_VIDEO_ARCHIVE_CHANNEL:
        await uploadVideoArchive(message, sendMessageBuilder(message))
      default:
        log('debug', 'not handling')
        return
    }
  })

  return c
}

import 'dotenv/config'
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js'
import { log } from '../lib/log';
import { setupMessageSender } from './lib/message';
import { messageHandlers } from './messages';

export function startBot() {
  const client = setupClient();

  client.login(process.env.DISCORD_TOKEN)
}

function setupClient() {
  const c = applyClientSetup(
    new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    }),
    [
      setupMessageHandler,
    ]
  );

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
      log('debug', { message: 'ignore bot message' })
      return
    }

    const sendMessage = sendMessageBuilder(message)
    c.messageHandlers.forEach((messageHandler) => {
      messageHandler.handle(message, sendMessage)
    })
  })

  return c
}

const applyClientSetup = (client: Client, functions: ClientSetupFunction[]) => {
  return functions.reduce((acc, f) => f(acc), client)
}

type ClientSetupFunction = (client: Client) => Client

const setupMessageHandler: ClientSetupFunction = (client: Client): Client => {
  client.messageHandlers = new Collection();

  messageHandlers.forEach((messageHandler) => {
    client.messageHandlers.set(messageHandler.name, messageHandler)
    log('info', {
      message: `register message handler: ${messageHandler.name}`,
    })
  })

  return client
}

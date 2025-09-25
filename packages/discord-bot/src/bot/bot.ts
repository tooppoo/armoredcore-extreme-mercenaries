import 'dotenv/config'
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js'
import { log } from '../lib/log.js'
import { makeCatchesSerializable } from '../lib/error.js'
import { setupMessageSender } from './lib/message.js'
import { messageHandlers } from './messages/index.js'
import { frontRequestHandler } from './lib/front.js'
import { commands } from './commands/index.js'
import { validateEnvironmentVariables } from '../lib/env.js'

export function startBot() {
  // 起動時に必要な環境変数がすべて設定されているかチェック
  validateEnvironmentVariables()

  const client = setupClient()

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
    [setupCommandHandler, setupMessageHandler],
  )

  const buildMessageSender = setupMessageSender(c)

  c.once(Events.ClientReady, () => {
    log('info', 'AC ARCHIVE BOT Ready')
  })
  c.on(Events.MessageCreate, async (message) => {
    log('debug', {
      event: Events.MessageCreate,
      message: message.content,
      author: message.author.username,
    })

    if (message.author.bot) {
      log('debug', { message: 'ignore bot message' })
      return
    }

    const messageSender = buildMessageSender(message)
    c.messageHandlers.forEach((messageHandler) => {
      messageHandler.handle(message, frontRequestHandler(messageSender))
    })
  })

  return c
}

const applyClientSetup = (client: Client, functions: ClientSetupFunction[]) => {
  return functions.reduce((acc, f) => f(acc), client)
}

type ClientSetupFunction = (client: Client) => Client

const setupCommandHandler: ClientSetupFunction = (client: Client): Client => {
  client.commands = new Collection()

  commands.forEach((command) => {
    client.commands.set(command.data.name, command)
    log('info', {
      message: `register slash command: ${command.data.name}`,
    })
  })

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return
    }

    const command = client.commands.get(interaction.commandName)
    if (!command) {
      log('debug', {
        message: 'slash command not registered',
        commandName: interaction.commandName,
      })
      return
    }

    try {
      await command.execute(interaction)
    } catch (error) {
      log('error', {
        message: 'failed to execute slash command',
        commandName: interaction.commandName,
        detail: makeCatchesSerializable(error),
      })

      if (!interaction.isRepliable()) {
        return
      }

      const fallbackMessage = 'コマンドの実行中にエラーが発生しました'

      if (interaction.deferred) {
        if (!interaction.replied) {
          await interaction
            .editReply({ content: fallbackMessage })
            .catch((e) => log('warn', { message: 'Failed to send fallback message on editReply', detail: makeCatchesSerializable(e) }))
        } else {
          await interaction
            .followUp({ content: fallbackMessage })
            .catch((e) => log('warn', { message: 'Failed to send fallback message on followUp', detail: makeCatchesSerializable(e) }))
        }
      } else {
        await interaction
          .reply({ content: fallbackMessage })
          .catch((e) => log('warn', { message: 'Failed to send fallback message on reply', detail: makeCatchesSerializable(e) }))
      }
    }
  })

  return client
}

const setupMessageHandler: ClientSetupFunction = (client: Client): Client => {
  client.messageHandlers = new Collection()

  messageHandlers.forEach((messageHandler) => {
    client.messageHandlers.set(messageHandler.name, messageHandler)
    log('info', {
      message: `register message handler: ${messageHandler.name}`,
    })
  })

  return client
}

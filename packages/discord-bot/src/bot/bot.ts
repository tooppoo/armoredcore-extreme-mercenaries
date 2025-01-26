import 'dotenv/config'
import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from 'discord.js'
import { uploadVideoArchive } from './lib/handler/upload-video-archive';
import { log } from './lib/log';
import { setupMessageSender } from './lib/message';
import { makeCatchesSerializable } from './lib/error';
import { commands } from './commands';

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
    [setupCommands]
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
  c.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      log('debug', 'ignore non chat input command')

      return
    };
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);

      return;
    }

    log('debug', {
      message: 'Events.InteractionCreate',
      interaction: interaction.toJSON(),
    })

    try {
      await command.execute(interaction);
    } catch (error) {
      log('error', {
        message: `error while executing command ${interaction.commandName}`,
        error: makeCatchesSerializable(error),
      })

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'コマンド実行中にエラーが発生しました', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: 'コマンド実行中にエラーが発生しました', flags: MessageFlags.Ephemeral });
      }
    }
  })

  return c
}

const applyClientSetup = (client: Client, functions: ClientSetupFunction[]) => {
  return functions.reduce((acc, f) => f(acc), client)
}

type ClientSetupFunction = (client: Client) => Client
const setupCommands: ClientSetupFunction = (client: Client): Client => {
  client.commands = new Collection();

  commands.forEach((command) => {
    client.commands.set(command.data.name, command)
    log('info', {
      message: `register command: ${command.data.name}`,
    })
  })

  return client
}

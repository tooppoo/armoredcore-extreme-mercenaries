import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { uploadArchive } from './lib/upload-archive';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.once(Events.ClientReady, () => {
  console.log('AC ARCHIVE BOT Ready')
})
client.on(Events.MessageCreate, async (message) => {
  console.log({ event: Events.MessageCreate, message })

  await uploadArchive(message)
  .then((res) => {
    console.log('upload archive', res)
  })
  .catch((e: { reason: string }) => {
    console.error(e)
  })
})

client.login(process.env.DISCORD_TOKEN)

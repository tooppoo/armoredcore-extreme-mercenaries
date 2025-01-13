import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js'

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
client.on(Events.MessageCreate, (message) => {
  console.log(message)
})

client.login(process.env.DISCORD_TOKEN)

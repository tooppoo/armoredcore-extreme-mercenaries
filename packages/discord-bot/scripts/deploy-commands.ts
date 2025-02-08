import 'dotenv/config'
import { REST, Routes } from 'discord.js';
import { log } from '../src/bot/lib/log';
import { makeCatchesSerializable } from '../src/bot/lib/error';
import { commands } from '../src/bot/commands';

async function main() {
  if (commands.length === 0) {
    log('info', {
      message: 'Commands not exist, so skip command deploy.'
    })
    return
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
		log('info', {
      message: `Started refreshing ${commands.length} application (/) commands.`
    });

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        process.env.DISCORD_GUILD_ID,
      ),
			{ body: commands.map(c => c.data.toJSON()) },
		);

		log('info', {
      message: `Successfully reloaded application (/) commands.`,
      data: makeCatchesSerializable(data),
    });
	} catch (error) {
    log('error', {
      message: 'Failed to reload application (/) commands.',
      error: makeCatchesSerializable(error),
    })
	}
}

main();

import { SlashCommandBuilder } from 'discord.js';
import { log } from '../lib/log';
import type { Command } from '.';

const commandName = 'archive';
const archiveSlashCommand = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription('Archive command')
  .addSubcommand(
    (sub) => sub.setName('challenge').setDescription('チャレンジをアーカイブに登録します')
  );

export const archiveCommand: Command = {
  data: archiveSlashCommand,
  execute: async (interaction) => {
    log('debug', {
      message: interaction.toString(),
      interaction: interaction,
    })
  }
}

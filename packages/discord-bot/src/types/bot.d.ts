import type { CacheType, Client, Collection, Interaction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../bot/commands';

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>
  }
}

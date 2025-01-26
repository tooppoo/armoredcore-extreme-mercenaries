import type { Command } from 'discord.js';
import { archiveCommand } from './upload-challenge-archive';

export const commands: readonly Command[] = [
  archiveCommand,
]

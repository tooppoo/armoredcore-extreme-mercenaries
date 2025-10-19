import { archiveChallengeCommand } from './archive-challenge.js'
import { archiveVideoCommand } from './archive-video.js'
import type { Command } from './types.js'

export const commands: readonly Command[] = [
  archiveChallengeCommand,
  archiveVideoCommand,
]

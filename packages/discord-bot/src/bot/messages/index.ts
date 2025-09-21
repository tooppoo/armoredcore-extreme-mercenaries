import type { FrontRequestHandler } from '../lib/front.js'
import type { UserMessage } from '../lib/message.js'
import { uploadChallengeArchive } from './upload-challenge-archive.js'
import { uploadVideoArchive } from './upload-video-archive.js'

export type MessageHandlerFunction = (
  userMessage: UserMessage,
  frontRequest: FrontRequestHandler,
) => Promise<void>
export type MessageHandler = {
  name: string
  handle: MessageHandlerFunction
}

export const messageHandlers: readonly MessageHandler[] = [
  uploadVideoArchive,
  uploadChallengeArchive,
]

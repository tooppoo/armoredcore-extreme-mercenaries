import type { FrontRequestHandler } from '../lib/front'
import type { UserMessage } from '../lib/message'
import { uploadChallengeArchive } from './upload-challenge-archive'
import { uploadVideoArchive } from './upload-video-archive'

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

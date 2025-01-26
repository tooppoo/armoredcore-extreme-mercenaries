import type { SendMessage, UserMessage } from '../lib/message'
import { uploadVideoArchive } from './upload-video-archive'

export type MessageHandlerFunction = (userMessage: UserMessage, sendMessage: SendMessage) => Promise<void>
export type MessageHandler = {
  name: string
  handle: MessageHandlerFunction
}

export const messageHandlers: readonly MessageHandler[] = [
  uploadVideoArchive,
]

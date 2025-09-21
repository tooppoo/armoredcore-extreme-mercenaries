import { frontApi } from '../lib/front.js'
import type { MessageHandler, MessageHandlerFunction } from './index.js'
import { log } from '../../lib/log.js'

const name = 'upload-video-archive'
const handle: MessageHandlerFunction = async (userMessage, frontRequest) => {
  if (userMessage.channelId !== process.env.DISCORD_VIDEO_ARCHIVE_CHANNEL) {
    log('debug', `skip: ${name}`)
    return
  }
  log('debug', `start: ${name}`)

  const body = {
    url: userMessage.content,
    discord_user: {
      id: userMessage.author.id,
      name: userMessage.author.username,
    },
  }

  return frontRequest({
    command: () =>
      fetch(frontApi('/api/archives/video'), {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.FRONT_AUTH_UPLOAD_ARCHIVE}`,
        },
      }),
    messages: {
      success: 'アーカイブに追加しました',
      errorResponse: (errorCode) =>
        errorMessageMap[errorCode] || 'アーカイブに追加されませんでした',
      invalidResponse: 'アーカイブ追加中にエラーが発生しました',
      commandFailure: 'アーカイブ追加に失敗しました',
    },
  })
}

const errorMessageMap: Record<string, string> = {
  'unsupported-url': 'サポート外のURLなのでスキップしました',
  'duplicated-url': '既にアーカイブ済みのURLなのでスキップしました',
  'failed-get-ogp': 'アーカイブの情報を取得できませんでした',
}

export const uploadVideoArchive: MessageHandler = {
  name,
  handle,
}

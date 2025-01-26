import { frontApi, type FrontErrorResponseBody } from '../lib/front';
import { makeCatchesSerializable } from '../lib/error';
import { log } from '../lib/log';
import type { MessageHandler, MessageHandlerFunction } from '.';

const name = 'upload-video-archive'
const handle: MessageHandlerFunction = async (userMessage, sendMessage) => {
  if (userMessage.channelId !== process.env.DISCORD_VIDEO_ARCHIVE_CHANNEL) {
    return
  }

  const body = {
    url: userMessage.content,
    discord_user: {
      id: userMessage.author.id,
      name: userMessage.author.username,
    }
  }

  return fetch(frontApi('/api/archives/video'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FRONT_AUTH_UPLOAD_ARCHIVE}`,
    },
  }).then(
    async (res) => {
      log('debug', { message: `status = ${res.status}` })

      if (400 <= res.status) {
        await res.json().then((body: FrontErrorResponseBody) => {
          const message = errorMessageMap[body.code] || 'アーカイブに追加されませんでした'

          log('error', { message, body, status: res.status })

          sendMessage({ message })
        }).catch((error) => {
          log('error', {
            message: 'InvalidResponse',
            detail: JSON.stringify(makeCatchesSerializable(error)),
          })

          sendMessage({ message: 'アーカイブ追加中にエラーが発生しました' })
        })
        return
      }

      sendMessage({ message: 'アーカイブに追加しました' })
    },
    (error: unknown) => {
      log('error', {
        message: 'FailedToFetch',
        detail: JSON.stringify(makeCatchesSerializable(error)),
      })

      sendMessage({ message: 'アーカイブ追加に失敗しました' })
    }
  )
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

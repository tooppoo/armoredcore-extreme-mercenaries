import { Message, OmitPartialGroupDMChannel } from 'discord.js';
import { frontApi } from './front';

export type UploadResult = Readonly<{ message: string }>
export async function uploadArchive(
  message: OmitPartialGroupDMChannel<Message<boolean>>
): Promise<UploadResult> {
  const body = {
    url: message.content,
    discord_user: {
      id: message.author.id,
      name: message.author.username,
    }
  }

  return fetch(frontApi('/api/archives'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FRONT_AUTH_UPLOAD_ARCHIVE}`,
    },
  }).catch((error: unknown) => {
    throw {
      message: [
        'エラーが発生しました',
        JSON.stringify(error),
      ].join('\n')
    }
  }).then(async (res) => {
    if (400 < res.status) {
      const body = (await res.json()) as ErrorResponse
      const message = errorMessageMap[body.code] || [
        'アーカイブ追加に失敗しました',
        `${res.status} ${res.statusText} ${JSON.stringify(body)}`,
      ].join('\n')

      throw { message }
    }

    return { message: 'アーカイブに追加しました' }
  })
}

type ErrorResponse = Readonly<{
  code: string
  message: string
}>

const errorMessageMap: Record<string, string> = {
  'unsupported-url': 'サポート外のURLなのでスキップしました',
  'failed-get-ogp': 'アーカイブの情報を取得できませんでした',
}

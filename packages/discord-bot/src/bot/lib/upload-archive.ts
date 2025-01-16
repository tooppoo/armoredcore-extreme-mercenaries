import { Message, type OmitPartialGroupDMChannel } from 'discord.js';
import { frontApi } from './front';
import { makeCatchesSerializable } from './error';

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
        JSON.stringify(makeCatchesSerializable(error)),
      ].join('\n')
    }
  }).then(async (res) => {
    console.debug(`status = ${res.status}`)

    if (400 <= res.status) {
      const body = (await res.json().catch(async (error) => {
        throw {
          message: [
            '不正な応答です',
            JSON.stringify(makeCatchesSerializable(error)),
          ].join('\n'),
        }
      })) as ErrorResponse
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
  'duplicated-url': '既にアーカイブ済みのURLなのでスキップしました',
  'failed-get-ogp': 'アーカイブの情報を取得できませんでした',
}

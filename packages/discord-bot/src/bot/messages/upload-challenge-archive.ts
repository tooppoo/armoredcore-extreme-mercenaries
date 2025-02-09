import { frontApi } from '../lib/front';
import type { MessageHandler, MessageHandlerFunction } from '.';
import type { UserMessage } from '../lib/message';
import { log } from '../../lib/log';

const name = 'upload-challenge-archive'
const handle: MessageHandlerFunction = async (userMessage, frontRequest) => {
  if (userMessage.channelId !== process.env.DISCORD_CHALLENGE_ARCHIVE_CHANNEL) {
    log('debug', `skip: ${name}`)
    return
  }
  log('debug', `start: ${name}`)

  const body = parseMessage(userMessage);
  log('debug', { message: 'parsed message', body })

  if (body.type === 'parse-error') {
    return
  }

  return frontRequest({
    command: () => fetch(frontApi('/api/archives/challenge'), {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FRONT_AUTH_UPLOAD_ARCHIVE}`,
      },
    }),
    messages: {
      success: 'アーカイブに追加しました',
      errorResponse: (errorCode) => errorMessageMap[errorCode] || 'アーカイブに追加されませんでした',
      invalidResponse: 'アーカイブ追加中にエラーが発生しました',
      commandFailure: 'アーカイブ追加に失敗しました',
    },
  })
}

type BaseArchiveRequest = Readonly<{
  discord_user: {
    id: string
    name: string
  }
}>
type ArchiveLinkRequest = BaseArchiveRequest & Readonly<{
  type: 'link'
  title: string
  url: string
}>
type ArchiveTextRequest = BaseArchiveRequest & Readonly<{
  type: 'text'
  title: string
  text: string
}>
type ParseError = Readonly<{
  type: 'parse-error'
  message: string
  source: string
}>

function parseMessage(userMessage: UserMessage): ArchiveLinkRequest | ArchiveTextRequest | ParseError {
  const parsers = [
    tryParseAsUrl,
    tryParseAsText,
  ]
  for (const parser of parsers) {
    const result = parser(userMessage);
    if (result) {
      return result
    }
  }

  return {
    type: 'parse-error',
    message: 'パースできない形式です',
    source: userMessage.content,
  } satisfies ParseError
}

const block = '```'

function tryParseAsUrl(userMessage: UserMessage): ArchiveLinkRequest | null {
  const lines = userMessage.content.split(/\r?\n/);
  if (lines.length !== 5) {
    return null
  }
  if (!isBlock(lines)) {
    // ブロックで囲まれていない場合
    return null
  }

  const title = lines[1].trim();
  const maybeUrl = lines[3].trim();
  if (title && maybeUrl && isURL(maybeUrl)) {
    return {
      type: 'link',
      title,
      url: maybeUrl,
      discord_user: {
        id: userMessage.author.id,
        name: userMessage.author.username,
      },
    } satisfies ArchiveLinkRequest
  }

  return null
}
function tryParseAsText(userMessage: UserMessage): ArchiveTextRequest | null {
  const lines = userMessage.content.split(/\r?\n/);
  if (lines.length < 5) {
    return null
  }
  if (!isBlock(lines)) {
    // ブロックで囲まれていない場合
    return null
  }
  if (lines[2].trim() !== '') {
    // ブロック内部2行目が空行でない場合
    return null
  }

  const title = lines[1].trim();
  const text = lines.slice(3, lines.length - 1).join('\n').trim();
  if (title && text) {
    return {
      type: 'text',
      title,
      text,
      discord_user: {
        id: userMessage.author.id,
        name: userMessage.author.username,
      },
    } satisfies ArchiveTextRequest
  }

  return null
}

const errorMessageMap: Record<string, string> = {
  'unsupported-url': 'サポート外のURLなのでスキップしました',
  'duplicated-url': '既にアーカイブ済みのURLなのでスキップしました',
  'failed-get-ogp': 'URL先の情報を取得できませんでした',
}

export const uploadChallengeArchive: MessageHandler = {
  name,
  handle,
}

function isURL(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
function isBlock(lines: string[]): boolean {
  return lines[0].trim() === block && lines[lines.length - 1].trim() === block
}

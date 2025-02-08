import { frontApi } from '../lib/front';
import type { MessageHandler, MessageHandlerFunction } from '.';
import type { UserMessage } from '../lib/message';

const name = 'upload-challenge-archive'
const handle: MessageHandlerFunction = async (userMessage, frontRequest) => {
  if (userMessage.channelId !== process.env.DISCORD_CHALLENGE_ARCHIVE_CHANNEL) {
    return
  }

  const body = parseMessage(userMessage);

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
  const asUrl = tryParseAsUrl(userMessage);
  if (asUrl) {
    return asUrl
  }

  const asText = tryParseAsText(userMessage);
  if (asText) {
    return asText
  }

  return {
    type: 'parse-error',
    message: 'パースできない形式です',
    source: userMessage.content,
  } satisfies ParseError
}

function tryParseAsUrl(userMessage: UserMessage): ArchiveLinkRequest | null {
  const trimmed = userMessage.content.trim();

  if (isURL(trimmed)) {
    return {
      type: 'link',
      url: trimmed,
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
  const block = '```'
  if (lines[0].trim() !== block || lines[lines.length - 1].trim() !== block) {
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

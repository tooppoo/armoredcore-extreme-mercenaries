/**
 * カンマ区切りの文字列から許可チャンネルIDのセットを作成する
 * @param value カンマ区切りのチャンネルID文字列
 * @returns チャンネルIDのセット
 */
export function parseAllowedChannelIds(value?: string): Set<string> {
  if (!value) {
    return new Set<string>()
  }

  return new Set(
    value
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  )
}

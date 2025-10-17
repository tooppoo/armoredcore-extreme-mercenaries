export type ErrorCode =
  | 'duplicate'
  | 'unsupported'
  | 'ogp_fetch_failed'
  | 'unexpected'
  | 'missing_required_field'
  | 'invalid_url'
  | 'unauthorized'
  | 'forbidden'
  | 'bad_request'
  | 'channel_not_allowed'
  | 'unsupported_command'

const messages: Record<ErrorCode, string> = {
  duplicate: '登録済みのアーカイブなので、スキップしました',
  unsupported: 'サポート外のURLなのでスキップしました',
  ogp_fetch_failed: 'アーカイブの情報を取得できませんでした',
  unexpected: '予期しないエラーが発生しました',
  missing_required_field: '必須項目が不足しています',
  invalid_url: 'URLの形式が不正です',
  unauthorized: '認証に失敗しました',
  forbidden: '許可されていない操作です',
  bad_request: 'リクエストが不正です',
  unsupported_command: 'サポートされていないコマンドです',
  channel_not_allowed: 'このチャンネルではコマンドを使用できません。',
}

export const messageFor = (code: ErrorCode): string => messages[code]

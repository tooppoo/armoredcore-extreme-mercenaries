import { verifyKey } from 'discord-interactions'

export async function verifyRequestSignature(
  req: Request,
  env: Env,
  rawBody: string,
): Promise<boolean> {
  const signature = req.headers.get('X-Signature-Ed25519')
  const timestamp = req.headers.get('X-Signature-Timestamp')

  if (!signature || !timestamp) {
    return false
  }

  const { DISCORD_PUBLIC_KEY: publicKey } = env

  // 公開鍵が未設定の場合は検証失敗（セキュリティファースト）
  // 注: 環境変数の検証は起動時に実行されるため、ここでは到達しないはず
  if (!publicKey || publicKey.trim().length === 0) {
    return false
  }

  try {
    // discord-interactions パッケージの verifyKey を使用
    // verifyKey は文字列を期待し、内部でタイムスタンプとの結合やエンコードを行う
    const isValid = await verifyKey(rawBody, signature, timestamp, publicKey)

    // デバッグ用: 検証結果の詳細をログ出力
    if (!isValid) {
      const { logger } = await import('~/lib/observability/logger')
      logger.warn('discord_signature_verification_failed', {
        signatureLength: signature.length,
        timestampLength: timestamp.length,
        bodyLength: rawBody.length,
        publicKeyLength: publicKey.length,
      })
    }

    return isValid
  } catch (error) {
    const { logger } = await import('~/lib/observability/logger')
    const errorMessage = error instanceof Error ? error.message : 'unknown'
    logger.error('discord_signature_verification_exception', {
      error: errorMessage,
    })
    return false
  }
}

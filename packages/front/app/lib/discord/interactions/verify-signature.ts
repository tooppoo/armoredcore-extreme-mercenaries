import * as ed from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha2'

const hexToBytes = (hex: string): Uint8Array =>
  new Uint8Array((hex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16)))

// Cloudflare Workers環境でed25519を使用するためにSHA-512を初期化
// 関数内で毎回実行することで、遅延ロードされるモジュールでも確実に初期化される
const ensureEd25519Initialized = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const etc = ed.etc as any
  if (!etc.sha512Sync) {
    etc.sha512Sync = (...m: Uint8Array[]) =>
      sha512(etc.concatBytes(...m))
  }
}

export async function verifyRequestSignature(
  req: Request,
  env: Env,
  rawBody: string,
): Promise<boolean> {
  const sigHex = req.headers.get('X-Signature-Ed25519')
  const ts = req.headers.get('X-Signature-Timestamp')
  if (!sigHex || !ts) return false

  const { DISCORD_PUBLIC_KEY: publicKeyHex } = env

  // 公開鍵が未設定の場合は検証失敗（セキュリティファースト）
  // 注: 環境変数の検証は起動時に実行されるため、ここでは到達しないはず
  if (!publicKeyHex || publicKeyHex.trim().length === 0) {
    return false
  }

  const message = new TextEncoder().encode(ts + rawBody)
  const signature = hexToBytes(sigHex)
  const publicKey = hexToBytes(publicKeyHex)

  try {
    // SHA-512の初期化を確実に実行
    ensureEd25519Initialized()

    const result = await ed.verify(signature, message, publicKey)

    // デバッグ用: 検証結果の詳細をログ出力
    if (!result) {
      const { logger } = await import('~/lib/observability/logger')
      logger.warn('ed25519_verification_details', {
        signatureLength: signature.length,
        publicKeyLength: publicKey.length,
        messageLength: message.length,
        timestampLength: ts.length,
        bodyLength: rawBody.length,
      })
    }

    return result
  } catch (error) {
    const { logger } = await import('~/lib/observability/logger')
    const errorMessage = error instanceof Error ? error.message : 'unknown'
    logger.error('ed25519_verify_exception', {
      error: errorMessage,
    })
    return false
  }
}

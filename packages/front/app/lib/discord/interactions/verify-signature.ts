import * as ed from '@noble/ed25519'
import { logger } from '~/lib/observability/logger'

const hexToBytes = (hex: string): Uint8Array =>
  new Uint8Array((hex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16)))

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
  if (!publicKeyHex || publicKeyHex.trim().length === 0) {
    logger.warn(
      'DISCORD_PUBLIC_KEY is not set. Signature verification will always fail.',
    )
    return false
  }

  const message = new TextEncoder().encode(ts + rawBody)
  const signature = hexToBytes(sigHex)
  const publicKey = hexToBytes(publicKeyHex)

  try {
    return await ed.verify(signature, message, publicKey)
  } catch {
    return false
  }
}

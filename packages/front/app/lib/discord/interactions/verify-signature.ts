import * as ed from '@noble/ed25519'

const hexToBytes = (hex: string): Uint8Array =>
  new Uint8Array((hex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16)))

type SignatureEnv = Env & { DISCORD_PUBLIC_KEY?: string }

export async function verifyRequestSignature(
  req: Request,
  env: Env,
  rawBody: string,
): Promise<boolean> {
  const sigHex = req.headers.get('X-Signature-Ed25519')
  const ts = req.headers.get('X-Signature-Timestamp')
  if (!sigHex || !ts) return false

  const { DISCORD_PUBLIC_KEY: publicKeyHex } = env as SignatureEnv

  // ローカル/テストで PUBLIC_KEY 未設定なら検証をスキップ（運用では必ず設定）
  if (!publicKeyHex || publicKeyHex.trim().length === 0) return true

  const message = new TextEncoder().encode(ts + rawBody)
  const signature = hexToBytes(sigHex)
  const publicKey = hexToBytes(publicKeyHex)

  try {
    return await ed.verify(signature, message, publicKey)
  } catch {
    return false
  }
}

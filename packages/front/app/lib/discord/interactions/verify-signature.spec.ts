import { describe, it, expect, vi } from 'vitest'
import { verifyRequestSignature } from './verify-signature'
import * as discordInteractions from 'discord-interactions'

// テスト用の公開鍵（Discord形式の16進数文字列）
const TEST_PUBLIC_KEY_HEX =
  'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555'

vi.mock('discord-interactions', async () => {
  const actual =
    await vi.importActual<typeof discordInteractions>('discord-interactions')
  return {
    ...actual,
    verifyKey: vi.fn(),
  }
})

describe('verifyRequestSignature', () => {
  const mockEnv = {
    DISCORD_PUBLIC_KEY: TEST_PUBLIC_KEY_HEX,
  } as unknown as Env

  it('should return true for valid signature', async () => {
    const mockVerifyKey = vi.mocked(discordInteractions.verifyKey)
    mockVerifyKey.mockResolvedValue(true)

    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'X-Signature-Ed25519': 'abcd1234',
        'X-Signature-Timestamp': '1234567890',
      },
      body: JSON.stringify({ type: 1 }),
    })

    const rawBody = await req.text()
    const result = await verifyRequestSignature(req, mockEnv, rawBody)

    expect(result).toBe(true)
    expect(mockVerifyKey).toHaveBeenCalledOnce()
  })

  it('should return false when signature header is missing', async () => {
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'X-Signature-Timestamp': '1234567890',
      },
      body: JSON.stringify({ type: 1 }),
    })

    const rawBody = await req.text()
    const result = await verifyRequestSignature(req, mockEnv, rawBody)

    expect(result).toBe(false)
  })

  it('should return false when timestamp header is missing', async () => {
    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'X-Signature-Ed25519': 'abcd1234',
      },
      body: JSON.stringify({ type: 1 }),
    })

    const rawBody = await req.text()
    const result = await verifyRequestSignature(req, mockEnv, rawBody)

    expect(result).toBe(false)
  })

  it('should return false when public key is not set', async () => {
    const envWithoutKey = {
      DISCORD_PUBLIC_KEY: '',
    } as unknown as Env

    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'X-Signature-Ed25519': 'abcd1234',
        'X-Signature-Timestamp': '1234567890',
      },
      body: JSON.stringify({ type: 1 }),
    })

    const rawBody = await req.text()
    const result = await verifyRequestSignature(req, envWithoutKey, rawBody)

    expect(result).toBe(false)
  })

  it('should return false when verification fails', async () => {
    const mockVerifyKey = vi.mocked(discordInteractions.verifyKey)
    mockVerifyKey.mockResolvedValue(false)

    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'X-Signature-Ed25519': 'abcd1234',
        'X-Signature-Timestamp': '1234567890',
      },
      body: JSON.stringify({ type: 1 }),
    })

    const rawBody = await req.text()
    const result = await verifyRequestSignature(req, mockEnv, rawBody)

    expect(result).toBe(false)
  })

  it('should return false when discord verification throws', async () => {
    const mockVerifyKey = vi.mocked(discordInteractions.verifyKey)
    mockVerifyKey.mockRejectedValue(new Error('Invalid signature format'))

    const req = new Request('https://example.com', {
      method: 'POST',
      headers: {
        'X-Signature-Ed25519': 'invalid',
        'X-Signature-Timestamp': '1234567890',
      },
      body: JSON.stringify({ type: 1 }),
    })

    const rawBody = await req.text()
    const result = await verifyRequestSignature(req, mockEnv, rawBody)

    expect(result).toBe(false)
  })
})

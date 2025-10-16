import { describe, it, expect, vi } from 'vitest'
import { verifyRequestSignature } from './verify-signature'
import * as ed from '@noble/ed25519'

// テスト用の公開鍵（@noble/ed25519でランダム生成した固定値）
const TEST_PUBLIC_KEY_HEX =
  'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555'

vi.mock('@noble/ed25519', async () => {
  const actual = await vi.importActual<typeof ed>('@noble/ed25519')
  return {
    ...actual,
    verify: vi.fn(),
  }
})

describe('verifyRequestSignature', () => {
  const mockEnv = {
    DISCORD_PUBLIC_KEY: TEST_PUBLIC_KEY_HEX,
  } as unknown as Env

  it('should return true for valid signature', async () => {
    const mockVerify = vi.mocked(ed.verify)
    mockVerify.mockResolvedValue(true)

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
    expect(mockVerify).toHaveBeenCalledOnce()
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
    const mockVerify = vi.mocked(ed.verify)
    mockVerify.mockResolvedValue(false)

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

  it('should return false when ed25519 verification throws', async () => {
    const mockVerify = vi.mocked(ed.verify)
    mockVerify.mockRejectedValue(new Error('Invalid signature format'))

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

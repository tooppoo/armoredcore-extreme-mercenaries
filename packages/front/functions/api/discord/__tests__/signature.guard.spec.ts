import { describe, it, expect, vi } from 'vitest'
import { onRequest } from '../interactions'
import { makeCtx } from './helpers'

// 署名検証をモック化
vi.mock('~/lib/discord/interactions/verify-signature', () => ({
  verifyRequestSignature: vi.fn().mockResolvedValue(true),
}))

describe('signature & channel guards', () => {
  it('returns structured unauthorized response when signature headers are missing', async () => {
    const ctx = makeCtx({
      body: {
        type: 2,
        id: 'sig-missing',
        data: { name: 'archive-challenge', options: [] },
        member: { user: { id: 'guard-1', username: 'guard-user' } },
      },
    })
    const res = await onRequest(ctx)
    expect(res.status).toBe(401)
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { type?: number; data?: { content?: string } }
    expect(json).toEqual({ type: 4, data: { content: '認証に失敗しました' } })
  })

  it('returns 403 when executed from non-permitted channel', async () => {
    const body = {
      type: 2,
      id: 'corr-403',
      channel_id: '999',
      data: { name: 'archive-challenge', options: [] },
      member: { user: { id: 'guard-2', username: 'guard-user-2' } },
    }
    const headers = {
      'X-Signature-Ed25519': '00',
      'X-Signature-Timestamp': '0',
    }
    const env = {
      DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS: '111',
      DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS: '222',
    }
    const ctx = makeCtx({ body, headers, env })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { type?: number; data?: { content?: string } }
    expect(json).toEqual({
      type: 4,
      data: { content: 'このチャンネルではコマンドを使用できません。' },
    })
  })

  it('allows commands only when channel matches command-specific allowed list', async () => {
    const body = {
      type: 2,
      id: 'corr-union',
      channel_id: '999',
      data: { name: 'archive-challenge', options: [] },
      member: { user: { id: 'guard-3', username: 'guard-user-3' } },
    }
    const headers = {
      'X-Signature-Ed25519': '00',
      'X-Signature-Timestamp': '0',
    }
    const env = {
      DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS: '999',
      DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS: '222',
    }
    const ctx = makeCtx({ body, headers, env })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { data?: { content?: string } }
    expect(json?.data?.content ?? '').toContain('必須項目が不足しています')
  })

  it('allows archive-video only in video-specific channels', async () => {
    const body = {
      type: 2,
      id: 'corr-video',
      channel_id: '222',
      data: { name: 'archive-video', options: [] },
      member: { user: { id: 'guard-4', username: 'guard-user-4' } },
    }
    const headers = {
      'X-Signature-Ed25519': '00',
      'X-Signature-Timestamp': '0',
    }
    const env = {
      DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS: '999',
      DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS: '222',
    }
    const ctx = makeCtx({ body, headers, env })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { data?: { content?: string } }
    expect(json?.data?.content ?? '').toContain('必須項目が不足しています')
  })

  it('rejects archive-video in challenge-only channels', async () => {
    const body = {
      type: 2,
      id: 'corr-video-reject',
      channel_id: '999',
      data: { name: 'archive-video', options: [] },
      member: { user: { id: 'guard-5', username: 'guard-user-5' } },
    }
    const headers = {
      'X-Signature-Ed25519': '00',
      'X-Signature-Timestamp': '0',
    }
    const env = {
      DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS: '999',
      DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS: '222',
    }
    const ctx = makeCtx({ body, headers, env })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { type?: number; data?: { content?: string } }
    expect(json).toEqual({
      type: 4,
      data: { content: 'このチャンネルではコマンドを使用できません。' },
    })
  })

  it('rejects archive-challenge in video-only channels', async () => {
    const body = {
      type: 2,
      id: 'corr-challenge-reject',
      channel_id: '222',
      data: { name: 'archive-challenge', options: [] },
      member: { user: { id: 'guard-6', username: 'guard-user-6' } },
    }
    const headers = {
      'X-Signature-Ed25519': '00',
      'X-Signature-Timestamp': '0',
    }
    const env = {
      DISCORD_ALLOWED_CHALLENGE_ARCHIVE_CHANNEL_IDS: '999',
      DISCORD_ALLOWED_VIDEO_ARCHIVE_CHANNEL_IDS: '222',
    }
    const ctx = makeCtx({ body, headers, env })
    const res = await onRequest(ctx)
    expect(res.status).toBe(200)
    const json = (await res
      .clone()
      .json()
      .catch(() => null)) as { type?: number; data?: { content?: string } }
    expect(json).toEqual({
      type: 4,
      data: { content: 'このチャンネルではコマンドを使用できません。' },
    })
  })
})

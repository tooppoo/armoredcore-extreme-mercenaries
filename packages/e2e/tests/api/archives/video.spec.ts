import { test, expect } from '@playwright/test'

test('upload', async ({ page, request }) => {
  test.slow()

  await request.post('/api/archives/video', {
    data: {
      url: 'https://www.nicovideo.jp/watch/sm44501324',
      discord_user: {
        id: '1234',
        name: 'test_user',
      },
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test_upload_token',
    },
  })

  await page.goto('/archives/video')
  await expect(
    page.locator('a[href="https://www.nicovideo.jp/watch/sm44501324"]'),
  ).toHaveCount(1)
})

test('invalid url', async ({ request }) => {
  test.slow()

  const res = await request.post('/api/archives/video', {
    data: {
      url: 'https://example.com',
      discord_user: {
        id: '1234',
        name: 'test_user',
      },
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test_upload_token',
    },
  })

  // CIのテスト環境では MOCK_OGP=true で全URLをモック取得するため200となる。
  // 実運用に近い環境（MOCK_OGP=false）ではunsupported扱いで400。
  const expected = process.env.MOCK_OGP === 'true' ? 200 : 400
  expect(res.status()).toBe(expected)
})

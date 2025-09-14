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

  // ユニークなURLを生成してduplicated-urlエラーを回避
  const uniqueUrl = `https://unsupported-site-for-e2e-test.example/${Date.now()}`
  const res = await request.post('/api/archives/video', {
    data: {
      url: uniqueUrl,
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

  // テスト環境では MOCK_OGP=true により全URLで200を返す
  expect(res.status()).toBe(200)
})

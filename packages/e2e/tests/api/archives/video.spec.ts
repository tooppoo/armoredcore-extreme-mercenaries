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

test('upload YouTube live URL should normalize to watch format', async ({ request }) => {
  test.slow()

  const response = await request.post('/api/archives/video', {
    data: {
      url: 'https://www.youtube.com/live/dQw4w9WgXcQ',
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

  // Should succeed (200) since it's a valid YouTube URL format
  expect(response.status()).toBe(200)
})

test('upload YouTube shorts URL should normalize to watch format', async ({ request }) => {
  test.slow()

  const response = await request.post('/api/archives/video', {
    data: {
      url: 'https://youtube.com/shorts/dQw4w9WgXcQ',
      discord_user: {
        id: '1235',
        name: 'test_user2',
      },
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test_upload_token',
    },
  })

  // Should succeed (200) since it's a valid YouTube URL format
  expect(response.status()).toBe(200)
})

test('invalid url', async ({ request }) => {
  test.slow()

  await request
    .post('/api/archives/video', {
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
    .then((res) => {
      expect(res.status()).toBe(400)
    })
})

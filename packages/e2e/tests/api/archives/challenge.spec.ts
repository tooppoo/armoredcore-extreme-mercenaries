
import { test, expect } from '@playwright/test';

test('upload link', async ({ page, request }) => {
  test.slow()

  const res = await request.post('/api/archives/challenge', {
    data: {
      type: 'link',
      title: 'ヘリアンサスチャレンジ',
      url: 'https://x.com/RLF_Officer/status/1886619872047898811',
      discord_user: {
        id: '1234',
        name: 'test_user',
      }
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test_upload_token',
    },
  })

  await page.goto('/archives/challenge');

  await expect(page.getByRole('table')).toContainText('ヘリアンサスチャレンジ');
  await expect(
    page.locator('a[href="https://x.com/RLF_Officer/status/1886619872047898811"]')
  ).toHaveCount(1);
});

test('upload text', async ({ page, request }) => {
  test.slow()

  await request.post('/api/archives/challenge', {
    data: {
      type: 'text',
      title: 'テストチャレンジ',
      text: ['TEST', 'TEST1234', 'TEST12345678'].join('\n'),
      discord_user: {
        id: '1234',
        name: 'test_user',
      }
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test_upload_token',
    },
  })

  await page.goto('/archives/challenge');

  await expect(page.getByRole('table')).toContainText('テストチャレンジ');
});

test('(youtu.be) invalid url', async ({ page, request }) => {
  test.slow()

  await request.post('/api/archives/challenge', {
    data: {
      type: 'link',
      url: 'https://youtu.be/0Zg7WS2Q0NU',
      discord_user: {
        id: '1234',
        name: 'test_user',
      }
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test_upload_token',
    },
  })
  .then((res) => {
    expect(res.status()).toBe(400)
  })
});

test('(youtube) invalid url', async ({ page, request }) => {
  test.slow()

  await request.post('/api/archives/challenge', {
    data: {
      type: 'link',
      url: 'https://www.youtube.com/watch?v=j--a4kMFQ-k',
      discord_user: {
        id: '1234',
        name: 'test_user',
      }
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test_upload_token',
    },
  })
  .then((res) => {
    expect(res.status()).toBe(400)
  })
});

test('(example.com) invalid url', async ({ page, request }) => {
  test.slow()

  await request.post('/api/archives/challenge', {
    data: {
      type: 'link',
      url: 'https://example.com',
      discord_user: {
        id: '1234',
        name: 'test_user',
      }
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test_upload_token',
    },
  })
  .then((res) => {
    expect(res.status()).toBe(400)
  })
});


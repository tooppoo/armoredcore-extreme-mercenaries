
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
  expect(page.content).toContain('ヘリアンサスチャレンジ');
});

test('upload text', async ({ page, request }) => {
  test.slow()

  const res = await request.post('/api/archives/challenge', {
    data: {
      type: 'text',
      title: 'ヘリアンサスチャレンジ',
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
  expect(page.content).toContain('ヘリアンサスチャレンジ');
  expect(page.content).toContain('TEST12345678');
});


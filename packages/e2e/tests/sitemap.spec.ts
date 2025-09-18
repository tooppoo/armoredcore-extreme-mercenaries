import { test, expect } from '@playwright/test'

const paths: string[] = [
  '/sitemap.xml',
  '/sitemap.core.xml',
  '/sitemap.updates.xml',
  '/sitemap.challenge.xml',
  '/sitemap.video.xml',
]

test.describe('sitemap endpoints', () => {
  for (const p of paths) {
    test(`GET ${p} returns 200`, async ({ request }) => {
      const res = await request.get(p)
      expect(res.status()).toBe(200)
    })
  }
})

test.describe('child sitemap has non-zero urls', () => {
  test('GET /sitemap.updates.xml has at least 1 url', async ({ request }) => {
    const res = await request.get('/sitemap.updates.xml')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body.includes('<url>')).toBeTruthy()
  })

  test('GET /sitemap.challenge.xml has at least 1 url', async ({ request }) => {
    // ensure at least one challenge archive exists (text upload avoids OGP)
    await request.post('/api/archives/challenge', {
      data: {
        type: 'text',
        title: `e2e-challenge-${Date.now()}`,
        text: 'E2E sitemap seed',
        discord_user: { id: 'e2e', name: 'e2e' },
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test_upload_token',
      },
    })

    const res = await request.get('/sitemap.challenge.xml')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body.includes('<url>')).toBeTruthy()
  })

  test('GET /sitemap.video.xml has at least 1 url', async ({ request }) => {
    // ensure at least one video archive exists (mock OGP in test env)
    await request.post('/api/archives/video', {
      data: {
        url: `https://example.com/e2e-video?ts=${Date.now()}`,
        discord_user: { id: 'e2e', name: 'e2e' },
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test_upload_token',
      },
    })

    const res = await request.get('/sitemap.video.xml')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body.includes('<url>')).toBeTruthy()
  })
})

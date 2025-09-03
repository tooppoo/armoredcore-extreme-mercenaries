import { test, expect } from '@playwright/test'

test('sitemap endpoints return 200', async ({ request }) => {
  const paths = [
    '/sitemap.xml',
    '/sitemap.core.xml',
    '/sitemap.challenge.xml',
    '/sitemap.video.xml',
  ]

  for (const p of paths) {
    const res = await request.get(p)
    expect(res.status(), `${p} should be 200`).toBe(200)
  }
})


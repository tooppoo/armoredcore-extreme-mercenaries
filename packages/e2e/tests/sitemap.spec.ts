import { test, expect } from '@playwright/test'

const paths: string[] = [
  '/sitemap.xml',
  '/sitemap.core.xml',
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

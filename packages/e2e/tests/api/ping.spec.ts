import { test, expect } from '@playwright/test'

test('GET /api/ping returns 200', async ({ request }) => {
  const res = await request.get('/api/ping')
  expect(res.status()).toBe(200)
})

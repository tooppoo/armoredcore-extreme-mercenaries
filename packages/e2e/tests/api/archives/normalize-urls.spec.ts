import { test, expect } from '@playwright/test'

test('normalize existing URLs in database', async ({ request }) => {
  test.slow()

  // First, add some test data with URLs that need normalization
  // Note: In a real scenario, there would already be data in the database

  // Test the normalization endpoint
  const response = await request.post('/api/archives/normalize-urls', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test_upload_token',
    },
  })

  expect(response.ok()).toBeTruthy()

  const result = await response.json()

  // Check that the response has the expected structure
  expect(result).toHaveProperty('totalArchives')
  expect(result).toHaveProperty('processedCount')
  expect(result).toHaveProperty('updatedCount')
  expect(typeof result.totalArchives).toBe('number')
  expect(typeof result.processedCount).toBe('number')
  expect(typeof result.updatedCount).toBe('number')

  // processedCount should equal totalArchives
  expect(result.processedCount).toBe(result.totalArchives)

  // updatedCount should be <= processedCount
  expect(result.updatedCount).toBeLessThanOrEqual(result.processedCount)
})

test('normalize-urls requires authentication', async ({ request }) => {
  const response = await request.post('/api/archives/normalize-urls', {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Server returns 401 Unauthorized with WWW-Authenticate header
  expect(response.status()).toBe(401)

  const result = await response.json()
  expect(result.error.code).toBe('token-required')
})

test('normalize-urls rejects invalid token', async ({ request }) => {
  const response = await request.post('/api/archives/normalize-urls', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer invalid_token',
    },
  })

  // Server returns 401 Unauthorized for invalid token
  expect(response.status()).toBe(401)

  const result = await response.json()
  expect(result.error.code).toBe('invalid-token')
})

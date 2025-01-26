import { describe, it, expect } from 'vitest'
import { requireAuthToken } from './require-auth-token.server'
import { AppLoadContext } from 'react-router'

describe('requireAuthToken', () => {
  const mockContext = {
    cloudflare: {
      env: {
        AUTH_UPLOAD_ARCHIVE: 'test_upload_token',
      },
    },
  } as AppLoadContext

  it('should throw as unauthorized if no token is provided', async () => {
    const mockRequest = new Request('http://example.com', {
      headers: {},
    })

    await expect(async () => requireAuthToken({ request: mockRequest, context: mockContext }))
      .rejects.toBeInstanceOf(Response)
    await expect(async () => requireAuthToken({ request: mockRequest, context: mockContext }))
      .rejects.toHaveProperty('status', 401)
  })

  it('should throw as unauthorized if incorrect token is provided', async () => {
    const mockRequest = new Request('http://example.com', {
      headers: {
        Authorization: 'Bearer wrong_token',
      },
    })

    await expect(async () => requireAuthToken({ request: mockRequest, context: mockContext }))
      .rejects.toBeInstanceOf(Response)
    await expect(async () => requireAuthToken({ request: mockRequest, context: mockContext }))
      .rejects.toHaveProperty('status', 401)
  })

  it('should not throw if correct token is provided', () => {
    const mockRequest = new Request('http://example.com', {
      headers: {
        Authorization: 'Bearer test_upload_token',
      },
    })

    expect(() => requireAuthToken({ request: mockRequest, context: mockContext }))
      .not.toThrow()
  })
})
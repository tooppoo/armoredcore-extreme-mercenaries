import { describe, it, expect } from 'vitest'
import { handleZodError, parseJson } from './parser.server'
import { ZodError } from 'zod'

describe('parseJson', () => {
  it('should not throw valid json request', async () => {
    const mockRequest = new Request('http://example.com', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    })

    await expect(parseJson(mockRequest)).resolves.toEqual({ data: 'test' })
  })

  it('should throw as bad-request if body is invalid JSON', async () => {
    const mockRequest = new Request('http://example.com', {
      method: 'POST',
      body: '{ data: "test" }',
    })

    await expect(parseJson(mockRequest)).rejects.toBeInstanceOf(Response)
    await expect(parseJson(mockRequest)).rejects.toHaveProperty('status', 400)
  })
})

describe('handleZodError', () => {
  it('should throw as bad-request with the given error details', async () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'undefined',
        path: ['field'],
        message: 'field is required',
      },
    ])

    await expect(async () => handleZodError(zodError)).rejects.toHaveProperty(
      'status',
      400,
    )
  })
})

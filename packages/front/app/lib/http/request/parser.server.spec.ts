import { describe, it, expect } from 'vitest'
import { handleZodError, parseJson } from './parser.server'
import { z } from 'zod'

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
    const schema = z.object({ field: z.string() })
    const result = schema.safeParse({})
    if (result.success) throw new Error('Expected schema validation to fail')

    await expect(async () => handleZodError(result.error)).rejects.toHaveProperty(
      'status',
      400,
    )
  })
})

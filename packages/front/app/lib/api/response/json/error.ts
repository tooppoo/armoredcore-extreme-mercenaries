import { makeCatchesSerializable } from '~/lib/error'

export const badRequest = errorResponse(400, 'Bad Request');
export const unauthorized = errorResponse(401, 'Unauthorized')
export const forbidden = errorResponse(403, 'Forbidden')
export const notFound = errorResponse(404, 'Not Found')
export const internalServerError = errorResponse(500, 'Internal Server Error')

export const unknownError = (error: unknown) => internalServerError({
  code: 'unknownError',
  message: error instanceof Error ? error.message : makeCatchesSerializable(error),
})

function errorResponse(status: number, statusText: string) {
  return <T extends object>(data: T | null, init: ResponseInit = {}) => Response.json(
    { ...(data || {}), code: status, message: statusText },
    {
      ...init,
      status,
      statusText,
    }
  )
}

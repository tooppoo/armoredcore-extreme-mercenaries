import { ErrorData, makeCatchesSerializable } from '~/lib/error'

export const badRequest = errorResponse(400, 'Bad Request')
export const unauthorized = errorResponse(401, 'Unauthorized')
export const forbidden = errorResponse(403, 'Forbidden')
export const notFound = errorResponse(404, 'Not Found')
export const internalServerError = errorResponse(500, 'Internal Server Error')

export const unknownError = (error: unknown) =>
  internalServerError({
    code: 'unknownError',
    message: 'An unknown error occurred',
    detail: makeCatchesSerializable(error),
  })

function errorResponse(status: number, statusText: string) {
  return (data: ErrorData | null, init: ResponseInit = {}) =>
    Response.json(data, {
      ...init,
      status,
      statusText,
    })
}

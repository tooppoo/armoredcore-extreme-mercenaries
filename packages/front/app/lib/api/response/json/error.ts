import { makeCatchesSerializable } from '~/lib/error'

export const badRequest = (data: object | null, init: ResponseInit = {}) => Response.json(data, {
  ...init,
  status: 400,
  statusText: 'Bad Request',
})
export const unauthorized = (data: object | null, init: ResponseInit = {}) => Response.json(data, {
  ...init,
  status: 401,
  statusText: 'Unauthorized',
})
export const forbidden = (data: object | null, init: ResponseInit = {}) => Response.json(data, {
  ...init,
  status: 403,
  statusText: 'Forbidden',
})
export const notFound = (data: object | null, init: ResponseInit = {}) => Response.json(data, {
  ...init,
  status: 404,
  statusText: 'Not Found',
})

export const internalServerError = (data: object | null, init: ResponseInit = {}) => Response.json(data, {
  ...init,
  status: 500,
  statusText: 'Internal Server Error',
})
export const unknownError = (error: unknown) => internalServerError({
  code: 'unknownError',
  message: error instanceof Error ? error.message : makeCatchesSerializable(error),
})

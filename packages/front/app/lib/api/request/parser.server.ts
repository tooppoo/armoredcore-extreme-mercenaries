import { ZodError } from 'zod'
import { badRequest } from '~/lib/api/response/json/error.server'
import { makeCatchesSerializable } from '~/lib/error'

export async function parseJson<R extends Request>(request: R): Promise<unknown> {
  return request.json().catch((e) => {
    const error = makeCatchesSerializable(e)
    console.error({ message: 'request is invalid format', error })

    throw badRequest({ error })
  })
}

export function handleZodError(error: ZodError): never {
  console.error({
    message: 'request data is invalid',
    error: error.errors,
  })

  throw badRequest({
    error: error.errors,
  })
}

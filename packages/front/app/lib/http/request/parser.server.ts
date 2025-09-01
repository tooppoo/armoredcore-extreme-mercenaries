import type { z, ZodError } from 'zod'
import { badRequest } from '~/lib/http/response/json/error.server'
import { makeCatchesSerializable } from '~/lib/error'

export async function parseJson<R extends Request>(
  request: R,
): Promise<unknown> {
  return request.json().catch((e) => {
    const error = makeCatchesSerializable(e)
    console.error({ message: 'request is invalid format', error })

    throw badRequest({
      code: 'invalid-json',
      message: 'Request body is not valid JSON',
      detail: error,
    })
  })
}

export function handleZodError(error: ZodError): never {
  console.error({
    message: 'request data is invalid',
    error: error.issues,
  })

  throw badRequest({
    code: 'invalid-body-scheme',
    message: 'Request body does not match the expected scheme',
    detail: error.issues,
  })
}

export function parseQuery<S extends z.ZodTypeAny>(
  request: Request,
  scheme: S,
): z.infer<S> {
  const url = new URL(request.url)
  const search = url.searchParams
  const query = Object.fromEntries(search.entries())
  return scheme.parse(query)
}

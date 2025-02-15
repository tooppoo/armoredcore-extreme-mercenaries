import { AppLoadContext } from 'react-router'
import {
  invalidToken,
  tokenRequired,
} from '~/lib/http/response/json/auth.server'

type RequireAuthTokenArgs<R extends Request> = Readonly<{
  request: R
  context: AppLoadContext
}>
export function requireAuthToken<R extends Request>({
  request,
  context,
}: RequireAuthTokenArgs<R>): void {
  const auth = request.headers.get('Authorization')
  const token = auth?.replace('Bearer ', '')

  if (!token) {
    throw tokenRequired({
      code: 'token-required',
      message: 'auth token is required',
      detail: null,
    })
  }
  if (token !== context.cloudflare.env.AUTH_UPLOAD_ARCHIVE) {
    throw invalidToken({
      code: 'invalid-token',
      message: 'auth token is invalid',
      detail: null,
    })
  }
}

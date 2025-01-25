import { AppLoadContext } from 'react-router'
import { invalidToken, tokenRequired } from '~/lib/api/response/json/auth.server'

type RequireAuthTokenArgs<R extends Request> = Readonly<{
  request: R,
  context: AppLoadContext
}>
export function requireAuthToken<R extends Request>({
  request,
  context
}: RequireAuthTokenArgs<R>): void {
  const auth = request.headers.get('Authorization')
  const token = auth?.replace('Bearer ', '')

  if (!token) {
    throw tokenRequired({ cause: 'token is required' })
  }
  if (token !== context.cloudflare.env.AUTH_UPLOAD_ARCHIVE) {
    throw invalidToken({ cause: 'invalid token' })
  }
}
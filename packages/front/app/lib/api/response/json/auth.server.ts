import { unauthorized } from '~/lib/api/response/json/error.server'

export const successWithoutToken = <T extends object>(data: T | null) => Response.json(data, {
  status: 200,
  headers: {
    'WWW-Authenticate': 'Bearer realm=""',
  },
})

export const tokenRequired = badRequestWithToken('token_required')
export const invalidToken = badRequestWithToken('invalid_token')

function badRequestWithToken(error: string) {
  return <T extends object>(data: T | null) => unauthorized(data, {
    headers: {
      'WWW-Authenticate': `Bearer error="${error}"`,
    },
  })
}

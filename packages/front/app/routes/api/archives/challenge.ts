import { forbidden } from '~/lib/api/response/json/error.server'
import type { Route } from './+types/challenge'
import { requireAuthToken } from '~/lib/api/request/require-auth-token.server'
import { SitemapFunction } from 'remix-sitemap'
import { serverOnly$ } from 'vite-env-only/macros'

export const action = (args: Route.ActionArgs) => {
  requireAuthToken(args)

  switch (args.request.method.toUpperCase()) {
    default:
      throw forbidden(null)
  }
}

export const sitemap = serverOnly$<SitemapFunction>(() => ({
  exclude: true
}))

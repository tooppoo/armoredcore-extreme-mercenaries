import { AppLoadContext } from 'react-router'
import { getDB } from './app/db/driver.server'
import { PlatformProxy } from 'wrangler'

type Cloudflare = Omit<PlatformProxy<Env>, 'dispose'>

declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: Cloudflare
  }
}

// https://remix-docs-ja.techtalk.jp/guides/vite#%E3%83%AD%E3%83%BC%E3%83%89%E3%82%B3%E3%83%B3%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%E3%81%AE%E6%8B%A1%E5%BC%B5
type GetLoadContext = (args: {
  request: Request
  context: { cloudflare: Cloudflare }
}) => AppLoadContext

export const getLoadContext: GetLoadContext = ({ context }) =>
  ({
    ...context,
    db: getDB(context.cloudflare.env),
  }) as AppLoadContext

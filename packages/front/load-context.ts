import { AppLoadContext } from '@remix-run/cloudflare';
import { type PlatformProxy } from "wrangler";
import { Database, getDB } from './app/db/driver.server';

type Cloudflare = Omit<PlatformProxy<Env>, "dispose">;

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
    db: Database
  }
}

// https://remix-docs-ja.techtalk.jp/guides/vite#%E3%83%AD%E3%83%BC%E3%83%89%E3%82%B3%E3%83%B3%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%E3%81%AE%E6%8B%A1%E5%BC%B5
type GetLoadContext = (args: {
  request: Request;
  context: { cloudflare: Cloudflare };
}) => AppLoadContext;

export const getLoadContext: GetLoadContext = ({ context }) => ({
  ...context,
  db: getDB(context.cloudflare.env),
})

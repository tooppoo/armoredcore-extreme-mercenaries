import { GetLoadContextFunction } from '@remix-run/cloudflare-pages';
import { type PlatformProxy } from "wrangler";
import { Database, getDB } from '~/db/driver.server';

type Cloudflare = Omit<PlatformProxy<Env>, "dispose">;

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
    db: Database
  }
}

export const getLoadContext: GetLoadContextFunction<Env> = async ({ context }) => {
  return {
    ...context,
    cloudflare: context.cloudflare as Cloudflare,
    db: getDB(context.cloudflare.env),
  }
}

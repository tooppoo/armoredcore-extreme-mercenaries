import { createCookieSessionStorage, LoaderFunctionArgs } from "@remix-run/node";

let storage: (ReturnType<typeof createCookieSessionStorage>) | null = null

export function getSessionStorage({ context }: Pick<LoaderFunctionArgs, 'context'>) {
  if (!storage) {
    storage = createCookieSessionStorage({
      cookie: {
        name: "_session",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 3, // 3days
        httpOnly: true,
        secrets: context.cloudflare.env.SESSION_SECRETS.split(','),
        secure: context.cloudflare.env.APP_ENV === "production",
      },
    });
  }

  return storage
}

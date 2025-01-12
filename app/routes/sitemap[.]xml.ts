
import { generateSitemap } from "@nasa-gcn/remix-seo";
import { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { origin } from '~/lib/constants';

export async function loader({ request }: LoaderFunctionArgs) {
  // https://github.com/nasa-gcn/remix-seo/issues/7#issuecomment-1902815406
  const build = await (
    import.meta.env.DEV
    ? import("../../build/server/index.js")
    : import(
      /* @vite-ignore */
      import.meta.resolve("../../build/server/index.js"
    )))

  return generateSitemap(request, build.routes, {
    siteUrl: origin,
  })
}

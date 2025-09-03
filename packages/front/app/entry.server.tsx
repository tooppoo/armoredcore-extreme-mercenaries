/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import { AppLoadContext, EntryContext, ServerRouter } from 'react-router'
import { isbot } from 'isbot'
import { renderToReadableStream } from 'react-dom/server'
import { createSitemapGenerator } from 'remix-sitemap'
import { origin } from '~/lib/constants'

const ABORT_DELAY = 5000

const { isSitemapUrl, sitemap } = createSitemapGenerator({
  siteUrl: origin,
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [{ allow: '/', disallow: '/api', userAgent: '*' }],
  },
  // configure other things here
})

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  entryContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: AppLoadContext,
) {
  if (isSitemapUrl(request)) {
    // Cast entryContext to the type expected by sitemap's second parameter
    return await sitemap(
      request,
      entryContext as unknown as Parameters<typeof sitemap>[1],
    )
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ABORT_DELAY)

  const body = await renderToReadableStream(
    <ServerRouter context={entryContext} url={request.url} />,
    {
      signal: controller.signal,
      onError(error: unknown) {
        if (!controller.signal.aborted) {
          // Log streaming rendering errors from inside the shell
          console.error(error)
        }
        responseStatusCode = 500
      },
    },
  )

  body.allReady.then(() => clearTimeout(timeoutId))

  if (isbot(request.headers.get('user-agent') || '')) {
    await body.allReady
  }

  responseHeaders.set('Content-Type', 'text/html')
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}

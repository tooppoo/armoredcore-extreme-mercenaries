import {
  Link,
  Links,
  LinksFunction,
  type Location,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
  useLocation,
  useNavigation,
} from 'react-router'
import type { BreadcrumbItem } from './types/breadcrumb'
import { Breadcrumbs } from './lib/utils/components/Breadcrumbs'
import { Spinner } from './lib/utils/components/loading'
import { generateFooterLinks } from './lib/site/core-pages'

import './tailwind.css'
import 'highlight.js/styles/github.min.css'

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300&display=swap',
  },
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: '/favicon/apple-touch-icon.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/favicon/favicon-32x32.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/favicon/favicon-16x16.png',
  },
  { rel: 'manifest', href: '/manifest.json' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="p-5">
        <header className="flex justify-center items-center">
          <h1 className="text-center">
            ARMORED CORE
            <br />
            EXTREME MERCENARIES
            <br />
            <br />
            アーマードコア やりこみ攻略コミュニティ
          </h1>
        </header>
        <hr className="my-4" />
        <article className="mx-auto w-full">{children}</article>
        <hr className="my-4" />
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

function Footer() {
  const location = useLocation()
  const footerLinks = generateFooterLinks(location.pathname)

  // TOPリンクとその他のリンクを分離
  const topLink = footerLinks.find((link) => link.href === '/')
  const otherLinks = footerLinks.filter((link) => link.href !== '/')

  return (
    <footer>
      {topLink && (
        <>
          <div className="flex items-center justify-center text-lg">
            <Link to={topLink.href} aria-current={topLink.ariaCurrent}>
              {topLink.text}
            </Link>
          </div>
          <div className="my-3"></div>
        </>
      )}
      <div className="flex items-center justify-center">
        {otherLinks.map((link) => (
          <Link
            to={link.href}
            key={link.href}
            className="mx-2 text-md"
            aria-current={link.ariaCurrent}
          >
            {link.text}
          </Link>
        ))}
      </div>
      <div className="my-3"></div>
      <div className="flex flex-col items-end justify-end text-xs text-gray-500">
        <div>version: {import.meta.env.VITE_GIT_HASH ?? '-'}</div>
        <div>
          maintained by&nbsp;
          <Link to="https://x.com/Philomagi">Philomagi</Link>
        </div>
      </div>
    </footer>
  )
}

type MatchData = {
  breadcrumbTitle?: string
}

type MatchHandle = {
  breadcrumb?: string | ((params: Record<string, string>) => string) | 'hidden'
  layout?: 'default' | 'wide'
}

type RouteMatch = {
  id: string
  pathname?: string
  params: Record<string, string>
  data?: MatchData
  handle?: MatchHandle
}

function hasBreadcrumbTitle(data: unknown): data is MatchData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'breadcrumbTitle' in data &&
    typeof (data as MatchData).breadcrumbTitle === 'string'
  )
}

export default function App() {
  const matches = useMatches() as RouteMatch[]
  const location = useLocation()
  const navigation = useNavigation()

  const breadcrumbItems = buildBreadcrumbItems(matches, location)
  const isWide = matches.some(
    (m) => (m.handle as MatchHandle | undefined)?.layout === 'wide',
  )
  const containerClass = isWide
    ? 'max-w-screen-2xl mx-auto'
    : 'max-w-3xl mx-auto'

  const isLoading = navigation.state === 'loading'

  return (
    <div className={containerClass}>
      <Breadcrumbs items={breadcrumbItems} />
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full bg-white/80 dark:bg-gray-950/80 flex items-center justify-center z-50">
          <Spinner />
        </div>
      )}
      <Outlet />
    </div>
  )
}

function buildBreadcrumbItems(
  matches: RouteMatch[],
  location: Location,
): BreadcrumbItem[] {
  function fallbackPathForBreadcrumb(
    match: RouteMatch,
    currentPathname: string,
  ): string {
    // For root index route, return root path
    if (match.id === 'routes/index') {
      return '/'
    }

    // Use existing pathname if available
    if (match.pathname) {
      return match.pathname
    }

    // Extract from current pathname by route depth
    const pathSegments = currentPathname.split('/').filter(Boolean)
    const routeSegments = match.id.split('/').filter((s) => s !== 'index')

    if (routeSegments.length <= pathSegments.length) {
      return '/' + pathSegments.slice(0, routeSegments.length).join('/')
    }

    return currentPathname
  }

  const breadcrumbItems: BreadcrumbItem[] = matches
    .map((m) => {
      if (m.handle?.breadcrumb === 'hidden') return null

      // Determine URL for each match
      let url = m.pathname
      if (!url) {
        url = fallbackPathForBreadcrumb(m, location.pathname)
      }

      // Get breadcrumb name
      let name = ''

      // First try loader data breadcrumbTitle (for dynamic content)
      if (hasBreadcrumbTitle(m.data)) {
        name = m.data.breadcrumbTitle ?? ''
      }
      // Then try handle breadcrumb (for static routes)
      else if (m.handle?.breadcrumb) {
        if (typeof m.handle.breadcrumb === 'function') {
          name = m.handle.breadcrumb(m.params)
        } else if (typeof m.handle.breadcrumb === 'string') {
          name = m.handle.breadcrumb
        }
      }

      // Only include if we have both name and url
      if (!name || !url) return null
      return { name, url }
    })
    .filter((it): it is BreadcrumbItem => it !== null)

  // Build final breadcrumb trail starting with TOP
  const items: BreadcrumbItem[] = []

  // Add TOP if not on home page and not already included
  if (
    location.pathname !== '/' &&
    !breadcrumbItems.some((item) => item.url === '/')
  ) {
    items.push({ name: 'TOP', url: '/' })
  }

  // Add all other breadcrumbs
  items.push(...breadcrumbItems)

  return items
}

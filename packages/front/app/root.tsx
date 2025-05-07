import type { LinksFunction } from 'react-router'
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'

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
        <article className="max-w-3xl mx-auto">{children}</article>
        <hr className="my-4" />
        <footer>
          <div className="flex items-center justify-center text-lg">
            <Link to="/">TOP</Link>
          </div>
          <div className="my-3"></div>
          <div className="flex items-center justify-center">
            {footerLinks.map((link) => (
              <Link to={link.href} key={link.href} className="mx-2 text-md">
                {link.text}
              </Link>
            ))}
          </div>
          <div className="my-3"></div>
          <div className="flex items-end justify-end">
            maintained by&nbsp;
            <Link to="https://x.com/Philomagi">Philomagi</Link>
          </div>
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

const footerLinks = [
  { href: '/rule', text: '利用規約' },
  { href: '/penalties', text: '罰則規定' },
  { href: '/updates', text: '更新履歴' },
  { href: '/archives', text: 'アーカイブ' },
]

export default function App() {
  return <Outlet />
}

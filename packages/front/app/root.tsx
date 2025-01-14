import type { LinksFunction } from "@remix-run/cloudflare";
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300&display=swap',
  },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/favicon/apple-touch-icon.png" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon/favicon-16x16.png" },
  { rel: "manifest", href: '/manifest.json' },
];

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
            ARMORED CORE<br/>
            EXTREME MERCENARIES
          </h1>
        </header>
        <div className="my-4 border-b"></div>
        <article>
          {children}
        </article>
        <div className="my-4 border-b"></div>
        <footer>
          <div className="flex items-center justify-center text-lg">
            <Link to='/'>TOP</Link>
          </div>
          <div className="my-1"></div>
          <div className="flex items-end justify-end">
            maintained by&nbsp; 
            <a href="https://x.com/Philomagi">Philomagi</a>
          </div>
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

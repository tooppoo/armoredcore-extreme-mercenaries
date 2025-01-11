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
  }
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
      <body>
        <header className="flex justify-center items-center py-3">
          <h1 className="text-center">
            ARMORED CORE<br/>
            EXTREME MERCENARIES
          </h1>
        </header>
        {children}
        <footer className="py-3">
          <div className="flex items-center justify-center text-xs">
            <Link to='/'>TOP</Link>
          </div>
          <div className="my-1"></div>
          <div className="flex items-end justify-end text-xs">
            This document is maintained on&nbsp;
            <a href="https://github.com/tooppoo/armoredcore-extreme-mercenaries">GitHub</a>
            &nbsp;by&nbsp; 
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

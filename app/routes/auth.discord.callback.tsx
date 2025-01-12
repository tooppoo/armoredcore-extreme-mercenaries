import type { LoaderFunction } from "@remix-run/node";
import { type SitemapFunction } from 'remix-sitemap';
import { getAuthentication } from "~/lib/auth/authentication.server";

export const sitemap: SitemapFunction = () => ({
  exclude: true
})

export const loader: LoaderFunction = ({ request, context }) => {
  return getAuthentication({ context }).authenticate("discord", request, {
    successRedirect: "/archives/upload",
    failureRedirect: "/auth/error",
  });
};

import { MetaFunction } from '@remix-run/cloudflare';
import { origin, siteName } from '~/lib/constants';

type Meta = ReturnType<MetaFunction>

export type BuildMetaArgs = Readonly<{
  title: string
  description: string
  pathname: string
}>
export function buildMeta(args: BuildMetaArgs): Meta {
  const url = origin + args.pathname

  return [
    ...title(args.title),
    ...description(args.description),
    ...jsonLd({
      ...args,
      url,
    }),
    ...buildUrl(url),
    { name: 'og:type', content: 'website' },
  ]
}

function title(s: string): Meta {
  return [
    { title: _title(s) },
    { name: 'og:title', content: _title(s) },
    { name: 'og:site_name', content: siteName },
  ]
}
function _title(s: string): string {
  return `${s} | ${siteName}`
}

function description(text: string): Meta {
  return [
    { name: 'description', content: text },
    { name: 'og:description', content: text },
  ]
}

type JsonLdArgs = Readonly<{
  title: string
  description: string
  url: string
}>
function jsonLd({ title, description, url }: JsonLdArgs): Meta {
  return [
    {
      "script:ld+json": {
        "@context":"https://schema.org",
        "@type":"WebSite",
        description,
        "headline": title,
        "name":"ARMORED CORE EXTREME MERCENARIES",
        url,
      },
    },
  ]
}

function buildUrl(url: string): Meta {
  return [
    { name: 'og:url', content: url },
    { tagName: 'link', rel: 'canonical', href: url },
  ]
}
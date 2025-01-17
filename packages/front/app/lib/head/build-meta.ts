import { MetaFunction } from '@remix-run/cloudflare';
import { cacheKey, origin, siteName } from '~/lib/constants';

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
    { property: 'og:site_name', content: siteName },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: `https://philomagi.dev/ogp-full.jpg?c=${cacheKey}` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:creator', content: '@Philomagi' },
  ]
}

export const unofficialServer = `フロム・ソフトウェア開発のゲーム 「アーマードコア」シリーズの非公式discordサーバー「${siteName}」`

function title(s: string): Meta {
  return [
    { title: _title(s) },
    { property: 'og:title', content: _title(s) },
  ]
}
function _title(s: string): string {
  return `${s} | ${siteName}`
}

function description(text: string): Meta {
  return [
    { name: 'description', content: text },
    { property: 'og:description', content: text },
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
        "name": siteName,
        url,
      },
    },
  ]
}

function buildUrl(url: string): Meta {
  return [
    { property: 'og:url', content: url },
    { tagName: 'link', rel: 'canonical', href: url },
  ]
}
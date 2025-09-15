import {
  type RouteConfig,
  route,
  index,
  prefix,
} from '@react-router/dev/routes'

export default [
  index('./routes/index.tsx'),
  route('rule', './routes/rule.tsx'),
  route('penalties', './routes/penalties.tsx'),
  // Sitemaps (index + children)
  route('sitemap.xml', './routes/sitemap.xml.ts'),
  route('sitemap.core.xml', './routes/sitemap.core.xml.ts'),
  route('sitemap.challenge.xml', './routes/sitemap.challenge.xml.ts'),
  route('sitemap.video.xml', './routes/sitemap.video.xml.ts'),

  route('updates', './routes/updates/default.tsx', [
    index('./routes/updates/list.tsx'),
    route(':id', './routes/updates/detail.tsx'),
  ]),
  route('archives', './routes/archives/default.tsx', [
    index('./routes/archives/index.tsx'),
    route('video', './routes/archives/video.tsx'),
    route('challenge', './routes/archives/challenge/default.tsx', [
      index('./routes/archives/challenge/list.tsx'),
      route(':externalId', './routes/archives/challenge/detail.tsx'),
    ]),
  ]),

  ...prefix('api', [
    route('ping', './routes/api/ping.ts'),
    ...prefix('archives', [
      route('video', './routes/api/archives/video.ts'),
      route('challenge', './routes/api/archives/challenge.ts'),
      route('normalize-urls', './routes/api/archives/normalize-urls.ts'),
    ]),
  ]),
] satisfies RouteConfig

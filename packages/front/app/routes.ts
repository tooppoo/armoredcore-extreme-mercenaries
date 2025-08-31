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
    ...prefix('archives', [
      route('video', './routes/api/archives/video.ts'),
      route('challenge', './routes/api/archives/challenge.ts'),
      route('normalize-url', './routes/api/archives/normalize-url.ts'),
    ]),
  ]),
] satisfies RouteConfig

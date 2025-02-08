import {
  type RouteConfig,
  route,
  index,
  prefix,
} from "@react-router/dev/routes";

export default [
  index('./routes/index.tsx'),
  route('rule', './routes/rule.tsx'),
  route('penalties', './routes/penalties.tsx'),

  ...prefix('updates', [
    index('./routes/updates/index.tsx'),
    route(':id', './routes/updates/detail.tsx'),
  ]),
  ...prefix('archives', [
    index('./routes/archives/index.tsx'),
    route('video', './routes/archives/video.tsx'),
    route('challenge', './routes/archives/challenge.tsx'),
  ]),

  ...prefix('api', [
    ...prefix('archives', [
      route('video', './routes/api/archives/video.ts'),
      route('challenge', './routes/api/archives/challenge.ts'),
    ])
  ])
] satisfies RouteConfig;

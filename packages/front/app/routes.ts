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
    route('video', './routes/archives/video.tsx'),
  ]),

  ...prefix('api', [
    ...prefix('archives', [
      route('video', './routes/api/archives/video.ts'),
    ])
  ])
] satisfies RouteConfig;

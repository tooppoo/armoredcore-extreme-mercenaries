ARG NODE_VERSION=22.19.0

# アプリケーショ本体のbuild
FROM node:${NODE_VERSION}-slim AS build

WORKDIR /app

COPY ../../ .

ENV NODE_ENV=development

RUN --mount=type=cache,id=pnpm,target=/pnpm/store set -eux; \
  PNPM_SPEC="$(node -p 'require("./package.json").packageManager')"; \
  PNPM_VERSION="${PNPM_SPEC#pnpm@}"; \
  npm install -g "pnpm@${PNPM_VERSION}"; \
  pnpm install --frozen-lockfile; \
  pnpm discord-bot build; \
  # シンボリックリンク展開
  pnpm discord-bot deploy --prod build/discord-bot \
  tree build/discord-bot;

# 実行環境
FROM node:${NODE_VERSION}-alpine AS runtime

WORKDIR /app

COPY --from=build /app/build/discord-bot/dist /app/dist

# PID1問題に対応する
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

USER node

CMD ["node", "dist/index.js"]

ARG NODE_VERSION=22.19.0

# 本番用の依存関係をインストール
FROM node:${NODE_VERSION}-slim AS deps

WORKDIR /app

COPY ../../ .

RUN set -eux; \
  PNPM_SPEC="$(node -p 'require("./package.json").packageManager')"; \
  PNPM_VERSION="${PNPM_SPEC#pnpm@}"; \
  npm install -g "pnpm@${PNPM_VERSION}"; \
  pnpm --filter @ac-extreme-mercenaries/discord-bot install --frozen-lockfile --prod 

# アプリケーショ本体のbuild
FROM node:${NODE_VERSION}-slim AS build

WORKDIR /app

COPY ../../ .

ENV NODE_ENV=development

RUN set -eux; \
  PNPM_SPEC="$(node -p 'require("./package.json").packageManager')"; \
  PNPM_VERSION="${PNPM_SPEC#pnpm@}"; \
  npm install -g "pnpm@${PNPM_VERSION}"; \
  pnpm install --frozen-lockfile && \
  pnpm discord-bot build

# 実行環境
FROM node:${NODE_VERSION}-alpine AS runtime

WORKDIR /app

COPY --from=build /app/packages/discord-bot/dist /app/dist
COPY --from=deps /app/packages/discord-bot/node_modules /app/node_modules

# PID1問題に対応する
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

USER node

CMD ["node", "dist/index.js"]

ARG NODE_VERSION=22.19.0

# buildのための共通イメージ
FROM node:${NODE_VERSION}-slim AS base-build

ARG PNPM_STORE_DIR=/root/.pnpm-store

COPY ../../package.json .

RUN set -eux; \
  PNPM_SPEC="$(node -p 'require("./package.json").packageManager')"; \
  PNPM_VERSION="${PNPM_SPEC#pnpm@}"; \
  npm install -g "pnpm@${PNPM_VERSION}"; \
  pnpm config set store-dir ${PNPM_STORE_DIR}; \
  rm package.json;

# 依存関係の取得
FROM base-build AS fetch

ARG PNPM_STORE_DIR=/root/.pnpm-store

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm fetch .

# アプリケーショ本体のbuild
FROM base-build AS build

WORKDIR /app

COPY ../../ .
COPY --from=fetch /app/node_modules ./node_modules
COPY --from=fetch ${PNPM_STORE_DIR} ${PNPM_STORE_DIR}

RUN set -eux; \
  pnpm install --offline --frozen-lockfile; \
  pnpm discord-bot build; \
  # シンボリックリンク展開
  pnpm discord-bot deploy --prod build/discord-bot;

# 実行環境
FROM node:${NODE_VERSION}-alpine AS runtime

WORKDIR /app

COPY --from=build /app/build/discord-bot/dist /app/dist
COPY --from=build /app/build/discord-bot/node_modules /app/node_modules

# PID1問題に対応する
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

EXPOSE ${PORT:-3000}

USER node

CMD ["node", "dist/index.js"]

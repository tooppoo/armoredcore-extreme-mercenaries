
# buildのための共通イメージ
FROM node:22.20.0-slim@sha256:c407baf6e71f4127777b0b660b162e3c88c1974067b1be9f1f962709ea817d59 AS base-build

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
COPY packages/discord-bot/package.json ./packages/discord-bot/package.json
# ENOENT回避のため、最低限のディレクトリは構成は用意
COPY packages/front/package.json ./packages/front/package.json
COPY packages/e2e/package.json ./packages/e2e/package.json

RUN pnpm fetch

# アプリケーショ本体のbuild
FROM base-build AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/discord-bot ./packages/discord-bot
# ENOENT回避のため、最低限のディレクトリは構成は用意
COPY packages/front/package.json ./packages/front/package.json
COPY packages/e2e/package.json ./packages/e2e/package.json

COPY --from=fetch /app/node_modules ./node_modules
COPY --from=fetch ${PNPM_STORE_DIR} ${PNPM_STORE_DIR}

# PID1問題に対応用のtini追加
ENV TINI_VERSION=v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini

RUN set -eux; \
  pnpm install --offline --frozen-lockfile; \
  pnpm discord-bot build; \
  # シンボリックリンク展開
  pnpm discord-bot deploy --prod build/discord-bot; \
  chmod +x /tini

# 実行環境(22.19.0)
FROM gcr.io/distroless/nodejs22-debian12@sha256:33a071f11d6d35fd5edc4f9ce2f41efa1e4a59b49894c545ca43456c27ab7eaa AS runtime

WORKDIR /app

COPY --from=build /app/build/discord-bot/dist /app/dist
COPY --from=build /app/build/discord-bot/node_modules /app/node_modules
COPY --from=build /tini /sbin/tini

# PID1問題に対応する
ENTRYPOINT ["/sbin/tini", "--"]

EXPOSE ${PORT:-3000}

USER nonroot

CMD ["/nodejs/bin/node", "dist/app.js"]

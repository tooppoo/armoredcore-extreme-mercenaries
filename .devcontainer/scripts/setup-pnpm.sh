#!/bin/bash
set -euo pipefail

PACKAGE_MANAGER=$(node -p "require('./package.json').packageManager")
PACKAGE_MANAGER_NAME="${PACKAGE_MANAGER%@*}"

if [[ "${PACKAGE_MANAGER_NAME}" != "pnpm" ]]; then
  echo "Expected packageManager to be pnpm but found: ${PACKAGE_MANAGER_NAME}" >&2
  exit 1
fi

NPM_PREFIX="${HOME}/.npm-global"
NPM_CACHE_DIR="${HOME}/.npm-cache"
mkdir -p "${NPM_PREFIX}" "${NPM_CACHE_DIR}" ~/.pnpm-store ~/.pnpm-state

# 指定バージョンの pnpm が無ければ npm 経由でインストールして権限トラブルを避ける
if ! command -v pnpm >/dev/null 2>&1 || [[ "$(pnpm --version 2>/dev/null || echo)" != "${PACKAGE_MANAGER#*@}" ]]; then
  echo "Installing pnpm ${PACKAGE_MANAGER#*@} via npm..."
  npm config set prefix "${NPM_PREFIX}"
  npm config set cache "${NPM_CACHE_DIR}"
  npm install --global "${PACKAGE_MANAGER}" --no-audit --no-fund
fi

export PATH="${NPM_PREFIX}/bin:${PATH}"

for shell_rc in ~/.bashrc ~/.profile; do
  touch "${shell_rc}"
  if ! grep -Fq "${NPM_PREFIX}/bin" "${shell_rc}"; then
    echo "export PATH=\"${NPM_PREFIX}/bin:\$PATH\"" >> "${shell_rc}"
  fi
done

echo "Configuring pnpm..."
pnpm config set store-dir ~/.pnpm-store
pnpm config set state-dir ~/.pnpm-state
pnpm install --frozen-lockfile

echo "pnpm setup completed successfully"

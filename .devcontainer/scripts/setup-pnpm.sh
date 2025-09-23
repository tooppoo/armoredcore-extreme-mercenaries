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

# ボリュームマウントが root 所有の可能性があるため、必要なら所有権を修正
fix_dirs=("${HOME}/.pnpm-store" "${HOME}/.pnpm-state" "${NPM_PREFIX}" "${NPM_CACHE_DIR}")
for d in "${fix_dirs[@]}"; do
  mkdir -p "${d}"
  if [ ! -w "${d}" ]; then
    if command -v sudo >/dev/null 2>&1; then
      echo "Fixing ownership for ${d}..."
      sudo chown -R "$(id -u):$(id -g)" "${d}" || true
    fi
  fi
done

echo "Configuring pnpm..."
# 書き込みテストとフォールバック（/tmp）
STORE_DIR="${HOME}/.pnpm-store"
STATE_DIR="${HOME}/.pnpm-state"

mkdir -p "${STORE_DIR}" "${STATE_DIR}"
if ! ( [ -w "${STORE_DIR}" ] && touch "${STORE_DIR}/.rwtest" 2>/dev/null ); then
  echo "Warning: ${STORE_DIR} is not writable. Falling back to /tmp/pnpm-store"
  STORE_DIR="/tmp/pnpm-store"
  mkdir -p "${STORE_DIR}"
fi
rm -f "${HOME}/.pnpm-store/.rwtest" 2>/dev/null || true

if ! ( [ -w "${STATE_DIR}" ] && touch "${STATE_DIR}/.rwtest" 2>/dev/null ); then
  echo "Warning: ${STATE_DIR} is not writable. Falling back to /tmp/pnpm-state"
  STATE_DIR="/tmp/pnpm-state"
  mkdir -p "${STATE_DIR}"
fi
rm -f "${HOME}/.pnpm-state/.rwtest" 2>/dev/null || true

pnpm config set store-dir "${STORE_DIR}"
pnpm config set state-dir "${STATE_DIR}"
pnpm install --frozen-lockfile

echo "pnpm setup completed successfully"

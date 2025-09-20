#!/bin/bash
set -e

# Install pnpm using npm
echo "Installing pnpm..."
npm install -g pnpm@10.17.0

# Verify pnpm installation
pnpm --version

# Setup pnpm configuration
echo "Configuring pnpm..."
pnpm config set store-dir ~/.pnpm-store
pnpm config set state-dir ~/.pnpm-state
pnpm install --frozen-lockfile

echo "pnpm setup completed successfully"

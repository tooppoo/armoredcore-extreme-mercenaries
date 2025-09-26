#!/usr/bin/env bash
set -euo pipefail

# Resolve directory of this script so execution works from any location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

shopt -s nullglob
for script in "${SCRIPT_DIR}"/post-create-*.sh; do
  echo "Running ${script##*/}..."
  bash "${script}"
done
shopt -u nullglob

#!/bin/bash
set -euo pipefail

npm i -g @openai/codex

for shell_rc in ~/.bashrc ~/.zshrc ~/.profile; do
  printf '\nexport CODEX_HOME=/workspaces/armoredcore-extreme-mercenaries/.codex' >> "${shell_rc}"
done

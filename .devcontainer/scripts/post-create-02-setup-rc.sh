#!/bin/bash
set -euo pipefail

for shell_rc in ~/.bashrc ~/.zshrc ~/.profile; do
  touch "${shell_rc}"
done

#!/bin/bash
set -euo pipefail

ALIAS_FILE="${HOME}/.shell_aliases"

cat >"${ALIAS_FILE}" <<'ALIASES'
# git
alias git_merged='git branch --merged | grep -v "*" | grep -vE "(develop|staging|master|main|dev)"'
alias git_merged_feature='git branch --merged | grep -v "*" | grep -vE "(develop|staging|release|master|main|dev)"'
alias git_merged_delete="git_merged | git_delete"
alias git_merged_feature_delete="git_merged_feature | git_delete"
alias git_delete='xargs -I % git branch -d %'

# ls
alias ls='ls -h --color=auto'
alias ll='ls -l'
alias la='ls -a'
alias lal='la -l'
alias l1='ls -1'

# util
alias now='date "+%Y%m%d-%H%M%S"'
alias grep='grep --color=auto'

# ai
alias claude_bypass='claude --dangerously-skip-permissions'
ALIASES

for shell_rc in ~/.bashrc ~/.zshrc ~/.profile; do
  if ! grep -Fq "${ALIAS_FILE}" "${shell_rc}"; then
    printf '\n[ -f "%s" ] && source "%s"\n' "${ALIAS_FILE}" "${ALIAS_FILE}" >>"${shell_rc}"
  fi
done

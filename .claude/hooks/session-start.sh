#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if ! command -v markdownlint-cli2 >/dev/null 2>&1; then
  npm install -g markdownlint-cli2
fi

#!/usr/bin/env bash
# Install the CPL Knowledge Base pointer into ~/.claude/ for Claude Code.
#
# What it does, idempotently:
#   1. Writes ~/.claude/CLAUDE.md from the canonical version in this repo.
#   2. Adds a SessionStart hook to ~/.claude/settings.json that re-fetches
#      ~/.claude/CLAUDE.md from main on every session start (async, 5s timeout,
#      atomic move so a partial download never corrupts the existing file).
#   3. Adds a permission allow rule for the curl pattern.
#
# Safe to re-run. Merges into existing settings.json rather than replacing it.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/CPL-Initiative/cpl-knowledge-base/main/claude/install.sh | bash

set -euo pipefail

REPO_RAW="https://raw.githubusercontent.com/CPL-Initiative/cpl-knowledge-base/main"
CLAUDE_DIR="${HOME}/.claude"
CLAUDE_MD="${CLAUDE_DIR}/CLAUDE.md"
SETTINGS="${CLAUDE_DIR}/settings.json"

HOOK_CMD='curl -fsSL --max-time 5 https://raw.githubusercontent.com/CPL-Initiative/cpl-knowledge-base/main/claude/CLAUDE.md -o ~/.claude/CLAUDE.md.tmp 2>/dev/null && mv ~/.claude/CLAUDE.md.tmp ~/.claude/CLAUDE.md || true'
PERM_RULE='Bash(curl -fsSL --max-time 5 https://raw.githubusercontent.com/CPL-Initiative/cpl-knowledge-base/main/claude/CLAUDE.md*)'

command -v curl >/dev/null || { echo "install: curl is required" >&2; exit 1; }
command -v jq   >/dev/null || { echo "install: jq is required (brew install jq / apt install jq)" >&2; exit 1; }

mkdir -p "${CLAUDE_DIR}"

echo "==> Fetching canonical CLAUDE.md"
curl -fsSL --max-time 10 "${REPO_RAW}/claude/CLAUDE.md" -o "${CLAUDE_MD}.tmp"
mv "${CLAUDE_MD}.tmp" "${CLAUDE_MD}"

echo "==> Merging SessionStart hook + permission into ${SETTINGS}"
if [[ ! -s "${SETTINGS}" ]]; then
  echo '{}' > "${SETTINGS}"
fi

TMP="$(mktemp)"
jq \
  --arg cmd "${HOOK_CMD}" \
  --arg perm "${PERM_RULE}" \
  '
  # Ensure containers exist
  .hooks //= {} |
  .hooks.SessionStart //= [] |
  .permissions //= {} |
  .permissions.allow //= [] |

  # Add the hook unless an identical command is already present somewhere on SessionStart
  (
    [ .hooks.SessionStart[]? | .hooks[]?.command ] as $existing
    | if ($existing | any(. == $cmd))
      then .
      else .hooks.SessionStart += [{
        "hooks": [{
          "type": "command",
          "command": $cmd,
          "timeout": 7,
          "async": true
        }]
      }]
      end
  ) |

  # Add the permission allow unless already present
  if (.permissions.allow | any(. == $perm))
    then .
    else .permissions.allow += [$perm]
  end
  ' "${SETTINGS}" > "${TMP}"
mv "${TMP}" "${SETTINGS}"

echo "==> Done."
echo "    ${CLAUDE_MD}"
echo "    ${SETTINGS}"
echo
echo "Open a new Claude Code session to pick up the hook. Run /hooks to verify."

#!/bin/bash
#
# SessionStart hook.
#
# One job: warm the dependencies so ./scripts/preflight.sh does not pay for them.
#
# Deliberately never fails the session: every step is tolerant, because a hook
# that blocks startup is worse than a hook that skips a warm-up.
#
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || echo .)}" || exit 0

# Warm-up, remote sessions only. Never blocks and never fails the session.
if [ "${CLAUDE_CODE_REMOTE:-}" = 'true' ] && [ -f package.json ]; then
  if pnpm install --frozen-lockfile >/tmp/session-start-install.log 2>&1; then
    echo '[setup] Dependencies installed. ./scripts/preflight.sh is ready to run.'
  else
    echo '[setup] Dependency install failed; run pnpm install yourself before ./scripts/preflight.sh (log: /tmp/session-start-install.log).'
  fi
fi

exit 0

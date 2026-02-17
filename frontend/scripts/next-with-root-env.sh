#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$FRONTEND_DIR/.." && pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <next-command> [args...]"
  exit 1
fi

set -a
[[ -f "$ROOT_DIR/env/.env.shared" ]] && source "$ROOT_DIR/env/.env.shared"
[[ -f "$ROOT_DIR/env/.env.frontend" ]] && source "$ROOT_DIR/env/.env.frontend"
set +a

cd "$FRONTEND_DIR"
exec ./node_modules/.bin/next "$@"

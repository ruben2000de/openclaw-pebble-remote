#!/usr/bin/env bash
set -euo pipefail

intent="${1:-status}"
text="${2:-}"

payload="$(python3 - "$intent" "$text" <<'PY'
import json
import sys
from datetime import datetime, timezone

intent = sys.argv[1]
text = sys.argv[2]
print(json.dumps({
    "source": "openclaw-pebble-remote",
    "appVersion": "0.5.2",
    "profile": "otti",
    "agentLabel": "Otti",
    "replyMode": "notification",
    "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "requestId": "smoke-shell",
    "intent": intent,
    "text": text,
    "device": {
        "platform": "smoke",
        "model": "shell"
    }
}, separators=(",", ":")))
PY
)"

if [[ "${OTTI_PEBBLE_DRY_RUN:-}" == "1" ]]; then
  printf '%s\n' "${payload}"
  exit 0
fi

: "${OPENCLAW_PEBBLE_HOOK_URL:?Set OPENCLAW_PEBBLE_HOOK_URL, e.g. https://host/hooks-openclaw-pebble/pebble-intent}"
: "${OPENCLAW_PEBBLE_HOOK_TOKEN:?Set OPENCLAW_PEBBLE_HOOK_TOKEN}"

curl -sS -X POST "${OPENCLAW_PEBBLE_HOOK_URL}" \
  -H "Authorization: Bearer ${OPENCLAW_PEBBLE_HOOK_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${payload}"

printf '\n'

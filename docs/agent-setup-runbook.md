# Agent setup runbook

This runbook is for an OpenClaw agent guiding a user through the Pebble remote setup.

## Goal

User journey:

```text
Install app
→ ask OpenClaw agent to set up Pebble remote
→ paste endpoint/token into app settings
→ press Ping
→ done
```

Do not make the user edit OpenClaw config by hand unless the native setup path is unavailable.

## Safety contract

- Generate a dedicated hook path and bearer token.
- Keep `allowRequestSessionKey=false`.
- Use a fixed server-side `sessionKey`, e.g. `hook:pebble`.
- Restrict `allowedAgentIds` to the intended agent, usually `main`.
- Keep `maxBodyBytes` small; 4096 bytes is enough for watch intents.
- Keep transform and mapping server-side.
- Never place endpoint/token in GitHub, CloudPebble, screenshots or PBW source.
- If a user posts a token publicly, rotate it immediately.

## Minimal OpenClaw hook shape

```json
{
  "hooks": {
    "enabled": true,
    "path": "/hooks-RANDOM_SUFFIX",
    "token": "DEDICATED_RANDOM_TOKEN",
    "defaultSessionKey": "hook:pebble",
    "allowRequestSessionKey": false,
    "allowedSessionKeyPrefixes": ["hook:pebble"],
    "allowedAgentIds": ["main"],
    "maxBodyBytes": 4096,
    "transformsDir": "/home/node/.openclaw/hooks/transforms",
    "mappings": [
      {
        "id": "pebble-intent",
        "name": "OpenClaw Pebble Remote",
        "match": { "path": "pebble-intent" },
        "action": "agent",
        "wakeMode": "now",
        "sessionKey": "hook:pebble",
        "deliver": true,
        "channel": "discord",
        "to": "channel:YOUR_TARGET",
        "model": "openai/gpt-5.4",
        "thinking": "low",
        "timeoutSeconds": 90,
        "allowUnsafeExternalContent": false,
        "transform": { "module": "pebble-intent.mjs" }
      }
    ]
  }
}
```

## Transform install

Copy `openclaw/transforms/pebble-intent.mjs` to the configured `hooks.transformsDir`.

## Smoke test before user enters settings

Use a local POST with the dedicated token:

```bash
curl -sS -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"source":"pebble-otti-remote","intent":"ping","requestId":"smoke"}'
```

Expected:

- wrong token returns `401`
- valid token returns `200` with `{ "ok": true, "runId": ... }` or equivalent accepted-run response

## User card

Give the user only this minimal card:

```text
Endpoint: https://HOST/hooks-RANDOM_SUFFIX/pebble-intent
Token:    DEDICATED_RANDOM_TOKEN
Route:    OpenClaw Hook
Profile:  otti
Reply:    notification

Test: save settings, then press Up/Ping on the watch.
```

## Acceptance

- User opens settings successfully.
- User saves endpoint/token.
- Watch shows `Setup gespeichert` or equivalent.
- `Up` / Ping reaches OpenClaw.
- `Select` / Status returns a short run/working response.
- `Long Select` / Capture sends dictated text to OpenClaw after user confirmation.
- Rotation/revocation path is known.

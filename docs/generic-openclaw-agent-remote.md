# Generic OpenClaw Agent Remote — Pebble/Otti Remote v0.2 Direction

Stand: 2026-05-29 · code slice v0.3

## Decision

Treat the Pebble project as a reusable **OpenClaw Agent Remote** first, with **Otti Remote** as the first bundled/default profile.

This keeps the first Otti wrist companion profile personal and cosy, but avoids hardcoding the app, payload contract, and hook surface so tightly to one deployment that other OpenClaw users cannot reuse it for their own agents.

## Why this fits OpenClaw now

The 2026-05-28 OpenClaw post "Lighter Core, Sharper Claws" points in the same direction: keep core small, make optional capabilities explicit, and move specialised surfaces into clear plugin/companion boundaries. Pebble should not be an OpenClaw core assumption. It should be a small companion app + hook/transform contract.

## Architecture

```text
Pebble watchapp
  fixed buttons / tiny UI
        |
        v
PebbleKit JS on phone
  endpoint + token + display profile
        |
        v
OpenClaw hook endpoint
  small body, bearer token, fixed source
        |
        v
Transform / mapping
  allowlist intents, constrain prompt, choose agent/session/delivery
        |
        v
OpenClaw agent
  Otti by default, but reusable for any configured agent
```

## Product split

### 1. Generic core

Name in public docs/code should become something like **OpenClaw Pebble Remote** or **OpenClaw Wrist Remote**.

Generic capabilities:

- `ping` — prove the hook path works
- `status` — ask the configured agent for a tiny status card
- `capture` — send short text/dictation to the configured agent
- `last` — request latest short answer/status pointer
- `help` — list available wrist intents

### 2. Profile layer

Otti is one profile, not the whole architecture.

Profile concerns:

- display name: `Otti Remote`
- button labels / warm copy
- default prompt language and tone
- default delivery target, e.g. a Discord/Telegram/mobile notification route controlled by the deploying user
- optional avatar/icon/theme later

Other users should be able to configure their own profile without touching C code.

### 3. OpenClaw example mapping

Ship an example mapping for Otti, but frame it as an example profile:

- `examples/openclaw/otti.mapping.json`
- `examples/openclaw/generic-agent.mapping.json`
- transform accepts the generic source and optionally the legacy Otti source during migration

## Payload contract v0.2

```json
{
  "source": "openclaw-pebble-remote",
  "appVersion": "0.5.2",
  "profile": "otti",
  "createdAt": "2026-05-29T12:00:00Z",
  "requestId": "pbl-42",
  "intent": "capture",
  "text": "short dictation text",
  "device": {
    "platform": "flint",
    "model": "obelix",
    "firmware": "4.9.178",
    "language": "de_DE"
  }
}
```

Important: payload may carry a display/profile hint, but **must not be trusted to select arbitrary agents or sessions**. Agent/session routing belongs in the OpenClaw hook mapping.

## Security gates

The project is a remote control surface, so default-deny matters more than cleverness.

Hard defaults:

- fixed intent allowlist
- small `maxBodyBytes`
- bearer token per remote/profile
- randomised hook path
- `allowRequestSessionKey=false`
- hook mapping may match path only if the transform itself validates `source`; this allows a legacy source alias without opening routing control
- mapping-controlled agent/session, not payload-controlled
- no shell/config/external-send actions from wrist intents
- no real token in repo/PBW
- capture text length limit
- phone-side rate limit
- production docs include incident/revocation steps

Launch boundary:

```text
Prototype/demo data: quick iteration okay
Real data / external reachability / other users: security gate required
```

## Next implementation slice

1. Rename documentation framing to generic OpenClaw remote while keeping app display as `Otti Remote` for the first profile.
2. Add generic payload source `openclaw-pebble-remote`; keep `pebble-otti-remote` as legacy alias during migration.
3. Add settings fields for display/profile metadata only: `profileName`, `agentLabel`, `replyMode`; do not let settings choose arbitrary `agentId` unless the hook mapping separately allowlists it.
4. Add `SECURITY.md` or security section covering token handling, revocation, scopes and safe deployment.
5. Keep an Otti mapping as the first example profile, with placeholders for all deployment-specific targets.

## Current verification snapshot

- Existing transform smoke test passes (`node tools/smoke-transform.mjs`).
- PBW build passes via the uv-installed Pebble Tool path (`/home/node/.local/share/uv/tools/pebble-tool/bin/pebble build`).
- The older project-local `.venv-pebble/bin/pebble` still fails with a Python `SRE module mismatch`; do not use that path for acceptance builds.

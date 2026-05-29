# OpenClaw Pebble Remote

A small Pebble/RePebble watch remote for OpenClaw agents.

**Status:** v0.5.2 live-hook candidate. Real-watch no-secret flow and bundled settings are verified; first live OpenClaw hook test is next. Not 1.0 yet.

The first/default profile is **Otti Remote**, but the protocol and OpenClaw hook surface are intentionally generic so other OpenClaw users can adapt it to their own agents.

This is not a wrist admin console. It is a narrow remote with fixed intents, server-side routing and conservative security defaults.

```text
Pebble watchapp
  -> AppMessage
  -> PebbleKit JS on phone
  -> HTTPS OpenClaw hook
  -> mapped OpenClaw agent run
  -> notification / watch response path
```

## Features

| Button | Intent | Meaning |
|---|---|---|
| Up | `ping` | Check that the phone/hook path is reachable. |
| Select | `status` | Ask for a short agent status card. |
| Down | `last` | Show local last response or ask for the latest brief card. |
| Long Select | `capture` | Start Pebble dictation where supported and send confirmed text. |
| Long Down | `help` | Ask for a short help card. |

Design goals:

- quick wrist capture / push-to-talk
- "what needs my attention?" status at a glance
- tiny answer/report cards, not long chat on a watch
- cosy companion feel without unsafe automation powers
- reusable OpenClaw agent remote shape

## Target platforms

The app intentionally targets microphone-capable platforms only:

- `basalt`
- `chalk`
- `diorite`
- `emery`
- `flint`
- `gabbro`

`aplite` is excluded because this is a voice-oriented remote and should not imply dictation support where none exists.

## Quick start with CloudPebble

1. Open <https://cloudpebble.repebble.com/>.
2. Connect/import this GitHub repository.
3. If authorizing GitHub access, choose **Only select repositories** and select only this repo.
4. Build the project.
5. Run in emulator or install on a watch.
6. Before configuring a hook token, press `Up` or `Select`.
7. Expected no-secret result: the app reports a setup-missing state (`Setup fehlt` / endpoint or token missing), not a crash.

See [`CLOUDPEBBLE.md`](CLOUDPEBBLE.md) for the detailed path.

## Local build

Install Pebble tooling:

```bash
uv tool install pebble-tool --python 3.13
pebble sdk install latest
pebble build
```

The local workspace was verified with Pebble Tool `5.0.35` and SDK `4.9.169` using:

```bash
/home/node/.local/share/uv/tools/pebble-tool/bin/pebble build
```

The older project-local `.venv-pebble/bin/pebble` path is intentionally not the acceptance path here; it has shown Python SDK environment mismatch failures.

## Configure an OpenClaw hook

The intended user journey is agent-guided:

```text
Install app
→ ask your OpenClaw agent to set up the Pebble remote
→ paste endpoint/token into the app settings
→ press Ping
```

The phone-side PebbleKit JS expects these settings via the Pebble configuration webview/local storage:

- hook endpoint URL
- hook bearer token
- optional profile/agent display hints
- optional reply mode

Do **not** commit a real endpoint or token.

Use [`openclaw/pebble-intent.mapping.json`](openclaw/pebble-intent.mapping.json) as a placeholder example, not as a blind patch. Real deployment values must stay local to the deploying user. See [`docs/setup-journey.md`](docs/setup-journey.md) for the setup contract.

Security defaults:

- dedicated bearer token
- non-obvious hook path
- small request bodies
- `allowRequestSessionKey=false`
- fixed intent allowlist
- routing and permissions decided server-side
- no shell/config/delete/external-send/API-spend actions from wrist intents

See [`SECURITY.md`](SECURITY.md).

## Files

- `appinfo.json` — legacy Pebble app metadata and AppMessage keys.
- `package.json` — current Pebble SDK metadata, target platforms and message keys.
- `wscript` — Pebble SDK build entry.
- `src/c/main.c` — watch UI, buttons, AppMessage, optional dictation.
- `src/pkjs/index.js` — phone-side HTTP client and config handling.
- `src/pkjs/config.json` — Clay settings UI bundled into the PBW.
- `openclaw/pebble-intent.mapping.json` — placeholder hook mapping.
- `openclaw/transforms/pebble-intent.mjs` — intent allowlist and prompt transform.
- `tools/smoke-transform.mjs` — offline transform smoke test.
- `tools/smoke-hook.sh` — local hook smoke helper.
- `docs/known-issues.md` — current emulator/device caveats.
- `docs/setup-journey.md` — intended agent-guided setup flow.
- `docs/agent-setup-runbook.md` — OpenClaw-agent-facing hook setup contract.
- `docs/response-path.md` — current v0.5 inbound status and v0.6 return-path design.
- `docs/reachability.md` — LAN/VPN/public HTTPS reachability choices.
- `docs/publication-checklist.md` — pre-release scan for secrets and private deployment traces.

## Test without watch

```bash
node --check src/pkjs/index.js
node --check openclaw/transforms/pebble-intent.mjs
node tools/smoke-transform.mjs
OTTI_PEBBLE_DRY_RUN=1 ./tools/smoke-hook.sh capture 'Quote-safe text: "hi"'
```

With a real hook configured locally:

```bash
OPENCLAW_PEBBLE_HOOK_URL='https://example/hooks-openclaw-pebble/pebble-intent' \
OPENCLAW_PEBBLE_HOOK_TOKEN='...' \
./tools/smoke-hook.sh status
```

## Known issues

CloudPebble/RePebble emulator may log `app_timer.c:49: Timer 0 does not exist` during dictation testing. If the app does not crash and remains responsive, treat this as an emulator dictation warning for now. Real watch + phone app dictation testing is still required for v0.4.

See [`docs/known-issues.md`](docs/known-issues.md).

## Roadmap

See [`ROADMAP.md`](ROADMAP.md). v1.0 requires real watch install testing, live hook verification, response-loop behavior, documentation, and a security review.

## Contributing

Issues and PRs are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) and redact logs/screenshots before posting.

## License

MIT. See [`LICENSE`](LICENSE).

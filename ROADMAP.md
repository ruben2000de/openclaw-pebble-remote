# Roadmap

OpenClaw Pebble Remote is currently a prototype. The goal is a safe, boringly reliable wrist remote for OpenClaw agents.

## v0.3 — Current prototype

- Buildable Pebble watchapp.
- Otti profile as first/default profile.
- Fixed intents: `ping`, `status`, `capture`, `last`, `help`.
- PebbleKit JS HTTP hook client.
- OpenClaw transform + mapping draft.
- No-secret CloudPebble/install test path.
- No `aplite`; microphone-capable platforms only.

## v0.4 — Real watch baseline

Status: achieved as v0.5.2 for no-secret watch flow.

Acceptance:

- CloudPebble build succeeds.
- Local CLI build succeeds.
- App installs on at least one real watch.
- Buttons do not crash.
- No-token state is understandable (`Setup fehlt` / setup missing).
- Dictation behavior is known on the target watch + phone app combo.

## v0.5 — Agent-guided live OpenClaw hook

Status: inbound path achieved in v0.5.2: ping and capture reach `#zentrale`; final watch return path remains v0.6.

v0.5 should prove the intended user journey, not just a manual maintainer-only hook:

```text
Install app → ask OpenClaw agent to set up remote → paste endpoint/token → press Ping
```

Acceptance:

- Dedicated hook token and random hook path.
- Agent-facing setup runbook exists.
- User receives one small endpoint/token card, not a config lecture.
- Settings store endpoint/token without rebuilding the app.
- `ping` reaches OpenClaw.
- `status` produces a short wrist/notification-appropriate response.
- `capture` sends confirmed dictation text to the mapped agent.
- Hook logs are useful without leaking secrets.
- Revocation/rotation path is documented and tested.

## v0.6 — Response loop

Acceptance:

- User receives a clear response via phone notification and/or watch UI.
- Watch UX clearly distinguishes accepted/sent vs final agent reply.
- If a true return path is implemented, it uses a narrow scoped endpoint/token, not normal OpenClaw gateway auth.
- Timeouts and network errors are distinguishable.
- Last response remains useful on the watch.
- Response text is bounded for wrist readability.
- See [`docs/response-path.md`](docs/response-path.md).

## v0.7 — Public profile polish

Acceptance:

- README is usable by a normal OpenClaw user.
- Example mappings use placeholders only.
- Publication checklist passes with no private endpoint/token/channel/LAN traces.
- Reachability guide covers LAN-only, VPN/tailnet and public HTTPS hook-only setups.
- CloudPebble guide is verified.
- Screenshots or emulator notes are available.
- GitHub issues/templates are in place.

## v0.9 — Beta

Acceptance:

- At least one week of real use without severe failures.
- Basic issue triage done.
- Security review against the current hook model.
- Outside-LAN reachability mode chosen and documented.
- Known limitations documented.

## v1.0 — First stable release

Acceptance:

- Reproducible source build.
- Real watch install path documented.
- Safe default OpenClaw mapping.
- Secrets never required in source.
- Install, configure, revoke and troubleshoot docs are complete.
- Maintainer has confidence that the app is a wrist remote, not an unsafe admin console.

## Later / maybe

- Hosted fallback settings page if a Pebble/Core app cannot load bundled Clay.
- Companion Android app for richer local speech/notifications.
- Multiple profiles/agents.
- Better direct watch response cards.
- Appstore/RePebble package metadata.

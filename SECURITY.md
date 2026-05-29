# Security — OpenClaw Pebble Remote

Stand: 2026-05-29

This project is a wrist remote for OpenClaw agents. Treat it as a small external control surface, not as a trusted local button.

## Trust boundary

```text
Pebble watch + phone app  ->  HTTPS hook request  ->  OpenClaw mapping/transform  ->  agent run
        untrusted-ish                  authenticated              policy boundary
```

The watch/phone may suggest `profile`, `agentLabel`, `replyMode`, `intent` and `text`, but routing and permissions must be decided server-side in OpenClaw config/mappings.

## Required defaults

- Use a dedicated bearer token for the Pebble remote.
- Use a non-obvious hook base path such as `/hooks-<random>`.
- Keep `hooks.maxBodyBytes` small, e.g. `4096`.
- Keep `hooks.allowRequestSessionKey=false`.
- Use an intent allowlist (`ping`, `status`, `capture`, `last`, `help`).
- Keep agent/session routing in OpenClaw mapping config, not in the payload.
- Do not expose shell commands, config writes, external messages, provider changes, deletes, or payment/API-spend actions through wrist intents.
- Keep real tokens out of Git, PBW artifacts, screenshots and chat transcripts.
- Rate-limit phone-side requests; current PebbleKit JS has a small local interval guard.

## Prototype vs. production

Fast prototyping is fine with dummy data and LAN-only tests.

Before real data, external reachability, shared use, or any third-party impact, do a security gate:

- threat model: what can the remote trigger?
- least privilege: can the hook token do less?
- auth/revocation: how is the token rotated?
- logging/audit: can suspicious requests be traced?
- rate limits/body limits: can abuse be bounded?
- privacy: what capture text may leave the watch/phone?
- incident path: how to disable the hook quickly?
- independent review before publishing a public setup guide

## Revocation

1. Remove or rotate the hook token in OpenClaw config.
2. Reload/restart Gateway if required by the config path.
3. Delete the token from Pebble/Core app settings/localStorage.
4. Check recent hook logs for unexpected requests.
5. If the endpoint path itself leaked, rotate the path too, not just the token.

## Public sharing note

For a public release, ship examples with placeholders only. The Otti profile may be the first example, but no user-specific endpoint, LAN IP, private domain, channel id, session key, token, address or deployment fingerprint belongs in the public PBW/docs.

Before every public release or docs push, run the publication checklist in [`docs/publication-checklist.md`](docs/publication-checklist.md). If any real token or private endpoint ever reaches public history, rotate it immediately and decide separately whether a history rewrite is warranted.

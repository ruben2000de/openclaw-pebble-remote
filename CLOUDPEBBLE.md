# CloudPebble / RePebble test path

This repo is intentionally safe to connect to CloudPebble: no real OpenClaw hook URL, no bearer token, no private session key.

## Import / connect

Recommended:

1. In GitHub App authorization choose **Only select repositories**.
2. Select only `openclaw-pebble-remote`.
3. Do **not** grant CloudPebble access to all repositories.
4. Import or connect this repository in <https://cloudpebble.repebble.com/>.

## First build

- Project type: C/Pebble app.
- SDK: current RePebble SDK is fine; local CLI build was verified with SDK `4.9.169`.
- Expected platforms: `basalt`, `chalk`, `diorite`, `emery`, `flint`, `gabbro`.
- `aplite` is intentionally excluded because this is a voice-oriented remote.

## First no-secret test

Before configuring any hook token:

1. Build in CloudPebble.
2. Run in emulator or install on watch.
3. Open **Otti Remote**.
4. Press `Up` or `Select`.
5. Expected: the phone-side JS reports a setup-missing state (`Setup fehlt` / endpoint or token missing), not a crash.

Button map:

| Button | Intent |
|---|---|
| Up | `ping` |
| Select | `status` |
| Down | `last` or local last response |
| Long Select | `capture` via dictation, if supported |
| Long Down | `help` |

## Hook configuration later

A real OpenClaw hook token belongs only in the phone-side app settings/localStorage, not in GitHub and not in CloudPebble source files.

See `docs/hook-setup.md` and `SECURITY.md` for the live path.

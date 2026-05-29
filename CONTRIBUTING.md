# Contributing

Thanks for considering a contribution to OpenClaw Pebble Remote.

This is a small control surface for OpenClaw agents. That makes safety and scope more important than feature count.

## Maintainer principles

- Keep the watch remote narrow: fixed intents first, not a general admin console.
- Keep routing and permissions server-side in OpenClaw mappings.
- Keep secrets out of source, PBW artifacts, screenshots and logs.
- Prefer boring, testable flows over clever wrist UX.
- Optimize the setup journey for normal users: install app, ask their OpenClaw agent for setup, paste one endpoint/token card, press Ping.
- Respect the Pebble/RePebble ecosystem and credit external patterns or code.

## Before opening a PR

Please check:

```bash
node --check src/pkjs/index.js
node --check openclaw/transforms/pebble-intent.mjs
node tools/smoke-transform.mjs
python3 -m json.tool package.json >/dev/null
python3 -m json.tool appinfo.json >/dev/null
python3 -m json.tool openclaw/pebble-intent.mapping.json >/dev/null
```

If you have Pebble tooling installed, also run:

```bash
pebble build
```

## Contribution scope

Good first areas:

- CloudPebble/RePebble build compatibility
- watch UI readability on `basalt`, `chalk`, `diorite`, `emery`, `flint`, `gabbro`
- no-secret install tests
- safer settings/config UX
- OpenClaw hook docs and examples
- response delivery back to watch or phone notification

Changes that need extra review:

- new intents
- any action that can send external messages, change config, run shell commands, delete data or spend API money
- auth/session/routing changes
- companion-app features
- logging of captured text

## Reporting issues

Please include:

- watch model/platform if known
- firmware version
- phone OS and Pebble/Core/RePebble app version
- build path: CloudPebble, local `pebble build`, or other
- what button/action was used
- expected vs actual result
- logs/screenshots with tokens redacted

## License

By contributing, you agree that your contribution is licensed under the MIT License used by this repository.

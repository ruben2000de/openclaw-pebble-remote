# Android Pebble/Core Install Notes

Target device:

- Hardware codename: obelix
- Firmware: 4.9.178
- Phone app: current Android Pebble/Core app
- Build artifact: build/otti-remote.pbw

## First No-Secret Install Test

1. Put build/otti-remote.pbw somewhere the Android phone can open.
2. Open the PBW with the new Pebble/Core app and install it to the paired watch.
3. Start Otti Remote on the watch.
4. Press Up once.

Expected first result without settings:

- Watchapp opens and shows its button legend.
- Up/Select/Down do not crash the app.
- Phone-side JS should answer with Setup fehlt because no hook endpoint/token is configured.

v0.3 intentionally targets microphone-capable platforms only (`basalt`, `chalk`, `diorite`, `emery`, `flint`, `gabbro`). This follows the Wristotle/Core Devices pattern: a voice remote without a microphone target gives false confidence.

If the app does not appear on the watch or install fails, capture:

- Android Pebble/Core app version
- exact install error text
- whether Developer/Dev Connect mode is enabled
- whether the app accepts third-party PBW sideloading from local files

## Settings Gate

v0.5.2 uses `@rebble/clay` for the settings page, so the Pebble/Core app should open an offline/local configuration UI instead of a hosted website.

For a real hook test, enter:

- Hook URL
- Bearer token
- Route: OpenClaw Hook
- Profile hints (`otti`, `Otti`, `notification`) unless you are testing a generic/non-Otti mapping

Do not bake a real hook token into src/pkjs/index.js or build/otti-remote.pbw.

## Network Decision

Recommended first live path:

1. LAN or Tailscale-only endpoint.
2. OpenClaw hook with fixed intent allowlist.
3. Reply via Discord/Android notification first.
4. Direct watchapp reply only after the hook path is boring.

Avoid starting with a public Internet hook. It adds DNS/TLS/token/security questions before the watch UX is even proven.

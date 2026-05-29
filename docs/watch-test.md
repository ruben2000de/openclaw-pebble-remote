# Real watch no-secret test

This is the acceptance test for the v0.3.x watch baseline. It should be run before configuring any real OpenClaw hook token.

## Install

Use one of these paths:

1. CloudPebble / RePebble: pull latest `main`, build, then install to watch via the Pebble/Core/RePebble phone app.
2. GitHub release / local PBW: install the latest PBW asset from the release or local build.

Do not configure endpoint/token yet.

## Expected app start

Open **Otti Remote** on the watch.

Expected:

- title shows `Otti Remote`
- body shows the button cheat sheet
- no crash/reboot
- after phone-side JS ready, it may briefly show `Bereit` / `Otti Remote verbunden.`

## Button tests without hook token

| Action | Expected result |
|---|---|
| Up | Setup-missing message, no crash |
| Select | Setup-missing message, no crash |
| Down | Shows last response or setup-missing/last handling, no crash |
| Long Down | Setup-missing/help handling, no crash |

The exact wording may be German for the Otti profile:

```text
Setup fehlt
Endpoint/Token in den App-Einstellungen setzen.
```

## Dictation test

Press **Long Select**.

Expected acceptable results:

- Dictation opens and lets you confirm text; after confirmation, without hook token, setup-missing is shown.
- Or the watch/phone app reports dictation unavailable/failure cleanly and returns to the app.

Failures:

- watch/app crash
- app becomes stuck and needs reinstall/restart
- dictation succeeds but sends without confirmation
- captured text appears in logs/screenshots unintentionally

## Previous real-watch result

Previous real-watch test showed dictation/text recognition working and no crashes/force closes, but the watch displayed `Antwort ohne Text` after actions. v0.5.2 adds numeric AppMessage key fallback from phone JS to watch C app to address this.

## What to report

Please report:

- watch model / platform if visible
- firmware version
- phone app version
- install path: CloudPebble or PBW
- results for Up, Select, Down, Long Down, Long Select
- whether any red logs appeared
- whether the app stayed responsive after dictation

Do not post real hook URLs, bearer tokens or private captured text.

# Known issues

## CloudPebble/RePebble emulator dictation timer warning

Observed in CloudPebble emulator during `Long Select` / dictation testing:

```text
[ERROR] app_timer.c:49: Timer 0 does not exist
```

Status: known emulator/dictation warning, not currently treated as an app crash.

What is known:

- Build succeeds.
- App starts.
- No-secret setup state is shown correctly.
- The warning appears when testing dictation in the CloudPebble/RePebble emulator.
- v0.3.1 removed this app's own 0ms deferred dictation destroy path.
- v0.3.2 suppressed Pebble SDK dictation error dialogs and kept failure handling in the app UI.
- The warning still appears in emulator after v0.3.2, so it is likely in the emulator/SDK dictation failure path rather than this app's own timer usage.

Current maintainer position:

- CloudPebble emulator baseline is considered usable if there is no crash and the UI remains responsive.
- Dictation must be verified on real watch + phone app before it can be accepted for v0.4.
- If real hardware reproduces a crash or stuck dictation session, reopen this as an app bug.

Workaround for testers:

- Use the emulator for install/build/button baseline.
- Use real hardware for dictation acceptance.
- Do not configure real hook secrets until the no-secret baseline is confirmed.

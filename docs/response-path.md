# Response path

Current v0.5 status:

```text
Watch → Phone/PebbleKit JS → OpenClaw Hook → Agent → #zentrale
```

This path is live: ping and dictation/capture can reach OpenClaw.

What is not solved yet:

```text
Agent final reply → Phone/PebbleKit JS → Watch
```

## Why the final reply does not appear on the watch yet

OpenClaw hook calls are asynchronous. The HTTP response to the Pebble app confirms acceptance, usually with `ok`/`runId`. The agent's final answer is delivered separately to the configured chat surface (`#zentrale` in the current setup). The Pebble app does not currently have a subscribed return channel for that final answer.

So this is expected for v0.5:

- watch action reaches OpenClaw
- user sees the message in the normal OpenClaw surface
- watch only gets an immediate acknowledgement/run id

## v0.6 goal

Add a safe, minimal return path that does not expose broad OpenClaw auth to the phone app.

Desired user experience:

```text
Press Ping
→ watch says "sent"
→ short final reply appears on watch/phone when ready
```

## Candidate designs

### A. Immediate acknowledgement only (current fallback)

Keep the watch UX honest:

- `OK — in Zentrale angekommen`
- `Capture gesendet`
- no promise of final reply on wrist

Pros: simplest, safe, already works.  
Cons: not a true return path.

### B. Small server-side result cache + poll endpoint

OpenClaw stores a short result by `requestId`; the app polls a scoped endpoint for a few seconds.

Requirements:

- scoped token only for Pebble result polling
- max short text response
- TTL cleanup
- no access to arbitrary runs/sessions
- no gateway/admin token on the phone

Pros: true wrist return path.  
Cons: needs a small server-side capability not present in the current static hook mapping.

### C. Phone notification bridge

OpenClaw sends the final reply to a phone-notification-capable channel, while the watch just confirms send.

Pros: no custom polling endpoint.  
Cons: depends on available notification/channel support; not necessarily routed back to the Pebble app view.

## Maintainer recommendation

For v0.5, accept inbound as the milestone and improve acknowledgement wording.

For v0.6, build **B** only if OpenClaw can provide a narrow result endpoint without exposing general session/run APIs to the phone. If not, use **C** or keep **A** with honest UX.

Security rule: the Pebble app must never receive the normal OpenClaw gateway token or any credential that can read arbitrary sessions, run tools, change config, or send messages beyond the fixed remote scope.

# Setup journey

Goal: setup should feel like this for a normal OpenClaw user:

```text
Install Pebble app
→ tell your OpenClaw agent: "set up my Pebble remote"
→ agent creates a scoped hook + token
→ agent gives you one short endpoint/token card
→ paste into app settings
→ press Ping
→ done
```

The user should not need to understand OpenClaw hook internals, session keys, transforms or routing to do a basic setup.

## Desired happy path

1. User installs the PBW from a release or Appstore/RePebble path.
2. User opens the app once and sees `Setup fehlt` / setup required.
3. User asks their OpenClaw agent to set up the remote.
4. The agent performs the server-side setup:
   - creates or selects a dedicated hook path
   - creates a dedicated bearer token
   - installs/selects the Pebble intent transform
   - maps fixed intents only
   - sets `allowRequestSessionKey=false`
   - chooses a delivery route controlled by the user
   - stores the secret in OpenClaw/local config, not in source
5. The agent returns only the minimum copy/paste payload:
   - endpoint URL
   - token
   - optional profile/reply hints
   - revocation instruction
6. User opens Pebble app settings and pastes those values.
7. User presses `Up` for Ping.
8. Agent confirms: remote is connected.

## Agent-facing setup contract

The app should be easy for an OpenClaw agent to guide. Documentation and examples should answer:

- What config path/schema is needed?
- Where does the transform go?
- Which values are placeholders vs deployment-specific?
- How to generate a safe random hook path/token?
- How to revoke/rotate?
- What smoke test proves it works before the watch is used?
- What is the smallest safe permission surface?

## User-facing constraints

- No secrets in GitHub, CloudPebble or screenshots.
- No "All repositories" GitHub authorization needed for users.
- No wrist-triggered shell/config/delete/external-send/API-spend actions.
- If setup fails, the watch should say what is missing in plain language.
- Advanced docs exist, but the primary path is guided by the agent.

## v0.5 implications

v0.5 is not only "make the hook work". It should prove an agent-guided live setup path:

- one hook setup checklist
- one agent prompt / runbook
- one endpoint/token card format
- one smoke command
- one watch Ping test
- one revocation path

Acceptance for v0.5:

- a real OpenClaw instance can create the hook config without editing app source
- app settings can store endpoint/token
- `Up` reaches OpenClaw and gets a meaningful response
- `Select` returns a short status card
- `Long Select` capture reaches the mapped agent
- user can revoke/rotate the token without rebuilding the app

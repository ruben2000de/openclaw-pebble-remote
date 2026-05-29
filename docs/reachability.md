# Reachability

OpenClaw Pebble Remote needs the phone-side PebbleKit JS to reach the configured hook endpoint.

```text
Watch → phone app → HTTP(S) endpoint → OpenClaw hook
```

If the phone is only on the local Wi-Fi, a LAN URL can work. If the phone is outside the LAN, it will not reach a private `192.168.x.x`/`10.x.x.x`/`172.16-31.x.x` endpoint unless a VPN/tailnet is active.

## Recommended patterns

### 1. Tailnet/VPN first

Best default for a personal OpenClaw deployment:

- run a VPN/tailnet client on the phone
- expose OpenClaw only inside the private overlay network
- configure the app with the tailnet/VPN-reachable hook URL

Pros: no public internet exposure for the hook.  
Cons: requires the phone to keep the VPN/tailnet available.

### 2. Public HTTPS hook path only

If public reachability is required, expose only the dedicated hook path through a reverse proxy:

```text
https://example.com/hooks-RANDOM_SUFFIX/pebble-intent
```

Minimum requirements:

- HTTPS only
- random hook base path
- dedicated bearer token
- `hooks.allowRequestSessionKey=false`
- small `hooks.maxBodyBytes`
- fixed intent allowlist server-side
- rate limits at proxy and/or OpenClaw
- logs that do not print tokens or dictated private text by default
- clear revocation/rotation path

Do **not** expose broad OpenClaw admin/gateway APIs just to make the watch app reachable.

### 3. LAN-only prototype

Acceptable only for early testing:

```text
http://LAN-HOST:18789/hooks-RANDOM_SUFFIX/pebble-intent
```

This will fail outside the LAN. Do not present LAN-only URLs as a production setup.

## Agent-guided setup implication

The OpenClaw agent guiding setup should choose an endpoint appropriate to the user's actual network:

- if phone has tailnet/VPN → use private overlay URL
- if user wants outside-LAN without VPN → create/verify a public HTTPS hook-only route
- if only testing at home → LAN URL is okay, but label it as LAN-only

The user-facing setup card should say which reachability mode is being used.

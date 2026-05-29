# Hook-Endpoint Setup — OpenClaw Pebble Remote

Stand: 2026-05-29

## Übersicht

Die Pebble-App sendet HTTP POST an einen OpenClaw Hook-Endpoint. OpenClaw transformiert den Request in einen Agent-Run und liefert eine Bestätigung zurück. **Otti Remote** ist das erste Profil; die Hook-Struktur ist aber generisch für andere OpenClaw-Agenten gedacht.

## Schritte

### 1. Token generieren

```bash
openssl rand -hex 32
```

Speichere den Wert als Environment Variable:

```bash
export OPENCLAW_PEBBLE_HOOK_TOKEN="<dein-token>"
```

### 2. Config-Patch anwenden

Die Hook-Konfiguration liegt in:
`projects/pebble/otti-remote/openclaw/pebble-intent.mapping.json`

**Änderungen vor dem Patch:**
- `hooks.path`: Ersetze `hooks-openclaw-pebble-REPLACE_WITH_RANDOM_SUFFIX` durch einen echten randomisierten Pfad, z.B. `/hooks-RANDOM_SUFFIX`
- `hooks.token`: Setze auf `"${OPENCLAW_PEBBLE_HOOK_TOKEN}"` (Env-Var-Referenz)

⚠️ **Wichtig:** `hooks.transformsDir` MUSS innerhalb `/home/node/.openclaw/hooks/transforms` liegen — OpenClaw erlaubt keine Pfade außerhalb dieses Verzeichnisses (Sicherheitsbeschränkung seit 2026.5.x). Sonst Crashloop!

Dann per `gateway config.patch` anwenden:

```json
{
  "hooks": {
    "enabled": true,
    "path": "/hooks-RANDOM_SUFFIX",
    "token": "${OPENCLAW_PEBBLE_HOOK_TOKEN}",
    "defaultSessionKey": "hook:pebble",
    "allowRequestSessionKey": false,
    "allowedSessionKeyPrefixes": ["hook:pebble"],
    "allowedAgentIds": ["main"],
    "maxBodyBytes": 4096,
    "transformsDir": "/home/node/.openclaw/hooks/transforms",
    "mappings": [
      {
        "id": "pebble-intent",
        "name": "OpenClaw Pebble Remote",
        "match": {
          "path": "pebble-intent"
        },
        "action": "agent",
        "wakeMode": "now",
        "sessionKey": "hook:pebble",
        "messageTemplate": "Pebble fallback intent={{payload.intent}} text={{payload.text}} request={{payload.requestId}}",
        "deliver": true,
        "channel": "discord",
        "to": "channel:REPLACE_WITH_DELIVERY_TARGET",
        "model": "openai/gpt-5.4",
        "thinking": "low",
        "timeoutSeconds": 90,
        "allowUnsafeExternalContent": false,
        "transform": {
          "module": "pebble-intent.mjs"
        }
      }
    ]
  }
}
```

### 3. Verify

```bash
curl -X POST https://YOUR-OPENCLAW-HOST.example/hooks-RANDOM_SUFFIX/pebble-intent \
  -H "Authorization: Bearer $OPENCLAW_PEBBLE_HOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source":"openclaw-pebble-remote","profile":"otti","intent":"ping","requestId":"test-1"}'
```

Erwartet: `{ "ok": true, "runId": "..." }`

### 4. Settings öffnen

Seit v0.5.2 nutzt die App `@rebble/clay`. Die Settings-Seite ist Teil des PBW/Phone-JS-Bundles und braucht keine gehostete Website mehr.

Öffne in der Pebble/Core-App die App-Einstellungen und trage dort Hook-URL und Token ein.

### 5. In der Pebble App konfigurieren

1. Otti Remote auf der Uhr öffnen
2. In der Pebble/Core-App: Otti Remote → Settings
3. Endpoint: `https://YOUR-OPENCLAW-HOST.example/hooks-RANDOM_SUFFIX/pebble-intent`
4. Token: Den generierten Token eingeben
5. Speichern

## Request-Format

Die Pebble-App sendet. `profile`, `agentLabel` und `replyMode` sind nur Hinweise; die echte Agent-/Session-Route bleibt serverseitig im Hook-Mapping:

```json
{
  "source": "openclaw-pebble-remote",
  "appVersion": "0.5.2",
  "profile": "otti",
  "agentLabel": "Otti",
  "replyMode": "notification",
  "createdAt": "2026-05-28T12:00:00Z",
  "requestId": "pbl-42",
  "intent": "capture",
  "text": "Morgen Zahnarzt um 14 Uhr",
  "device": {
    "platform": "flint",
    "model": "Pebble 2 Duo",
    "firmware": "4.9.178"
  }
}
```

## Intent-Verhalten

| Intent | Verhalten |
|---|---|
| `ping` | Kurze Bestätigung |
| `status` | Kurze Statuskarte fürs Handgelenk |
| `capture` | Notiz → Daily Note (wenn Memory-tauglich) |
| `last` | Letzter relevanter Stand |
| `help` | Verfügbare Intents |

## Transform

Die Transform-Datei `openclaw/transforms/pebble-intent.mjs`:
- Validiert Source + Intent
- akzeptiert `openclaw-pebble-remote` und vorerst den Legacy-Alias `pebble-otti-remote`
- Baut eine strukturierte Nachricht für den Agenten
- Setzt Sicherheitsgrenzen: keine Shell-Befehle, keine Config-Änderungen, keine Drittanbieter-Nachrichten
- Route: `sessionKey: "hook:pebble"`, `wakeMode: "now"`

Payload-Felder wie `profile` oder `agentLabel` sind nur Anzeige-/Profilhinweise. Die echte Agent-/Session-Auswahl bleibt in der OpenClaw-Mapping-Config.

## Smoke-Test

```bash
cd /home/node/.openclaw/workspace/projects/pebble/otti-remote
node tools/smoke-transform.mjs
```

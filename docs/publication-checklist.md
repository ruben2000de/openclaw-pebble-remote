# Publication checklist

Run this before every public release or docs push.

## Must not appear in tracked files

- real hook tokens
- real hook random path suffixes from a private deployment
- LAN IPs such as `192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`
- private domains or hostnames
- Discord/Slack/Telegram channel IDs from a private deployment
- home/work addresses or personal names beyond the public GitHub owner context
- screenshots containing tokens, endpoints, channels or dictated private text
- PBW artifacts built from private config

## Required placeholders

Use placeholders like:

```text
https://YOUR-OPENCLAW-HOST.example/hooks-RANDOM_SUFFIX/pebble-intent
DEDICATED_RANDOM_TOKEN
channel:YOUR_TARGET
```

Do not use a private example that "looks harmless". Examples are copied.

## Suggested scan

```bash
git grep -n -I -E '(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|hooks-[0-9a-f]{6,}|channel:[0-9]{8,}|DISCORD_TOKEN|OPENROUTER_API_KEY|ANTHROPIC_API_KEY|sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,})'
```

This is not enough by itself, but it catches common mistakes.

## History caveat

If a secret or private endpoint was ever committed to public history, removing it from `main` is not enough. Rotate the secret immediately. Decide separately whether to rewrite history; do not do that casually because it disrupts forks/clones.

## Summary

-

## Checks

- [ ] `node --check src/pkjs/index.js`
- [ ] `node --check openclaw/transforms/pebble-intent.mjs`
- [ ] `node tools/smoke-transform.mjs`
- [ ] JSON files validate
- [ ] `pebble build` or CloudPebble build checked, if relevant

## Safety

- [ ] No secrets, private endpoints or channel ids added
- [ ] No unsafe wrist-triggered admin action added
- [ ] Routing remains server-side in OpenClaw mapping

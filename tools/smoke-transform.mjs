import transform from "../openclaw/transforms/pebble-intent.mjs";

async function expectAccepted(name, payload) {
  const result = await transform({ payload });
  if (!result || result.kind !== "agent") {
    throw new Error(name + ": expected accepted agent result");
  }
  if (!result.message.includes("Intent: " + payload.intent)) {
    throw new Error(name + ": transformed message misses intent");
  }
  return result;
}

async function expectDropped(name, payload) {
  const result = await transform({ payload });
  if (result !== null) {
    throw new Error(name + ": expected null/drop result");
  }
}

const accepted = await expectAccepted("capture", {
  source: "openclaw-pebble-remote",
  appVersion: "0.5.2",
  profile: "otti",
  agentLabel: "Otti",
  replyMode: "notification",
  createdAt: "2026-05-23T02:30:00Z",
  requestId: "smoke-1",
  intent: "capture",
  text: "Bitte morgen an den Pebble-Test denken.",
  device: {
    platform: "flint",
    model: "obelix",
    firmware: "4.9.178"
  }
});

if (!accepted.message.includes("4.9.178")) {
  throw new Error("capture: firmware missing from transformed message");
}

await expectAccepted("status", {
  source: "openclaw-pebble-remote",
  requestId: "smoke-2",
  intent: "status"
});

await expectAccepted("legacy-source", {
  source: "pebble-otti-remote",
  requestId: "smoke-legacy",
  intent: "ping"
});

if (!accepted.message.includes("Profile: otti")) {
  throw new Error("capture: profile missing from transformed message");
}

if (accepted.message.includes("rm -rf")) {
  throw new Error("capture: unexpected unsafe test text leakage");
}

await expectDropped("unknown-source", {
  source: "other",
  intent: "status"
});

await expectDropped("unknown-intent", {
  source: "openclaw-pebble-remote",
  intent: "shell",
  text: "rm -rf /"
});

console.log("smoke-transform ok");

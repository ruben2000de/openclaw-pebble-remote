// global Pebble, XMLHttpRequest, localStorage

var Clay = require('@rebble/clay');
var clayConfig = require('./config.json');
new Clay(clayConfig);

var APP_VERSION = '0.5.2';
var DEFAULT_PROFILE = 'otti';
var DEFAULT_AGENT_LABEL = 'Otti';
var MIN_REQUEST_INTERVAL_MS = 2500;
var lastRequestAt = 0;
var ALLOWED_ACTIONS = {
  ping: true,
  status: true,
  capture: true,
  last: true,
  help: true
};

function nowIso() {
  return new Date().toISOString();
}

function shortText(value, max) {
  var text = value ? String(value) : '';
  if (text.length <= max) {
    return text;
  }
  return text.slice(0, max - 1) + '...';
}

function getClaySettings() {
  try {
    return JSON.parse(localStorage.getItem('clay-settings') || '{}') || {};
  } catch (err) {
    return {};
  }
}

function cleanSettingValue(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
}

function firstValue() {
  for (var i = 0; i < arguments.length; i += 1) {
    var value = cleanSettingValue(arguments[i]);
    if (value !== '') {
      return value;
    }
  }
  return '';
}

function getConfig() {
  var clay = getClaySettings();
  // Clay is the canonical settings store since v0.4.1. Legacy OTTI_* keys are
  // fallback only; older test builds may have written stale/partial token data.
  return {
    endpoint: firstValue(clay.endpoint, localStorage.getItem('OTTI_ENDPOINT'), ''),
    token: firstValue(clay.token, localStorage.getItem('OTTI_TOKEN'), ''),
    route: firstValue(clay.route, localStorage.getItem('OTTI_ROUTE'), 'hook'),
    profile: firstValue(clay.profile, localStorage.getItem('OTTI_PROFILE'), DEFAULT_PROFILE),
    agentLabel: firstValue(clay.agentLabel, localStorage.getItem('OTTI_AGENT_LABEL'), DEFAULT_AGENT_LABEL),
    replyMode: firstValue(clay.replyMode, localStorage.getItem('OTTI_REPLY_MODE'), 'notification')
  };
}

function sendToWatch(status, response) {
  var statusText = shortText(status || '', 180);
  var responseText = shortText(response || status || '', 220);
  var payload = {
    status: statusText,
    response: responseText,
    // Numeric key fallback for CloudPebble/PebbleKit runtimes that do not
    // resolve messageKey names in JS payloads consistently. The C app uses
    // KEY_RESPONSE=3 and KEY_STATUS=4.
    3: responseText,
    4: statusText
  };

  Pebble.sendAppMessage(payload, function() {}, function() {});
}

function showNotification(title, body) {
  if (Pebble.showSimpleNotificationOnPebble) {
    Pebble.showSimpleNotificationOnPebble(title, shortText(body, 160));
  }
}

function cleanProfile(value, fallback) {
  var text = value ? String(value).toLowerCase() : '';
  text = text.replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  return text || fallback;
}

function cleanLabel(value, fallback) {
  var text = value ? String(value) : '';
  text = text.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
  return text || fallback;
}

function payloadValue(payload, name, numericKey) {
  if (payload[name] !== undefined && payload[name] !== null) {
    return payload[name];
  }
  if (payload[numericKey] !== undefined && payload[numericKey] !== null) {
    return payload[numericKey];
  }
  var numericStringKey = String(numericKey);
  if (payload[numericStringKey] !== undefined && payload[numericStringKey] !== null) {
    return payload[numericStringKey];
  }
  return '';
}

function normalizeAction(payload) {
  return String(payloadValue(payload, 'action', 0) || '').toLowerCase();
}

function isAllowedAction(action) {
  return !!ALLOWED_ACTIONS[action];
}

function buildPayload(action, payload) {
  var cfg = getConfig();
  var watchInfo = {};
  if (Pebble.getActiveWatchInfo) {
    watchInfo = Pebble.getActiveWatchInfo() || {};
  }

  return {
    // Historical wire id retained for compatibility with deployed OpenClaw hook mappings.
    // The public project remains OpenClaw Pebble Remote.
    source: 'pebble-otti-remote',
    appVersion: APP_VERSION,
    profile: cleanProfile(cfg.profile, DEFAULT_PROFILE),
    agentLabel: cleanLabel(cfg.agentLabel, DEFAULT_AGENT_LABEL),
    replyMode: cleanProfile(cfg.replyMode, 'notification'),
    createdAt: nowIso(),
    requestId: payloadValue(payload, 'request_id', 2) || ('pkjs-' + Date.now()),
    intent: action,
    text: payloadValue(payload, 'text', 1) || '',
    device: {
      platform: watchInfo.platform || '',
      model: watchInfo.model || '',
      firmware: watchInfo.firmwareVersion || watchInfo.firmware || '',
      language: watchInfo.language || ''
    }
  };
}

function postIntent(action, payload) {
  var cfg = getConfig();
  if (!cfg.endpoint || !cfg.token) {
    sendToWatch('Setup fehlt', 'Endpoint/Token in den App-Einstellungen setzen.');
    showNotification('OpenClaw Remote', 'Setup fehlt: Endpoint/Token setzen.');
    return;
  }

  var now = Date.now();
  if (now - lastRequestAt < MIN_REQUEST_INTERVAL_MS) {
    sendToWatch('Kurz warten', 'Rate-Limit: nicht mehrfach direkt hintereinander senden.');
    return;
  }
  lastRequestAt = now;

  var body = buildPayload(action, payload);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', cfg.endpoint, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', 'Bearer ' + cfg.token);
  xhr.timeout = 20000;

  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) {
      return;
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      var responseText = 'Gesendet';
      try {
        var parsed = JSON.parse(xhr.responseText || '{}');
        if (parsed.runId) {
          responseText = 'Run ' + parsed.runId;
        } else if (parsed.ok) {
          responseText = 'Otti arbeitet';
        }
      } catch (err) {}

      sendToWatch('OK', responseText);
      if (action === 'capture') {
        showNotification('OpenClaw Remote', 'Capture gesendet.');
      }
      return;
    }

    sendToWatch('HTTP ' + xhr.status, shortText(xhr.responseText || 'Hook-Fehler', 180));
  };

  xhr.ontimeout = function() {
    sendToWatch('Timeout', 'Telefon bekam keine Hook-Antwort.');
  };

  xhr.onerror = function() {
    sendToWatch('Netzfehler', 'Hook nicht erreichbar.');
  };

  xhr.send(JSON.stringify(body));
}

Pebble.addEventListener('ready', function() {
  sendToWatch('Bereit', 'Otti Remote verbunden.');
});

Pebble.addEventListener('appmessage', function(event) {
  var payload = event.payload || {};
  var action = normalizeAction(payload);

  if (!action) {
    sendToWatch('Fehler', 'Keine Action von der Uhr.');
    return;
  }

  if (!isAllowedAction(action)) {
    sendToWatch('Fehler', 'Action nicht erlaubt.');
    return;
  }

  postIntent(action, payload);
});

Pebble.addEventListener('webviewclosed', function(event) {
  if (!event || !event.response) {
    return;
  }

  try {
    var rawResponse = event.response;
    var hashIndex = rawResponse.indexOf('#');
    if (hashIndex >= 0) {
      rawResponse = rawResponse.slice(hashIndex + 1);
    }
    var decoded = decodeURIComponent(rawResponse);
    var config = JSON.parse(decoded);
    var endpoint = firstValue(config.endpoint, config.OTTI_ENDPOINT, '');
    var token = firstValue(config.token, config.OTTI_TOKEN, '');
    var route = firstValue(config.route, config.OTTI_ROUTE, 'hook');
    var profile = firstValue(config.profile, config.OTTI_PROFILE, DEFAULT_PROFILE);
    var agentLabel = firstValue(config.agentLabel, config.OTTI_AGENT_LABEL, DEFAULT_AGENT_LABEL);
    var replyMode = firstValue(config.replyMode, config.OTTI_REPLY_MODE, 'notification');

    if (endpoint && /^https?:\/\//.test(endpoint)) {
      localStorage.setItem('OTTI_ENDPOINT', endpoint);
    }
    if (token) {
      localStorage.setItem('OTTI_TOKEN', token);
    }
    if (route === 'hook') {
      localStorage.setItem('OTTI_ROUTE', route);
    }
    if (profile) {
      localStorage.setItem('OTTI_PROFILE', cleanProfile(profile, DEFAULT_PROFILE));
    }
    if (agentLabel) {
      localStorage.setItem('OTTI_AGENT_LABEL', cleanLabel(agentLabel, DEFAULT_AGENT_LABEL));
    }
    if (replyMode) {
      localStorage.setItem('OTTI_REPLY_MODE', cleanProfile(replyMode, 'notification'));
    }

    var saved = getConfig();
    if (saved.endpoint && saved.token) {
      sendToWatch('Setup gespeichert', 'OpenClaw Remote ist konfiguriert.');
    } else {
      sendToWatch('Setup unvollständig', 'Endpoint/Token fehlen noch.');
    }
  } catch (err) {
    sendToWatch('Setup-Fehler', 'Config konnte nicht gelesen werden.');
  }
});

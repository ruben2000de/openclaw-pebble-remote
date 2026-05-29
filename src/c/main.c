#include <pebble.h>

#define TEXT_BUFFER_SIZE 512
#define RESPONSE_BUFFER_SIZE 256
#define REQUEST_ID_BUFFER_SIZE 24
#define MIN_ACTION_INTERVAL_MS 800

#ifndef ARRAY_LENGTH
#define ARRAY_LENGTH(x) (sizeof(x) / sizeof((x)[0]))
#endif

enum {
  KEY_ACTION = 0,
  KEY_TEXT = 1,
  KEY_REQUEST_ID = 2,
  KEY_RESPONSE = 3,
  KEY_STATUS = 4
};

static Window *s_window;
static TextLayer *s_title_layer;
static TextLayer *s_body_layer;
static char s_last_response[RESPONSE_BUFFER_SIZE];
static char s_body_buffer[TEXT_BUFFER_SIZE];
static uint32_t s_request_counter;
static uint32_t s_last_send_ms;
static bool s_outbox_busy;

#if defined(PBL_MICROPHONE)
static DictationSession *s_dictation_session;
static const uint32_t s_vibe_ready_segments[] = { 60 };
static const uint32_t s_vibe_success_segments[] = { 50, 100, 50 };
static const uint32_t s_vibe_fail_segments[] = { 250, 150, 250 };
#endif

static void safe_copy(char *target, size_t target_size, const char *source) {
  if (!target || target_size == 0) {
    return;
  }

  if (!source) {
    target[0] = '\0';
    return;
  }

  strncpy(target, source, target_size - 1);
  target[target_size - 1] = '\0';
}

static bool is_blank(const char *text) {
  if (!text) {
    return true;
  }

  for (const char *p = text; *p; p++) {
    if (*p != ' ' && *p != '\t' && *p != '\n' && *p != '\r') {
      return false;
    }
  }

  return true;
}

static uint32_t now_ms(void) {
  time_t seconds;
  uint16_t milliseconds;
  time_ms(&seconds, &milliseconds);
  return (uint32_t)(seconds * 1000) + milliseconds;
}

static void set_body(const char *body) {
  safe_copy(s_body_buffer, sizeof(s_body_buffer), body);
  text_layer_set_text(s_body_layer, s_body_buffer);
}

static void remember_response(const char *text) {
  if (is_blank(text)) {
    return;
  }

  safe_copy(s_last_response, sizeof(s_last_response), text);
}

#if defined(PBL_MICROPHONE)
static void vibe_pattern(const uint32_t *segments, uint32_t count) {
  VibePattern pattern = {
    .durations = (uint32_t *)segments,
    .num_segments = count
  };
  vibes_enqueue_custom_pattern(pattern);
}

static void destroy_wedged_dictation_session(void *context) {
  DictationSession *wedged_session = (DictationSession *)context;
  if (wedged_session) {
    dictation_session_destroy(wedged_session);
  }
}
#endif

static const char *status_for_action(const char *action) {
  if (strcmp(action, "ping") == 0) {
    return "Ping geht ans Telefon...";
  }
  if (strcmp(action, "status") == 0) {
    return "Status wird geholt...";
  }
  if (strcmp(action, "capture") == 0) {
    return "Capture wird gesendet...";
  }
  if (strcmp(action, "help") == 0) {
    return "Hilfe wird geholt...";
  }
  return "Gesendet. Warte auf Telefon...";
}

static bool write_required_cstring(DictionaryIterator *iter, uint32_t key, const char *value) {
  DictionaryResult result = dict_write_cstring(iter, key, value ? value : "");
  return result == DICT_OK;
}

static void send_action(const char *action, const char *text) {
  uint32_t now = now_ms();
  if (s_outbox_busy || (s_last_send_ms != 0 && now - s_last_send_ms < MIN_ACTION_INTERVAL_MS)) {
    set_body("Kurz warten. Anfrage laeuft noch.");
    return;
  }

  DictionaryIterator *iter;
  AppMessageResult begin_result = app_message_outbox_begin(&iter);
  if (begin_result != APP_MSG_OK || !iter) {
    set_body("AppMessage nicht bereit.");
    return;
  }

  char request_id[REQUEST_ID_BUFFER_SIZE];
  snprintf(request_id, sizeof(request_id), "pbl-%lu", (unsigned long)++s_request_counter);

  bool ok = write_required_cstring(iter, KEY_ACTION, action)
    && write_required_cstring(iter, KEY_REQUEST_ID, request_id);

  if (ok && !is_blank(text)) {
    char clipped_text[TEXT_BUFFER_SIZE];
    safe_copy(clipped_text, sizeof(clipped_text), text);
    ok = write_required_cstring(iter, KEY_TEXT, clipped_text);
  }

  if (!ok) {
    set_body("Nachricht zu lang fuer AppMessage.");
    return;
  }

  dict_write_end(iter);

  AppMessageResult send_result = app_message_outbox_send();
  if (send_result == APP_MSG_OK) {
    s_outbox_busy = true;
    s_last_send_ms = now;
    set_body(status_for_action(action));
  } else {
    s_outbox_busy = false;
    set_body("Senden fehlgeschlagen.");
  }
}

static void inbox_received_callback(DictionaryIterator *iter, void *context) {
  s_outbox_busy = false;

  Tuple *response_tuple = dict_find(iter, KEY_RESPONSE);
  Tuple *status_tuple = dict_find(iter, KEY_STATUS);

  if (response_tuple && response_tuple->length > 0) {
    remember_response(response_tuple->value->cstring);
    set_body(s_last_response);
    return;
  }

  if (status_tuple && status_tuple->length > 0) {
    remember_response(status_tuple->value->cstring);
    set_body(s_last_response);
    return;
  }

  set_body("Antwort ohne Text.");
}

static void inbox_dropped_callback(AppMessageResult reason, void *context) {
  s_outbox_busy = false;
  set_body("Antwort verloren.");
}

static void outbox_sent_callback(DictionaryIterator *iter, void *context) {
  s_outbox_busy = false;
}

static void outbox_failed_callback(DictionaryIterator *iter, AppMessageResult reason, void *context) {
  s_outbox_busy = false;
  set_body("Telefon nicht erreicht.");
}

static void up_click_handler(ClickRecognizerRef recognizer, void *context) {
  send_action("ping", NULL);
}

static void select_click_handler(ClickRecognizerRef recognizer, void *context) {
  send_action("status", NULL);
}

static void down_click_handler(ClickRecognizerRef recognizer, void *context) {
  if (!is_blank(s_last_response)) {
    set_body(s_last_response);
  } else {
    send_action("last", NULL);
  }
}

static void down_long_click_handler(ClickRecognizerRef recognizer, void *context) {
  send_action("help", NULL);
}

#if defined(PBL_MICROPHONE)
static void dictation_callback(DictationSession *session, DictationSessionStatus status, char *transcription, void *context) {
  bool success = status == DictationSessionStatusSuccess && !is_blank(transcription);

  if (success) {
    vibe_pattern(s_vibe_success_segments, ARRAY_LENGTH(s_vibe_success_segments));
    send_action("capture", transcription);
    return;
  }

  vibe_pattern(s_vibe_fail_segments, ARRAY_LENGTH(s_vibe_fail_segments));

  /*
   * In CloudPebble/RePebble emulator, the SDK retry/error dialog for failed
   * dictation can emit `app_timer.c:49: Timer 0 does not exist`. We suppress
   * the SDK dialog below and keep failure handling in our own UI. Do not
   * destroy the DictationSession from this callback on emulator failures; real
   * hardware recovery can be revisited if a watch reproduces a wedged session.
   */
  set_body("Nichts verstanden. Nochmal Long Select.");
}
#endif

static void select_long_click_handler(ClickRecognizerRef recognizer, void *context) {
#if defined(PBL_MICROPHONE)
  if (!s_dictation_session) {
    s_dictation_session = dictation_session_create(TEXT_BUFFER_SIZE, dictation_callback, NULL);
  }

  if (s_dictation_session) {
    dictation_session_enable_confirmation(s_dictation_session, true);
    dictation_session_enable_error_dialogs(s_dictation_session, false);

    void *scratch = malloc(2048);
    if (scratch) {
      free(scratch);
    }

    vibe_pattern(s_vibe_ready_segments, ARRAY_LENGTH(s_vibe_ready_segments));
    set_body("Sprich kurz. Danach bestaetigen.");
    dictation_session_start(s_dictation_session);
  } else {
    set_body("Dictation konnte nicht starten.");
  }
#else
  set_body("Diese Pebble hat keinen Dictation-Pfad.");
#endif
}

static void click_config_provider(void *context) {
  window_single_click_subscribe(BUTTON_ID_UP, up_click_handler);
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
  window_single_click_subscribe(BUTTON_ID_DOWN, down_click_handler);
  window_long_click_subscribe(BUTTON_ID_SELECT, 700, select_long_click_handler, NULL);
  window_long_click_subscribe(BUTTON_ID_DOWN, 700, down_long_click_handler, NULL);
}

static void window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);

  s_title_layer = text_layer_create(GRect(0, 8, bounds.size.w, 24));
  text_layer_set_text(s_title_layer, "Otti Remote");
  text_layer_set_text_alignment(s_title_layer, GTextAlignmentCenter);
  text_layer_set_font(s_title_layer, fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD));
  layer_add_child(window_layer, text_layer_get_layer(s_title_layer));

  s_body_layer = text_layer_create(GRect(8, 38, bounds.size.w - 16, bounds.size.h - 46));
  text_layer_set_text(s_body_layer,
    "Up Ping\nSelect Status\nLong Select Merken\nDown Letzte Antwort\nLong Down Hilfe");
  text_layer_set_overflow_mode(s_body_layer, GTextOverflowModeWordWrap);
  text_layer_set_font(s_body_layer, fonts_get_system_font(FONT_KEY_GOTHIC_18));
  layer_add_child(window_layer, text_layer_get_layer(s_body_layer));
}

static void window_unload(Window *window) {
  text_layer_destroy(s_title_layer);
  text_layer_destroy(s_body_layer);
}

static void init(void) {
  s_window = window_create();
  window_set_click_config_provider(s_window, click_config_provider);
  window_set_window_handlers(s_window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload
  });

  app_message_register_inbox_received(inbox_received_callback);
  app_message_register_inbox_dropped(inbox_dropped_callback);
  app_message_register_outbox_sent(outbox_sent_callback);
  app_message_register_outbox_failed(outbox_failed_callback);
  app_message_open(app_message_inbox_size_maximum(), app_message_outbox_size_maximum());

  window_stack_push(s_window, true);
}

static void deinit(void) {
#if defined(PBL_MICROPHONE)
  if (s_dictation_session) {
    dictation_session_destroy(s_dictation_session);
  }
#endif
  window_destroy(s_window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}

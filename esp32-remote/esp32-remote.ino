#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TFT_eSPI.h>
#include <lvgl.h>
#include <XPT2046_Touchscreen.h>

#include "config.h"
#include "ui.h"

#define XPT2046_IRQ 36
#define XPT2046_MOSI 32
#define XPT2046_MISO 39
#define XPT2046_CLK 25
#define XPT2046_CS 33

SPIClass touchSPI(SPI);
XPT2046_Touchscreen ts(XPT2046_CS, XPT2046_IRQ);
TFT_eSPI tft = TFT_eSPI();

// ── LVGL 9.x display flush ──────────────────────────────────────────────────
void my_disp_flush(lv_display_t *disp, const lv_area_t *area, uint8_t *px_map) {
    uint32_t w = (area->x2 - area->x1 + 1);
    uint32_t h = (area->y2 - area->y1 + 1);

    tft.startWrite();
    tft.setAddrWindow(area->x1, area->y1, w, h);
    tft.pushColors((uint16_t *)px_map, w * h, true);
    tft.endWrite();

    lv_display_flush_ready(disp);   // <-- changed from lv_disp_flush_ready
}

// ── LVGL 9.x touch input ────────────────────────────────────────────────────
void my_touchpad_read(lv_indev_t *indev, lv_indev_data_t *data) {
    if (ts.tirqTouched() && ts.touched()) {
        TS_Point p = ts.getPoint();
        data->point.x = map(p.x, 200, 3700, 1, 320);
        data->point.y = map(p.y, 240, 3800, 1, 240);
        data->state = LV_INDEV_STATE_PRESSED;   // <-- renamed in v9
    } else {
        data->state = LV_INDEV_STATE_RELEASED;  // <-- renamed in v9
    }
}

unsigned long lastPollTime = 0;
bool is_recording = false;

static lv_color_t buf[320 * 24];

void setup() {
    Serial.begin(115200);

    tft.begin();
    tft.setRotation(1);
    tft.fillScreen(TFT_BLACK);

    touchSPI.begin(XPT2046_CLK, XPT2046_MISO, XPT2046_MOSI, XPT2046_CS);
    ts.begin(touchSPI);
    ts.setRotation(1);

    // ── LVGL 9.x init ───────────────────────────────────────────────────────
    lv_init();

    // Display
    lv_display_t *disp = lv_display_create(320, 240);
    lv_display_set_flush_cb(disp, my_disp_flush);
    lv_display_set_buffers(disp, buf, NULL, sizeof(buf), LV_DISPLAY_RENDER_MODE_PARTIAL);

    // Input device
    lv_indev_t *indev = lv_indev_create();
    lv_indev_set_type(indev, LV_INDEV_TYPE_POINTER);
    lv_indev_set_read_cb(indev, my_touchpad_read);

    ui_init();

    lv_label_set_text(label_status, "Connecting WiFi...");
    lv_task_handler();

    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected.");

    lv_label_set_text(label_status, "WiFi Connected!");
    lv_task_handler();
    delay(1000);
}

void loop() {
    lv_task_handler();
    delay(5);

    if (millis() - lastPollTime > STATUS_POLL_INTERVAL_MS) {
        lastPollTime = millis();
        pollServerStatus();
    }
}

void pollServerStatus() {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        String url = String(API_BASE_URL) + "/api/recordings/status";
        http.begin(url);
        int httpResponseCode = http.GET();

        if (httpResponseCode == 200) {
            String payload = http.getString();
            StaticJsonDocument<256> doc;
            DeserializationError error = deserializeJson(doc, payload);

            if (!error) {
                bool recordingState = doc["is_recording"];
                int elapsed = 0;
                if (doc.containsKey("elapsed_s") && !doc["elapsed_s"].isNull()) {
                    elapsed = doc["elapsed_s"];
                }
                is_recording = recordingState;
                ui_update_state(is_recording, elapsed);
            }
        } else {
            Serial.printf("Error getting status: %d\n", httpResponseCode);
            lv_label_set_text(label_status, "API ERROR");
            lv_obj_set_style_text_color(label_status, lv_color_hex(0xffa500), LV_PART_MAIN);
        }
        http.end();
    }
}

void btn_toggle_event_cb(lv_event_t *e) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        String url = String(API_BASE_URL) + "/api/recordings/toggle";
        http.begin(url);
        http.addHeader("Content-Type", "application/json");
        int httpResponseCode = http.POST("{}");

        if (httpResponseCode > 0) {
            Serial.printf("Toggle response: %d\n", httpResponseCode);
            pollServerStatus();
        } else {
            Serial.printf("Error on toggle: %s\n", http.errorToString(httpResponseCode).c_str());
        }
        http.end();
    }
}
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TFT_eSPI.h>
#include <lvgl.h>
#include <XPT2046_Touchscreen.h>

#include "config.h"
#include "ui.h"

// TFT and Touch settings (CYD standard)
#define XPT2046_IRQ 36
#define XPT2046_MOSI 32
#define XPT2046_MISO 39
#define XPT2046_CLK 25
#define XPT2046_CS 33

SPIClass touchSPI(VSPI);
XPT2046_Touchscreen ts(XPT2046_CS, XPT2046_IRQ);

TFT_eSPI tft = TFT_eSPI();

/* LVGL display flushing */
void my_disp_flush(lv_disp_drv_t *disp_drv, const lv_area_t *area, lv_color_t *color_p) {
    uint32_t w = (area->x2 - area->x1 + 1);
    uint32_t h = (area->y2 - area->y1 + 1);

    tft.startWrite();
    tft.setAddrWindow(area->x1, area->y1, w, h);
    tft.pushColors((uint16_t *)&color_p->full, w * h, true);
    tft.endWrite();

    lv_disp_flush_ready(disp_drv);
}

/* LVGL touch input reading */
void my_touchpad_read(lv_indev_drv_t *indev_drv, lv_indev_data_t *data) {
    if (ts.tirqTouched() && ts.touched()) {
        TS_Point p = ts.getPoint();
        
        // Calibration for CYD
        // Adjust these mapping values based on your specific screen
        data->point.x = map(p.x, 200, 3700, 1, 320); 
        data->point.y = map(p.y, 240, 3800, 1, 240);
        data->state = LV_INDEV_STATE_PR;
    } else {
        data->state = LV_INDEV_STATE_REL;
    }
}

unsigned long lastPollTime = 0;
bool is_recording = false;

void setup() {
    Serial.begin(115200);

    // Initialize TFT
    tft.begin();
    tft.setRotation(1); // Landscape
    tft.fillScreen(TFT_BLACK);

    // Initialize Touch
    touchSPI.begin(XPT2046_CLK, XPT2046_MISO, XPT2046_MOSI, XPT2046_CS);
    ts.begin(touchSPI);
    ts.setRotation(1);

    // Initialize LVGL
    lv_init();
    
    static lv_disp_draw_buf_t draw_buf;
    static lv_color_t buf[320 * 24]; // 1/10 screen size buffer
    lv_disp_draw_buf_init(&draw_buf, buf, NULL, 320 * 24);

    static lv_disp_drv_t disp_drv;
    lv_disp_drv_init(&disp_drv);
    disp_drv.hor_res = 320;
    disp_drv.ver_res = 240;
    disp_drv.flush_cb = my_disp_flush;
    disp_drv.draw_buf = &draw_buf;
    lv_disp_drv_register(&disp_drv);

    static lv_indev_drv_t indev_drv;
    lv_indev_drv_init(&indev_drv);
    indev_drv.type = LV_INDEV_TYPE_POINTER;
    indev_drv.read_cb = my_touchpad_read;
    lv_indev_drv_register(&indev_drv);

    // Init UI
    ui_init();

    // Connect to WiFi
    lv_label_set_text(label_status, "Connecting WiFi...");
    lv_task_handler(); // Update screen

    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected.");
    
    lv_label_set_text(label_status, "WiFi Connected!");
    lv_task_handler();
    delay(1000); // Give user a moment to see the message
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
            lv_obj_set_style_text_color(label_status, lv_color_hex(0xffa500), LV_PART_MAIN); // Orange
        }
        http.end();
    }
}

// Called by LVGL when button is clicked
void btn_toggle_event_cb(lv_event_t * e) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        String url = String(API_BASE_URL) + "/api/recordings/toggle";
        
        http.begin(url);
        http.addHeader("Content-Type", "application/json");
        // Start toggle request (empty body POST)
        int httpResponseCode = http.POST("{}");
        
        if (httpResponseCode > 0) {
            Serial.printf("Toggle response: %d\n", httpResponseCode);
            // Immediately force a poll to update UI faster
            pollServerStatus();
        } else {
            Serial.printf("Error on toggle: %s\n", http.errorToString(httpResponseCode).c_str());
        }
        http.end();
    }
}

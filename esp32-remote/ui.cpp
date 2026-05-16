#include "ui.h"
#include <stdio.h>

lv_obj_t * screen_main;
lv_obj_t * btn_toggle;
lv_obj_t * label_btn;
lv_obj_t * label_status;
lv_obj_t * label_time;
lv_obj_t * label_mode;

static lv_style_t style_btn_idle;
static lv_style_t style_btn_recording;

// Forward declaration of the event callback (defined in main sketch)
extern void btn_toggle_event_cb(lv_event_t * e);

void ui_init(void) {
    screen_main = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(screen_main, lv_color_hex(0x1a1a1a), LV_PART_MAIN);

    // Status Label
    label_status = lv_label_create(screen_main);
    lv_label_set_text(label_status, "Connecting...");
    lv_obj_set_style_text_color(label_status, lv_color_hex(0xFFFFFF), LV_PART_MAIN);
    lv_obj_set_style_text_font(label_status, &lv_font_montserrat_20, LV_PART_MAIN);
    lv_obj_align(label_status, LV_ALIGN_TOP_MID, 0, 20);

    // Time Label
    label_time = lv_label_create(screen_main);
    lv_label_set_text(label_time, "00:00");
    lv_obj_set_style_text_color(label_time, lv_color_hex(0xAAAAAA), LV_PART_MAIN);
    lv_obj_set_style_text_font(label_time, &lv_font_montserrat_24, LV_PART_MAIN);
    lv_obj_align(label_time, LV_ALIGN_TOP_MID, 0, 60);

    // Mode Label
    label_mode = lv_label_create(screen_main);
    lv_label_set_text(label_mode, "WIFI");
    lv_obj_set_style_text_color(label_mode, lv_color_hex(0x888888), LV_PART_MAIN);
    // lv_font_montserrat_16 might not be available by default if not enabled in lv_conf.h
    // Let's use the default font or the same size 20 if we want it to be simple.
    // I'll just use lv_font_montserrat_20 for simplicity and scale.
    lv_obj_set_style_text_font(label_mode, &lv_font_montserrat_20, LV_PART_MAIN);
    lv_obj_align(label_mode, LV_ALIGN_TOP_RIGHT, -10, 10);

    // Button Styles
    lv_style_init(&style_btn_idle);
    lv_style_set_bg_color(&style_btn_idle, lv_color_hex(0x28a745)); // Green
    lv_style_set_bg_grad_color(&style_btn_idle, lv_color_hex(0x218838));
    lv_style_set_bg_grad_dir(&style_btn_idle, LV_GRAD_DIR_VER);
    lv_style_set_radius(&style_btn_idle, 20);
    lv_style_set_shadow_width(&style_btn_idle, 10);
    lv_style_set_shadow_color(&style_btn_idle, lv_color_hex(0x000000));
    lv_style_set_shadow_ofs_y(&style_btn_idle, 5);
    
    lv_style_init(&style_btn_recording);
    lv_style_set_bg_color(&style_btn_recording, lv_color_hex(0xdc3545)); // Red
    lv_style_set_bg_grad_color(&style_btn_recording, lv_color_hex(0xc82333));
    lv_style_set_bg_grad_dir(&style_btn_recording, LV_GRAD_DIR_VER);
    lv_style_set_radius(&style_btn_recording, 20);

    // Main Button
    btn_toggle = lv_btn_create(screen_main);
    lv_obj_set_size(btn_toggle, 200, 80);
    lv_obj_align(btn_toggle, LV_ALIGN_CENTER, 0, 20);
    lv_obj_add_style(btn_toggle, &style_btn_idle, 0);
    lv_obj_add_event_cb(btn_toggle, btn_toggle_event_cb, LV_EVENT_CLICKED, NULL);

    // Button Label
    label_btn = lv_label_create(btn_toggle);
    lv_label_set_text(label_btn, "START");
    lv_obj_set_style_text_font(label_btn, &lv_font_montserrat_24, LV_PART_MAIN);
    lv_obj_center(label_btn);

    lv_disp_load_scr(screen_main);
}

void ui_update_state(bool is_recording, int elapsed_s) {
    if (is_recording) {
        lv_obj_add_style(btn_toggle, &style_btn_recording, 0);
        lv_obj_remove_style(btn_toggle, &style_btn_idle, 0);
        lv_label_set_text(label_btn, "STOP");
        lv_label_set_text(label_status, "RECORDING");
        lv_obj_set_style_text_color(label_status, lv_color_hex(0xff0000), LV_PART_MAIN);

        int mins = elapsed_s / 60;
        int secs = elapsed_s % 60;
        char time_str[16];
        snprintf(time_str, sizeof(time_str), "%02d:%02d", mins, secs);
        lv_label_set_text(label_time, time_str);
    } else {
        lv_obj_add_style(btn_toggle, &style_btn_idle, 0);
        lv_obj_remove_style(btn_toggle, &style_btn_recording, 0);
        lv_label_set_text(label_btn, "START");
        lv_label_set_text(label_status, "READY");
        lv_obj_set_style_text_color(label_status, lv_color_hex(0x28a745), LV_PART_MAIN);
        lv_label_set_text(label_time, "00:00");
    }
}

void ui_set_mode(bool is_wifi) {
    if (is_wifi) {
        lv_label_set_text(label_mode, "WIFI");
        lv_obj_set_style_text_color(label_mode, lv_color_hex(0x00A2FF), LV_PART_MAIN); // Blue
    } else {
        lv_label_set_text(label_mode, "USB");
        lv_obj_set_style_text_color(label_mode, lv_color_hex(0x888888), LV_PART_MAIN); // Gray
    }
}

#ifndef UI_H
#define UI_H

#include <lvgl.h>

extern lv_obj_t * screen_main;
extern lv_obj_t * btn_toggle;
extern lv_obj_t * label_btn;
extern lv_obj_t * label_status;
extern lv_obj_t * label_time;
extern lv_obj_t * label_mode;

void ui_init(void);
void ui_update_state(bool is_recording, int elapsed_s);
void ui_set_mode(bool is_wifi);

#endif // UI_H

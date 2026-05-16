#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Backend Configuration
// Replace with the IP address of the MeetingPi server (e.g., Raspberry Pi)
const char* API_BASE_URL = "http://192.168.1.100:8000";

// Polling Interval for Status (ms)
const int STATUS_POLL_INTERVAL_MS = 2000;

#endif // CONFIG_H

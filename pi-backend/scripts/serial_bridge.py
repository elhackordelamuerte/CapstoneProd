#!/usr/bin/env python3
"""
Serial Bridge for MeetingPi ESP32 Remote.
Listens on the serial port for commands and proxies them to the FastAPI backend.
Also polls the backend status and sends it to the ESP32 via Serial.
"""

import os
import sys
import time
import threading
import requests
import serial
import json
from serial.tools import list_ports

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api/recordings")
BAUD_RATE = 115200
POLL_INTERVAL = 2.0  # seconds

def find_esp32_port():
    """Attempt to find the ESP32 serial port automatically."""
    ports = list_ports.comports()
    for port in ports:
        # Common USB-to-Serial chips used in CYD/ESP32: CH340, CP210x
        if "CH340" in port.description or "CP210" in port.description or "USB" in port.device:
            return port.device
    
    # Fallback to standard Pi USB devices if unable to match description
    for p in ["/dev/ttyUSB0", "/dev/ttyACM0"]:
        if os.path.exists(p):
            return p
    return None

def status_polling_thread(ser):
    """Background thread to poll API status and send it via Serial."""
    while True:
        try:
            resp = requests.get(f"{API_BASE_URL}/status", timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                is_recording = data.get("is_recording", False)
                if is_recording:
                    elapsed = data.get("elapsed_s", 0)
                    msg = f"STATUS:RECORDING:{elapsed}\n"
                else:
                    msg = "STATUS:IDLE\n"
                
                ser.write(msg.encode('utf-8'))
        except requests.exceptions.RequestException as e:
            print(f"Error polling status: {e}", file=sys.stderr)
        
        time.sleep(POLL_INTERVAL)

def main():
    config_port = None
    config_path = os.path.join(os.path.dirname(__file__), "..", "bridge_config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                cfg = json.load(f)
                config_port = cfg.get("port")
        except Exception:
            pass

    port_name = config_port or os.getenv("SERIAL_PORT") or find_esp32_port()
    if not port_name:
        print("Error: Could not automatically find ESP32 Serial port.", file=sys.stderr)
        sys.exit(1)

    print(f"Starting Serial Bridge on {port_name} at {BAUD_RATE} baud.")
    
    try:
        ser = serial.Serial(port_name, BAUD_RATE, timeout=1)
    except serial.SerialException as e:
        print(f"Failed to open port {port_name}: {e}", file=sys.stderr)
        sys.exit(1)

    # Start status polling thread
    poller = threading.Thread(target=status_polling_thread, args=(ser,), daemon=True)
    poller.start()

    # Main loop reading from Serial
    while True:
        try:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line == "CMD:TOGGLE":
                    print("Received TOGGLE command from USB. Forwarding to API...")
                    try:
                        requests.post(f"{API_BASE_URL}/toggle", timeout=5)
                    except requests.exceptions.RequestException as e:
                        print(f"API Error on toggle: {e}", file=sys.stderr)
            time.sleep(0.05)
        except KeyboardInterrupt:
            print("Exiting...")
            break
        except Exception as e:
            print(f"Serial read error: {e}", file=sys.stderr)
            time.sleep(1)

if __name__ == "__main__":
    main()

#!/bin/bash
# setup_ip.sh - Automatically configure Raspberry Pi IP and update project environments
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== MeetingPi IP Setup ===${NC}"

# Detect current IP
CURRENT_IP=$(hostname -I | awk '{print $1}')
if [ -z "$CURRENT_IP" ]; then
    echo -e "${RED}Error: Could not detect current IP address.${NC}"
    exit 1
fi

echo -e "Detected IP: ${GREEN}$CURRENT_IP${NC}"

# --- OPTIONAL: SET STATIC IP (Only if run on Pi) ---
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo ""
    read -p "Do you want to set a STATIC IP for this Raspberry Pi? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter desired static IP (e.g., 192.168.1.100): " STATIC_IP
        read -p "Enter routers/gateway IP (e.g., 192.168.1.1): " GATEWAY_IP
        read -p "Enter DNS IP (e.g., 8.8.8.8): " DNS_IP

        if command -v nmcli &> /dev/null; then
            # Bookworm / NetworkManager
            echo -e "${YELLOW}Configuring NetworkManager...${NC}"
            CONN_NAME=$(nmcli -t -f NAME connection show --active | head -n 1)
            sudo nmcli con mod "$CONN_NAME" ipv4.addresses "$STATIC_IP/24" ipv4.gateway "$GATEWAY_IP" ipv4.dns "$DNS_IP" ipv4.method manual
            sudo nmcli con up "$CONN_NAME"
            CURRENT_IP=$STATIC_IP
        else
            # Bullseye / dhcpcd
            echo -e "${YELLOW}Configuring /etc/dhcpcd.conf...${NC}"
            sudo cp /etc/dhcpcd.conf /etc/dhcpcd.conf.bak
            CONTENT="interface eth0
static ip_address=$STATIC_IP/24
static routers=$GATEWAY_IP
static domain_name_servers=$DNS_IP

interface wlan0
static ip_address=$STATIC_IP/24
static routers=$GATEWAY_IP
static domain_name_servers=$DNS_IP"
            
            echo "$CONTENT" | sudo tee -a /etc/dhcpcd.conf > /dev/null
            sudo systemctl restart dhcpcd
            CURRENT_IP=$STATIC_IP
        fi
        echo -e "${GREEN}Static IP configured: $CURRENT_IP${NC}"
    fi
fi

# --- UPDATE CONFIG FILES ---
echo -e "\n${BLUE}Updating project configurations...${NC}"

# 1. Update pi-backend/.env
BACKEND_ENV="$(dirname "$0")/../.env"
if [ -f "$BACKEND_ENV" ]; then
    sed -i "s|NEXT_PUBLIC_PI_API_URL=.*|NEXT_PUBLIC_PI_API_URL=http://$CURRENT_IP:8000|" "$BACKEND_ENV"
    echo -e "✓ Updated ${YELLOW}pi-backend/.env${NC}"
fi

# 2. Update crm-frontend/.env.local (relative to this script)
FRONTEND_ENV="$(dirname "$0")/../../crm-frontend/.env.local"
if [ -f "$FRONTEND_ENV" ]; then
    # Use | as delimiter for sed to handle slashes in URL
    sed -i "s|NEXT_PUBLIC_PI_API_URL=.*|NEXT_PUBLIC_PI_API_URL=http://$CURRENT_IP:8000|" "$FRONTEND_ENV"
    echo -e "✓ Updated ${YELLOW}crm-frontend/.env.local${NC}"
else
    echo -e "${YELLOW}Warning: crm-frontend/.env.local not found at $FRONTEND_ENV${NC}"
fi

echo -e "\n${GREEN}Success!${NC}"
echo -e "Your MeetingPi API is now reachable at: ${BLUE}http://$CURRENT_IP:8000${NC}"
echo -e "Your Frontend is configured to connect to this IP."

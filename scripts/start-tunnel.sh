#!/bin/bash

# Cloudflare Tunnel Script for Stripe Auto-Hitter
# Creates a free public URL (no account needed)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        🌐 Cloudflare Tunnel - Free Public URL              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} cloudflared not found!"
    echo "Installing now..."
    
    ARCH=$(uname -m)
    if [[ "$ARCH" == "x86_64" ]]; then
        CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
    elif [[ "$ARCH" == "aarch64" ]]; then
        CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
    else
        CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-386"
    fi
    
    sudo wget -q "$CF_URL" -O /usr/local/bin/cloudflared
    sudo chmod +x /usr/local/bin/cloudflared
    echo -e "${GREEN}[SUCCESS]${NC} cloudflared installed"
fi

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}[WARNING]${NC} Server is not running on port 3000!"
    echo "Please start the server first:"
    echo "  ./start.sh"
    echo ""
    read -p "Do you want to start the server now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./start.sh &
        echo "Waiting for server to start..."
        sleep 5
    else
        exit 1
    fi
fi

echo -e "${BLUE}[INFO]${NC} Starting Cloudflare tunnel..."
echo -e "${BLUE}[INFO]${NC} This will create a free public URL"
echo ""
echo -e "${YELLOW}⚠️  Note:${NC} This URL is temporary and will change each time"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${BLUE}[INFO]${NC} Stopping tunnel..."
    if [ -n "$TUNNEL_PID" ]; then
        kill $TUNNEL_PID 2>/dev/null
    fi
    echo -e "${GREEN}[SUCCESS]${NC} Tunnel stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start the tunnel
cloudflared tunnel --url http://localhost:3000 &
TUNNEL_PID=$!

echo -e "${BLUE}[INFO]${NC} Waiting for tunnel to establish..."
sleep 5

# Extract the URL from cloudflared output
attempts=0
max_attempts=30

while [ $attempts -lt $max_attempts ]; do
    TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cloudflared.log 2>/dev/null || echo "")
    
    if [ -n "$TUNNEL_URL" ]; then
        echo ""
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║              🎉 TUNNEL ESTABLISHED!                        ║"
        echo "╠════════════════════════════════════════════════════════════╣"
        echo "║                                                            ║"
        echo -e "║  ${CYAN}Public URL:${NC}                                    ║"
        echo -e "║  ${GREEN}$TUNNEL_URL${NC}                    ║"
        echo "║                                                            ║"
        echo "║  📱 Open this URL on your phone or any browser             ║"
        echo "║                                                            ║"
        echo "║  ⚠️  This URL is temporary and will expire when you stop   ║"
        echo "║     the tunnel. Restart to get a new URL.                  ║"
        echo "║                                                            ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        echo -e "${BLUE}[INFO]${NC} Tunnel is running. Press Ctrl+C to stop."
        echo ""
        
        # Keep the script running
        wait $TUNNEL_PID
        exit 0
    fi
    
    attempts=$((attempts + 1))
    sleep 1
done

echo -e "${RED}[ERROR]${NC} Failed to get tunnel URL after $max_attempts attempts"
kill $TUNNEL_PID 2>/dev/null
exit 1

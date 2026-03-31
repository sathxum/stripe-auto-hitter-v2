#!/bin/bash

# Stripe Auto-Hitter VPS Setup Script
# This script sets up the entire environment on a fresh VPS

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🚀 Stripe Auto-Hitter VPS Setup Script v2.0            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_warning "Running as root. Some operations may require root privileges."
fi

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    print_error "Unsupported operating system: $OSTYPE"
    exit 1
fi

print_status "Detected OS: $OS"

# Update system packages
print_status "Updating system packages..."
if [[ "$DISTRO" == "ubuntu" ]] || [[ "$DISTRO" == "debian" ]]; then
    apt-get update -qq
    apt-get upgrade -y -qq
elif [[ "$DISTRO" == "centos" ]] || [[ "$DISTRO" == "rhel" ]] || [[ "$DISTRO" == "fedora" ]]; then
    yum update -y -q
fi
print_success "System packages updated"

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    print_status "Node.js not found. Installing Node.js 18.x..."
    
    if [[ "$DISTRO" == "ubuntu" ]] || [[ "$DISTRO" == "debian" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs -qq
    elif [[ "$DISTRO" == "centos" ]] || [[ "$DISTRO" == "rhel" ]] || [[ "$DISTRO" == "fedora" ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs -q
    fi
    
    print_success "Node.js installed: $(node --version)"
else
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ "$NODE_VERSION" -lt 16 ]]; then
        print_warning "Node.js version is below 16. Please upgrade to Node.js 16+"
        exit 1
    fi
    print_success "Node.js found: $(node --version)"
fi

# Install npm packages
print_status "Installing npm dependencies..."
npm install
print_success "Dependencies installed"

# Install Puppeteer dependencies (Chrome)
print_status "Installing Puppeteer dependencies..."
if [[ "$DISTRO" == "ubuntu" ]] || [[ "$DISTRO" == "debian" ]]; then
    apt-get install -y -qq \
        ca-certificates \
        fonts-liberation \
        libappindicator3-1 \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgbm1 \
        libgcc1 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libstdc++6 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        lsb-release \
        wget \
        xdg-utils
elif [[ "$DISTRO" == "centos" ]] || [[ "$DISTRO" == "rhel" ]] || [[ "$DISTRO" == "fedora" ]]; then
    yum install -y -q \
        alsa-lib \
        atk \
        cups-libs \
        gtk3 \
        libXcomposite \
        libXcursor \
        libXdamage \
        libXext \
        libXi \
        libXrandr \
        libXScrnSaver \
        libXtst \
        pango \
        xorg-x11-fonts-100dpi \
        xorg-x11-fonts-75dpi \
        xorg-x11-fonts-cyrillic \
        xorg-x11-fonts-misc \
        xorg-x11-fonts-Type1 \
        xorg-x11-utils
fi
print_success "Puppeteer dependencies installed"

# Download and install cloudflared
print_status "Installing Cloudflare Tunnel (cloudflared)..."
if ! command -v cloudflared &> /dev/null; then
    if [[ "$OS" == "linux" ]]; then
        ARCH=$(uname -m)
        if [[ "$ARCH" == "x86_64" ]]; then
            CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
        elif [[ "$ARCH" == "aarch64" ]]; then
            CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
        else
            CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-386"
        fi
        
        wget -q "$CF_URL" -O /usr/local/bin/cloudflared
        chmod +x /usr/local/bin/cloudflared
    fi
    print_success "Cloudflare Tunnel installed"
else
    print_success "Cloudflare Tunnel already installed"
fi

# Create necessary directories
print_status "Creating directories..."
mkdir -p logs
mkdir -p screenshots
print_success "Directories created"

# Create systemd service file (optional)
if [[ "$OS" == "linux" ]] && [[ -d /etc/systemd/system ]]; then
    print_status "Creating systemd service..."
    
    SERVICE_FILE="/etc/systemd/system/stripe-hitter.service"
    
    sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Stripe Auto-Hitter Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which node) server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    print_success "Systemd service created"
    print_status "To enable auto-start on boot: sudo systemctl enable stripe-hitter"
    print_status "To start service: sudo systemctl start stripe-hitter"
fi

# Create start script
print_status "Creating start script..."
cat > start.sh <<'EOF'
#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           🚀 Stripe Auto-Hitter - Starting...              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if already running
if pgrep -f "node server.js" > /dev/null; then
    echo "⚠️  Server is already running!"
    echo "   Stop it first with: pkill -f 'node server.js'"
    exit 1
fi

# Start the server
echo "📡 Starting server on port 3000..."
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server started successfully
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Server failed to start!"
    exit 1
fi

echo ""
echo "✅ Server started successfully!"
echo ""
echo "📱 Local URL: http://localhost:3000"
echo ""
echo "🌐 To expose to internet, run in another terminal:"
echo "   npm run tunnel"
echo ""
echo "⏹️  To stop the server:"
echo "   pkill -f 'node server.js'"
echo ""

# Keep script running
wait $SERVER_PID
EOF
chmod +x start.sh
print_success "Start script created"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ Setup Complete!                            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  Next steps:                                               ║"
echo "║  1. Start the server:    ./start.sh                        ║"
echo "║  2. In another terminal: npm run tunnel                    ║"
echo "║  3. Open the tunnel URL in your browser                    ║"
echo "║                                                            ║"
echo "║  Or use systemd:                                           ║"
echo "║  sudo systemctl start stripe-hitter                        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"

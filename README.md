# ⚡ Stripe Auto-Hitter Pro v2.0

> **VPS-Hosted Edition** - No browser extension needed! Run on any VPS with free Cloudflare tunnel for public access.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-Latest-orange.svg)](https://pptr.dev/)

## 🚀 Features

- ✅ **No Extension Required** - Runs directly on VPS with browser automation
- 📱 **Mobile-Friendly UI** - Responsive design works on any device
- 🌐 **Free Public URL** - Cloudflare tunnel (no account needed)
- 🎲 **BIN-Based Card Generation** - Generate valid test cards from any BIN
- ⏰ **Auto Session Refresh** - Automatically detects expired sessions
- 🔒 **Stealth Mode** - Undetectable browser automation
- 📊 **Real-time Progress** - Live updates via WebSocket
- 📥 **Export Results** - Download results as CSV
- ⚡ **Fast & Efficient** - Multi-threaded processing

## 📋 Requirements

- **VPS/Server** with Ubuntu 18.04+, Debian 10+, CentOS 7+, or any Linux distro
- **Node.js** 16+ (18+ recommended)
- **RAM** 1GB minimum (2GB recommended)
- **Root/SSH access** to install dependencies

## 🛠️ Quick Setup (One Command)

```bash
# 1. Clone or upload files to your VPS
cd /root  # or any directory you prefer

# 2. Run the automated setup
bash scripts/setup.sh

# 3. Start the server
./start.sh

# 4. In another terminal, start the tunnel
npm run tunnel
```

That's it! You'll get a public URL like `https://something.trycloudflare.com` - open it in any browser!

## 📖 Detailed Setup Instructions

### Step 1: Prepare Your VPS

Connect to your VPS via SSH:
```bash
ssh root@your-vps-ip
```

### Step 2: Upload Project Files

**Option A: Using Git**
```bash
git clone <your-repo-url> stripe-auto-hitter
cd stripe-auto-hitter
```

**Option B: Using SCP (from local machine)**
```bash
# On your local machine
scp -r stripe-auto-hitter root@your-vps-ip:/root/
```

**Option C: Using wget/curl**
```bash
# If you have a zip file hosted somewhere
wget https://your-domain.com/stripe-auto-hitter.zip
unzip stripe-auto-hitter.zip
cd stripe-auto-hitter
```

### Step 3: Run Setup Script

```bash
bash scripts/setup.sh
```

This will:
- ✅ Update system packages
- ✅ Install Node.js 18.x (if not present)
- ✅ Install all npm dependencies
- ✅ Install Chrome/Puppeteer dependencies
- ✅ Install Cloudflare Tunnel (cloudflared)
- ✅ Create start scripts
- ✅ Create systemd service (optional)

### Step 4: Start the Server

```bash
./start.sh
```

You should see output like:
```
╔════════════════════════════════════════════════════════════╗
║           🚀 Stripe Auto-Hitter - Starting...              ║
╚════════════════════════════════════════════════════════════╝

📡 Starting server on port 3000...

✅ Server started successfully!

📱 Local URL: http://localhost:3000

🌐 To expose to internet, run in another terminal:
   npm run tunnel
```

### Step 5: Create Public URL (Cloudflare Tunnel)

Open a **new terminal** (keep the server running) and run:

```bash
npm run tunnel
```

Or directly:
```bash
bash scripts/start-tunnel.sh
```

After a few seconds, you'll see:
```
╔════════════════════════════════════════════════════════════╗
║              🎉 TUNNEL ESTABLISHED!                        ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Public URL:                                               ║
║  https://abc123.trycloudflare.com                          ║
║                                                            ║
║  📱 Open this URL on your phone or any browser             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

**Copy this URL and open it in any browser!** 📱💻

## 🖥️ Usage Guide

### 1. Configure Your Session

Open the tunnel URL in your browser and fill in:

| Field | Description | Example |
|-------|-------------|---------|
| **Payment Link** | Your Stripe checkout URL | `https://buy.stripe.com/...` |
| **BIN** | First 6+ digits for card gen | `424242` |
| **Quantity** | Number of cards to try | `10` |
| **Delay** | Delay between attempts (ms) | `3000` |
| **Auto-refresh** | Auto-detect expired sessions | ✅ Enabled |

### 2. Start Automation

Click **"🚀 Start Automation"** and watch the magic happen!

### 3. Monitor Progress

- Real-time progress bar
- Live status logs
- Card-by-card results
- Success/failure tracking

### 4. Export Results

After completion, click **"📥 Export"** to download CSV with all results.

## 🔧 Advanced Configuration

### Environment Variables

Create a `.env` file for custom settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Puppeteer Configuration
PUPPETEER_HEADLESS=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Automation Settings
DEFAULT_DELAY=3000
DEFAULT_QUANTITY=10
MAX_RETRIES=3
```

### Systemd Service (Auto-start on Boot)

```bash
# Enable auto-start
sudo systemctl enable stripe-hitter

# Start service
sudo systemctl start stripe-hitter

# Check status
sudo systemctl status stripe-hitter

# View logs
sudo journalctl -u stripe-hitter -f
```

### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name "stripe-hitter"

# Save PM2 config
pm2 save
pm2 startup

# Monitor
pm2 monit
```

## 📱 Mobile Access

The UI is fully responsive and works perfectly on mobile:

1. Start the tunnel on your VPS
2. Copy the public URL
3. Open on your phone's browser
4. No app installation needed!

**Pro Tip:** Add the page to your home screen for app-like experience!

## 🔍 Troubleshooting

### Issue: "Server not starting"

```bash
# Check if port 3000 is in use
sudo lsof -i :3000

# Kill existing process
pkill -f 'node server.js'

# Try again
./start.sh
```

### Issue: "Chrome not found"

```bash
# Install Chrome manually (Ubuntu/Debian)
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable
```

### Issue: "Tunnel not working"

```bash
# Check cloudflared installation
cloudflared --version

# Try manual tunnel
cloudflared tunnel --url http://localhost:3000
```

### Issue: "Out of memory"

```bash
# Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 🌐 Supported VPS Providers

Tested and working on:

| Provider | Minimum Plan | Notes |
|----------|--------------|-------|
| **AWS EC2** | t2.micro (free tier) | 1GB RAM sufficient |
| **Google Cloud** | e2-micro (free tier) | Works perfectly |
| **DigitalOcean** | $5/mo droplet | Recommended |
| **Vultr** | $5/mo instance | Fast setup |
| **Linode** | Nanode $5/mo | Reliable |
| **Hetzner** | CX11 (€3/mo) | Best value |
| **Oracle Cloud** | Always Free tier | Completely free! |

## 🛡️ Security Notes

- The Cloudflare tunnel URL is temporary and changes on restart
- No authentication by default - add your own if needed
- Run behind reverse proxy (nginx) for production use
- Use firewall rules to restrict access if needed

### Add Basic Authentication (Optional)

```bash
# Install apache2-utils
sudo apt install apache2-utils

# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd admin

# Add to nginx config
location / {
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:3000;
}
```

## 📊 API Endpoints

The server also provides REST API:

### Generate Cards
```bash
POST /api/generate-cards
Content-Type: application/json

{
  "bin": "424242",
  "quantity": 10,
  "format": "standard"
}
```

### Validate BIN
```bash
POST /api/validate-bin
Content-Type: application/json

{
  "bin": "424242"
}
```

### Server Status
```bash
GET /api/status
```

## 🔄 Auto-Restart on Crash

Create a simple watchdog script:

```bash
#!/bin/bash
while true; do
    if ! pgrep -f "node server.js" > /dev/null; then
        echo "Server down, restarting..."
        cd /root/stripe-auto-hitter && ./start.sh
    fi
    sleep 10
done
```

Add to crontab:
```bash
@reboot /root/stripe-auto-hitter/watchdog.sh
```

## 📝 File Structure

```
stripe-auto-hitter/
├── server.js              # Main Express server
├── package.json           # Dependencies
├── README.md             # This file
├── start.sh              # Quick start script
├── .env                  # Environment variables (optional)
├── utils/
│   ├── stripe-automation.js   # Puppeteer automation
│   └── card-generator.js      # Card generation logic
├── public/               # Frontend files
│   ├── index.html        # Main UI
│   ├── app.js           # Frontend logic
│   └── sw.js            # Service worker (PWA)
├── scripts/              # Setup scripts
│   ├── setup.sh         # VPS setup
│   └── start-tunnel.sh  # Cloudflare tunnel
└── logs/                 # Log files (created on run)
```

## 🆘 Getting Help

If you encounter issues:

1. Check the logs in the terminal
2. Review the troubleshooting section above
3. Ensure all dependencies are installed
4. Try restarting the server

## ⚠️ Disclaimer

This tool is for **educational and testing purposes only**. Use responsibly and in accordance with Stripe's terms of service and applicable laws. The authors are not responsible for any misuse.

## 📄 License

MIT License - Feel free to modify and distribute!

---

**Made with ⚡ by the community**

If this helped you, consider starring the repo! ⭐

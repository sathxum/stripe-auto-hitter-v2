# ⚡ Stripe Auto-Hitter Pro v2.0

> **VPS-Hosted Edition** - No browser extension needed! Run on any VPS or Android (Termux) with free Cloudflare tunnel for public access.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Termux](https://img.shields.io/badge/Termux-Supported-orange.svg)](https://termux.dev/)

---

## 📱 TERMUX SETUP (Android) - Step by Step

### Step 1: Install Termux

1. Download Termux from **F-Droid** (recommended):
   - Go to: https://f-droid.org/packages/com.termux/
   - Download and install

2. **OR** from GitHub (if F-Droid doesn't work):
   - Go to: https://github.com/termux/termux-app/releases
   - Download `termux-app_v0.118.0+github-debug_universal.apk`
   - Install the APK

⚠️ **Important**: Do NOT use Play Store version - it's outdated!

---

### Step 2: Grant Storage Permission

Open Termux and run:

```bash
# Grant storage access (CRITICAL - needed to save files)
termux-setup-storage
```

When prompted, tap **"Allow"** to give storage permission.

Verify it worked:
```bash
ls ~/storage/shared
```

You should see your phone's folders (DCIM, Download, etc.)

---

### Step 3: Update Termux Packages

```bash
# Update package lists
pkg update

# Upgrade installed packages (type 'y' when asked)
pkg upgrade -y
```

---

### Step 4: Install Required Packages

```bash
# Install essential packages
pkg install -y git nodejs wget curl

# Verify installations
node --version
npm --version
git --version
```

You should see version numbers for all three.

---

### Step 5: Clone the Repository

```bash
# Navigate to home directory
cd ~

# Clone the repo
git clone https://github.com/sathxum/stripe-auto-hitter-v2.git

# Enter the directory
cd stripe-auto-hitter-v2

# List files to verify
ls
```

You should see: `package.json  public  README.md  scripts  server.js  utils`

---

### Step 6: Install Node Dependencies

```bash
# Install all npm packages (this may take 5-10 minutes)
npm install

# If you get errors, try with --force
npm install --force
```

---

### Step 7: Install Puppeteer Dependencies (Chrome)

```bash
# Install Chrome dependencies for Termux
pkg install -y chromium

# Set environment variable
export PUPPETEER_EXECUTABLE_PATH=$(which chromium)

# Verify Chrome is installed
which chromium
```

---

### Step 8: Start the Server

```bash
# Start the server
node server.js
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║           🚀 Stripe Auto-Hitter VPS Edition v2.0           ║
╠════════════════════════════════════════════════════════════╣
║  Server running on port: 3000                              ║
║  Local URL: http://localhost:3000                          ║
╚════════════════════════════════════════════════════════════╝
```

**Keep this terminal running!**

---

### Step 9: Get Public URL (New Session)

**Open a NEW Termux session** (swipe right from left edge → "New Session"):

```bash
# Navigate to project
cd ~/stripe-auto-hitter-v2

# Install cloudflared (one time)
pkg install -y cloudflared

# Start the tunnel
cloudflared tunnel --url http://localhost:3000
```

Wait 10-15 seconds. You'll see:
```
INF | Your quick Tunnel has been created! | url=https://xxxx.trycloudflare.com
```

**Copy this URL** - that's your public link! 🎉

---

### Step 10: Access From Browser

1. Open any browser on your phone (Chrome, Firefox, etc.)
2. Paste the URL: `https://xxxx.trycloudflare.com`
3. Start using the tool!

---

## 🖥️ VPS SETUP (Ubuntu/Debian/CentOS)

### Quick Deploy (3 Commands)

```bash
# 1. Clone repo
git clone https://github.com/sathxum/stripe-auto-hitter-v2.git
cd stripe-auto-hitter-v2

# 2. Run setup (installs everything)
bash scripts/setup.sh

# 3. Start server
./start.sh
```

### Get Public URL (New Terminal)
```bash
npm run tunnel
```

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **No Extension** | Runs directly with Puppeteer |
| **Mobile UI** | Fully responsive design |
| **Free Tunnel** | Cloudflare trycloudflare.com |
| **Auto Session Refresh** | Detects expired Stripe sessions |
| **BIN Generator** | Generate valid cards from any BIN |
| **Real-time Updates** | WebSocket live progress |
| **Export Results** | CSV download |

---

## 📋 Requirements

### For Termux (Android):
- Android 7.0+
- 2GB RAM recommended
- 500MB free storage
- Internet connection

### For VPS:
- Ubuntu 18.04+, Debian 10+, or CentOS 7+
- Node.js 16+ (18+ recommended)
- 1GB RAM minimum
- Root/SSH access

---

## 🛠️ Common Issues & Fixes

### Issue: "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: "Chrome not found" (Termux)
```bash
# Reinstall chromium
pkg reinstall chromium
export PUPPETEER_EXECUTABLE_PATH=$(which chromium)
```

### Issue: "Port already in use"
```bash
# Kill existing process
pkill -f "node server.js"

# Or use different port
PORT=3001 node server.js
```

### Issue: "Permission denied" (scripts)
```bash
# Make scripts executable
chmod +x scripts/*.sh
chmod +x start.sh
```

### Issue: Tunnel not working
```bash
# Try manual tunnel
cloudflared tunnel --url http://localhost:3000
```

---

## 📁 File Structure

```
stripe-auto-hitter-v2/
├── server.js              # Main Express + WebSocket server
├── package.json           # Dependencies
├── start.sh              # Quick start script
├── .env.example          # Config template
├── README.md             # This file
│
├── utils/
│   ├── stripe-automation.js   # Puppeteer automation
│   └── card-generator.js      # BIN card generator
│
├── public/               # Frontend (mobile-friendly)
│   ├── index.html        # Main UI
│   ├── app.js           # Frontend logic
│   └── sw.js            # Service worker
│
└── scripts/
    ├── setup.sh         # VPS setup
    └── start-tunnel.sh  # Cloudflare tunnel
```

---

## 🎯 Usage Guide

### 1. Configure Your Session

Open the tunnel URL and fill in:

| Field | Description | Example |
|-------|-------------|---------|
| **Payment Link** | Stripe checkout URL | `https://buy.stripe.com/...` |
| **BIN** | First 6+ digits | `424242` |
| **Quantity** | Cards to try | `10` |
| **Delay** | Delay in ms | `3000` |

### 2. Start Automation

Click **"🚀 Start Automation"**

### 3. Monitor Progress

- Real-time progress bar
- Live status logs
- Card-by-card results

### 4. Export Results

Click **"📥 Export"** to download CSV.

---

## 🔧 Advanced Configuration

### Environment Variables (.env file)

```bash
# Create .env file
cp .env.example .env

# Edit with nano
nano .env
```

```env
PORT=3000
NODE_ENV=production
PUPPETEER_HEADLESS=true
DEFAULT_DELAY=3000
DEFAULT_QUANTITY=10
```

---

## ⚠️ Disclaimer

This tool is for **educational and testing purposes only**. Use responsibly and in accordance with Stripe's terms of service and applicable laws.

---

## 📄 License

MIT License - Feel free to modify and distribute!

---

**Made with ⚡ by the community**

⭐ Star the repo if this helped you!

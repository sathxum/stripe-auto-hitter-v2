# 📱 TERMUX (Android) Complete Setup Guide

> Step-by-step guide to run Stripe Auto-Hitter on your Android phone using Termux

---

## ⚠️ BEFORE YOU START

1. **Use F-Droid version of Termux** (NOT Play Store)
2. **Need 2GB+ RAM** for smooth operation
3. **Stable internet** required
4. **500MB+ free storage**

---

## 📥 STEP 1: Install Termux

### Method A: F-Droid (Recommended)

1. Open browser on your phone
2. Go to: **https://f-droid.org/packages/com.termux/**
3. Download `F-Droid` app first (if not installed)
4. Open F-Droid app
5. Search for "Termux"
6. Tap "Install"

### Method B: Direct APK Download

1. Go to: **https://github.com/termux/termux-app/releases**
2. Find latest release
3. Download: `termux-app_v0.118.0+github-debug_universal.apk`
4. Install the APK (allow "Unknown sources" if asked)

---

## 🔐 STEP 2: Grant Storage Permission

This is **CRITICAL** - without this, you can't save files!

```bash
termux-setup-storage
```

You will see a popup → Tap **"Allow"**

### Verify it worked:
```bash
ls ~/storage/shared
```

Should show folders like: `DCIM  Download  Documents  Movies  Music  Pictures`

If you see these, storage access is working! ✅

---

## 🔄 STEP 3: Update Termux Packages

```bash
# Update package lists (takes 1-2 minutes)
pkg update
```

When you see "Do you want to continue? [Y/n]" → Type **Y** and press Enter

```bash
# Upgrade all packages (takes 3-5 minutes)
pkg upgrade -y
```

---

## 📦 STEP 4: Install Required Packages

### Install one by one (recommended for beginners):

```bash
# Install git
pkg install -y git

# Install Node.js (includes npm)
pkg install -y nodejs

# Install wget
pkg install -y wget

# Install curl
pkg install -y curl
```

### Or install all at once:
```bash
pkg install -y git nodejs wget curl
```

### Verify installations:
```bash
node --version
npm --version
git --version
```

You should see version numbers like:
```
v18.16.0
9.5.1
git version 2.40.0
```

---

## 📂 STEP 5: Download the Project

### Option A: Clone from GitHub (Recommended)

```bash
# Go to home directory
cd ~

# Clone the repository
git clone https://github.com/sathxum/stripe-auto-hitter-v2.git

# Enter the project folder
cd stripe-auto-hitter-v2

# List files
ls
```

You should see:
```
package.json  public  QUICKSTART.md  README.md  scripts  server.js  utils
```

### Option B: Download as ZIP

If git doesn't work:

```bash
cd ~
wget https://github.com/sathxum/stripe-auto-hitter-v2/archive/refs/heads/main.zip
pkg install -y unzip
unzip main.zip
cd stripe-auto-hitter-v2-main
```

---

## 📥 STEP 6: Install Node Dependencies

```bash
# Install all required packages (takes 5-10 minutes)
npm install
```

⚠️ **Be patient!** This downloads Puppeteer and other heavy packages.

### If you get errors:

```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules
npm install --force
```

### Verify installation:
```bash
ls node_modules | head -10
```

Should show folders like: `express  puppeteer  ws  uuid`

---

## 🌐 STEP 7: Install Chrome (Chromium)

Puppeteer needs Chrome to work:

```bash
# Install Chromium browser
pkg install -y chromium
```

### Set environment variable:
```bash
export PUPPETEER_EXECUTABLE_PATH=$(which chromium)
```

### Make it permanent:
```bash
echo 'export PUPPETEER_EXECUTABLE_PATH=$(which chromium)' >> ~/.bashrc
```

### Verify Chrome:
```bash
which chromium
chromium --version
```

---

## 🚀 STEP 8: Start the Server

```bash
# Start the server
node server.js
```

### Expected output:
```
╔════════════════════════════════════════════════════════════╗
║           🚀 Stripe Auto-Hitter VPS Edition v2.0           ║
╠════════════════════════════════════════════════════════════╣
║  Server running on port: 3000                              ║
║  Local URL: http://localhost:3000                          ║
║                                                            ║
║  To expose via Cloudflare Tunnel:                          ║
║  npm run tunnel                                            ║
╚════════════════════════════════════════════════════════════╝
```

**✅ Server is running!**

⚠️ **DO NOT CLOSE THIS TERMINAL!** Keep it running.

---

## 🌍 STEP 9: Create Public URL (Cloudflare Tunnel)

You need a **NEW Termux session** for this:

### Open New Session:
1. Swipe from **left edge to right** (or tap the sidebar icon)
2. Tap **"NEW SESSION"**
3. A new terminal window opens

### In the NEW session:

```bash
# Go to project folder
cd ~/stripe-auto-hitter-v2

# Install cloudflared (one-time setup)
pkg install -y cloudflared

# Start the tunnel
cloudflared tunnel --url http://localhost:3000
```

### Wait 10-15 seconds...

You will see:
```
INF | Your quick Tunnel has been created! | url=https://abc123-def456.trycloudflare.com
```

### 🎉 THIS IS YOUR PUBLIC URL!

**Copy the full URL** (looks like: `https://abc123-def456.trycloudflare.com`)

---

## 📱 STEP 10: Access in Browser

1. Open **Chrome** or any browser on your phone
2. Paste the URL: `https://abc123-def456.trycloudflare.com`
3. The Stripe Auto-Hitter UI will load!

### Bookmark it for easy access:
- Tap the ⭐ star in browser
- Add to home screen for app-like experience

---

## 🔄 How to Use

### Start New Session:

1. **Open the tunnel URL** in browser
2. **Enter details:**
   - **Payment Link**: Your Stripe checkout URL
   - **BIN**: First 6 digits (e.g., `424242`)
   - **Quantity**: Number of cards to try
   - **Delay**: Time between attempts (ms)

3. **Click "🚀 Start Automation"**
4. **Watch progress** in real-time
5. **Export results** when done

---

## ⏹️ How to Stop

### Stop the Tunnel:
- In the tunnel terminal → Press **Ctrl + C**

### Stop the Server:
- In the server terminal → Press **Ctrl + C**

### Stop Everything:
```bash
# Run in any terminal
pkill -f "node server.js"
pkill -f "cloudflared"
```

---

## 🔄 Restart After Closing

If you close Termux and want to restart:

### 1. Open Termux

### 2. Start Server:
```bash
cd ~/stripe-auto-hitter-v2
node server.js
```

### 3. Open New Session (swipe left → New Session)

### 4. Start Tunnel:
```bash
cd ~/stripe-auto-hitter-v2
cloudflared tunnel --url http://localhost:3000
```

### 5. Copy new URL and use it!

⚠️ **Note**: URL changes every time you restart the tunnel!

---

## 🛠️ TROUBLESHOOTING

### Problem: "command not found: node"
```bash
# Reinstall Node.js
pkg reinstall nodejs
```

### Problem: "Cannot find module 'express'"
```bash
# Reinstall dependencies
cd ~/stripe-auto-hitter-v2
rm -rf node_modules
npm install
```

### Problem: "Chrome not found"
```bash
# Reinstall Chromium
pkg reinstall chromium
export PUPPETEER_EXECUTABLE_PATH=$(which chromium)
```

### Problem: "Port 3000 already in use"
```bash
# Kill existing process
pkill -f "node server.js"

# Or use different port
PORT=3001 node server.js
```

### Problem: "Out of memory"
```bash
# Clear cache
pkg clean

# Close other apps on your phone
# Restart Termux
```

### Problem: Tunnel shows "connection refused"
```bash
# Make sure server is running first!
# Check server status
curl http://localhost:3000

# If no response, restart server
```

### Problem: "Storage permission denied"
```bash
# Re-run storage setup
termux-setup-storage

# Then allow in popup
```

---

## 💡 PRO TIPS

### 1. Use tmux to keep running after closing
```bash
# Install tmux
pkg install -y tmux

# Start new session
tmux new -s stripe

# Run server
node server.js

# Detach: Press Ctrl+B, then D

# Reattach later:
tmux attach -t stripe
```

### 2. Create shortcut script
```bash
# Create start script
cat > ~/start-stripe.sh << 'EOF'
#!/bin/bash
cd ~/stripe-auto-hitter-v2
export PUPPETEER_EXECUTABLE_PATH=$(which chromium)
node server.js
EOF

chmod +x ~/start-stripe.sh

# Now just run:
~/start-stripe.sh
```

### 3. Auto-start tunnel script
```bash
cat > ~/start-tunnel.sh << 'EOF'
#!/bin/bash
cd ~/stripe-auto-hitter-v2
cloudflared tunnel --url http://localhost:3000
EOF

chmod +x ~/start-tunnel.sh
```

---

## 📊 System Requirements Check

Run this to check if your phone can handle it:

```bash
# Check RAM (need 2GB+)
free -h

# Check storage (need 500MB+)
df -h ~

# Check CPU
cat /proc/cpuinfo | grep "model name"
```

---

## ✅ CHECKLIST

Before asking for help, verify:

- [ ] Termux installed from F-Droid
- [ ] Storage permission granted (`termux-setup-storage`)
- [ ] Packages updated (`pkg update` done)
- [ ] Node.js installed (`node --version` works)
- [ ] Project cloned (`ls ~/stripe-auto-hitter-v2` shows files)
- [ ] Dependencies installed (`ls node_modules` shows folders)
- [ ] Chromium installed (`which chromium` shows path)
- [ ] Server running (shows the banner)
- [ ] Tunnel running (shows the URL)

---

## 🆘 STILL HAVING ISSUES?

1. **Restart Termux completely** (force close and reopen)
2. **Start fresh** - delete and re-clone
3. **Check internet connection**
4. **Free up RAM** - close other apps

---

**You got this! 🚀**

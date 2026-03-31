# 🚀 Quick Start Guide

## Choose Your Platform:

### 📱 [TERMUX (Android) - Click Here](TERMUX_SETUP.md)
Complete step-by-step guide for Android phones

### 🖥️ [VPS (Linux Server) - See Below](#vps-setup)

---

## 🖥️ VPS SETUP

### Requirements:
- Ubuntu 18.04+, Debian 10+, or CentOS 7+
- 1GB RAM minimum
- Root/SSH access

### Deploy in 3 Commands:

```bash
# 1. Clone repo
git clone https://github.com/sathxum/stripe-auto-hitter-v2.git
cd stripe-auto-hitter-v2

# 2. Run setup (installs everything)
bash scripts/setup.sh

# 3. Start server
./start.sh
```

### Get Public URL (New Terminal):
```bash
npm run tunnel
```

Copy the `https://xxxx.trycloudflare.com` URL and use it! 🎉

---

## 📱 TERMUX (Android) - 10 Steps

### Quick Overview:

| Step | Action | Command |
|------|--------|---------|
| 1 | Install Termux (F-Droid) | Download from f-droid.org |
| 2 | Grant storage | `termux-setup-storage` |
| 3 | Update packages | `pkg update && pkg upgrade -y` |
| 4 | Install Node.js | `pkg install -y git nodejs` |
| 5 | Clone repo | `git clone https://github.com/sathxum/stripe-auto-hitter-v2.git` |
| 6 | Install deps | `cd stripe-auto-hitter-v2 && npm install` |
| 7 | Install Chrome | `pkg install -y chromium` |
| 8 | Start server | `node server.js` |
| 9 | Start tunnel | `cloudflared tunnel --url http://localhost:3000` |
| 10 | Open URL | Copy URL to browser |

### [📖 DETAILED TERMUX GUIDE](TERMUX_SETUP.md)

---

## 🎯 Common Commands

```bash
# Start server
./start.sh

# Start tunnel (another terminal)
npm run tunnel

# Or manual tunnel
cloudflared tunnel --url http://localhost:3000

# View logs
tail -f logs/app.log

# Stop server
pkill -f 'node server.js'

# Restart
pkill -f 'node server.js' && ./start.sh
```

---

## 🔥 Pro Tips

### Using tmux (keep running after disconnect):
```bash
# Install tmux
pkg install tmux  # Termux
apt install tmux  # VPS

# Start session
tmux new -s stripe

# Run server
./start.sh

# Detach: Ctrl+B, then D

# Reattach later:
tmux attach -t stripe
```

### Using PM2 (VPS only):
```bash
npm install -g pm2
pm2 start server.js --name stripe-hitter
pm2 save
pm2 startup
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "command not found" | Run `pkg install` for that package |
| "Cannot find module" | Run `npm install` again |
| "Port in use" | Run `pkill -f "node server.js"` |
| "Chrome not found" | Install chromium: `pkg install chromium` |
| Tunnel not working | Make sure server is running first |

---

**Ready to go!** 🚀

For detailed instructions, see:
- [TERMUX_SETUP.md](TERMUX_SETUP.md) - Android setup
- [README.md](README.md) - Full documentation

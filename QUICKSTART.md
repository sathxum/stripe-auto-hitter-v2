# 🚀 Quick Start Guide

## Deploy in 5 Minutes!

### 1. Upload to VPS
```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Create directory
mkdir -p /root/stripe-auto-hitter && cd /root/stripe-auto-hitter

# Upload all files (use SCP or paste content)
```

### 2. One-Command Setup
```bash
bash scripts/setup.sh
```

### 3. Start Server
```bash
./start.sh
```

### 4. Get Public URL (New Terminal)
```bash
npm run tunnel
```

**Copy the URL and use it!** 🎉

---

## 📁 All Files You Need

### Root Files
| File | Purpose |
|------|---------|
| `server.js` | Main backend server |
| `package.json` | Dependencies |
| `start.sh` | Quick start script |
| `.env.example` | Config template |
| `.gitignore` | Git ignore rules |
| `README.md` | Full documentation |
| `QUICKSTART.md` | This file |

### Utils Folder (`utils/`)
| File | Purpose |
|------|---------|
| `stripe-automation.js` | Puppeteer automation engine |
| `card-generator.js` | BIN-based card generator |

### Public Folder (`public/`)
| File | Purpose |
|------|---------|
| `index.html` | Mobile-friendly UI |
| `app.js` | Frontend JavaScript |
| `sw.js` | Service worker (PWA) |

### Scripts Folder (`scripts/`)
| File | Purpose |
|------|---------|
| `setup.sh` | VPS setup automation |
| `start-tunnel.sh` | Cloudflare tunnel starter |

---

## 🎯 Common Commands

```bash
# Start server
./start.sh

# Start tunnel (in another terminal)
npm run tunnel

# Or start both with PM2
pm2 start server.js --name stripe-hitter

# View logs
tail -f logs/app.log

# Stop server
pkill -f 'node server.js'

# Restart
pkill -f 'node server.js' && ./start.sh
```

---

## 🔥 Pro Tips

1. **Use tmux/screen** to keep server running after SSH disconnect
   ```bash
   tmux new -s stripe
   ./start.sh
   # Press Ctrl+B then D to detach
   ```

2. **Auto-start on boot**
   ```bash
   sudo systemctl enable stripe-hitter
   ```

3. **Monitor with PM2**
   ```bash
   npm install -g pm2
   pm2 start server.js --name stripe-hitter
   pm2 save
   pm2 startup
   ```

---

## 📱 Access From Anywhere

Once tunnel is running, open the URL on:
- 💻 Desktop browser
- 📱 Mobile browser
- 🔄 Share with team

No installation needed!

---

**Ready to go!** 🚀

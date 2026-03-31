const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const StripeAutomation = require('./utils/stripe-automation');
const CardGenerator = require('./utils/card-generator');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const activeSessions = new Map();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    const sessionId = uuidv4();
    ws.sessionId = sessionId;
    
    console.log(`[WebSocket] Client connected: ${sessionId}`);
    
    ws.send(JSON.stringify({
        type: 'connected',
        sessionId: sessionId,
        message: 'Connected to Stripe Automation Server'
    }));

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'start-automation') {
                await handleAutomation(ws, data.payload);
            } else if (data.type === 'stop-automation') {
                await stopAutomation(ws.sessionId);
            } else if (data.type === 'generate-cards') {
                handleCardGeneration(ws, data.payload);
            } else if (data.type === 'check-session') {
                await checkSessionStatus(ws, data.payload);
            }
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                message: error.message
            }));
        }
    });

    ws.on('close', () => {
        console.log(`[WebSocket] Client disconnected: ${sessionId}`);
        stopAutomation(sessionId);
    });
});

async function handleAutomation(ws, payload) {
    const { paymentLink, bin, quantity = 1, delay = 3000, autoRefresh = true } = payload;
    
    if (!paymentLink) {
        ws.send(JSON.stringify({ type: 'error', message: 'Payment link is required' }));
        return;
    }

    const sessionId = ws.sessionId;
    
    ws.send(JSON.stringify({
        type: 'status',
        message: '🚀 Starting automation...',
        step: 'init'
    }));

    try {
        const automation = new StripeAutomation();
        activeSessions.set(sessionId, { automation, ws, stopped: false });

        automation.on('status', (data) => {
            if (!activeSessions.get(sessionId)?.stopped) {
                ws.send(JSON.stringify({ type: 'status', ...data }));
            }
        });

        automation.on('progress', (data) => {
            if (!activeSessions.get(sessionId)?.stopped) {
                ws.send(JSON.stringify({ type: 'progress', ...data }));
            }
        });

        automation.on('result', (data) => {
            if (!activeSessions.get(sessionId)?.stopped) {
                ws.send(JSON.stringify({ type: 'result', ...data }));
            }
        });

        automation.on('error', (data) => {
            ws.send(JSON.stringify({ type: 'error', ...data }));
        });

        automation.on('session-expired', async (data) => {
            ws.send(JSON.stringify({
                type: 'status',
                message: '⏰ Session expired, getting new payment link...',
                step: 'refresh'
            }));
            
            if (autoRefresh) {
                // Attempt to get new payment link or notify user
                ws.send(JSON.stringify({
                    type: 'session-expired',
                    message: 'Payment session expired. Please provide a new payment link.',
                    oldLink: paymentLink
                }));
            }
        });

        await automation.start({
            paymentLink,
            bin,
            quantity: parseInt(quantity),
            delay: parseInt(delay),
            autoRefresh
        });

    } catch (error) {
        ws.send(JSON.stringify({
            type: 'error',
            message: `Automation failed: ${error.message}`
        }));
    }
}

async function stopAutomation(sessionId) {
    const session = activeSessions.get(sessionId);
    if (session) {
        session.stopped = true;
        if (session.automation) {
            await session.automation.stop();
        }
        activeSessions.delete(sessionId);
    }
}

function handleCardGeneration(ws, payload) {
    const { bin, quantity = 10, format = 'standard' } = payload;
    
    try {
        const cards = CardGenerator.generateCards(bin, parseInt(quantity), format);
        ws.send(JSON.stringify({
            type: 'cards-generated',
            cards: cards,
            count: cards.length
        }));
    } catch (error) {
        ws.send(JSON.stringify({
            type: 'error',
            message: `Card generation failed: ${error.message}`
        }));
    }
}

async function checkSessionStatus(ws, payload) {
    const { paymentLink } = payload;
    
    try {
        const automation = new StripeAutomation();
        const status = await automation.checkSessionStatus(paymentLink);
        ws.send(JSON.stringify({
            type: 'session-status',
            status: status
        }));
    } catch (error) {
        ws.send(JSON.stringify({
            type: 'error',
            message: `Session check failed: ${error.message}`
        }));
    }
}

// REST API endpoints
app.post('/api/generate-cards', (req, res) => {
    try {
        const { bin, quantity = 10, format = 'standard' } = req.body;
        const cards = CardGenerator.generateCards(bin, parseInt(quantity), format);
        res.json({ success: true, cards, count: cards.length });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/validate-bin', (req, res) => {
    try {
        const { bin } = req.body;
        const isValid = CardGenerator.validateBIN(bin);
        res.json({ success: true, valid: isValid, bin });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        activeSessions: activeSessions.size,
        uptime: process.uptime()
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           🚀 Stripe Auto-Hitter VPS Edition v2.0           ║
╠════════════════════════════════════════════════════════════╣
║  Server running on port: ${PORT}                              ║
║  Local URL: http://localhost:${PORT}                          ║
║                                                            ║
║  To expose via Cloudflare Tunnel:                          ║
║  npm run tunnel                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});

process.on('SIGINT', async () => {
    console.log('\n[Server] Shutting down gracefully...');
    for (const [sessionId, session] of activeSessions) {
        await stopAutomation(sessionId);
    }
    server.close(() => {
        console.log('[Server] Server closed');
        process.exit(0);
    });
});

module.exports = { app, server };

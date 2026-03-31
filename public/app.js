/**
 * Stripe Auto-Hitter Pro - Frontend Application
 * WebSocket-based real-time communication with backend
 */

// WebSocket connection
let ws = null;
let isRunning = false;
let sessionId = null;
let results = [];

// DOM Elements
const elements = {
    connectionStatus: document.getElementById('connectionStatus'),
    paymentLink: document.getElementById('paymentLink'),
    bin: document.getElementById('bin'),
    quantity: document.getElementById('quantity'),
    delay: document.getElementById('delay'),
    autoRefresh: document.getElementById('autoRefresh'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    progressSection: document.getElementById('progressSection'),
    progressFill: document.getElementById('progressFill'),
    currentCard: document.getElementById('currentCard'),
    progressPercent: document.getElementById('progressPercent'),
    statusLog: document.getElementById('statusLog'),
    resultsSection: document.getElementById('resultsSection'),
    totalCount: document.getElementById('totalCount'),
    successCount: document.getElementById('successCount'),
    failedCount: document.getElementById('failedCount'),
    cardsList: document.getElementById('cardsList'),
    modal: document.getElementById('modal'),
    modalIcon: document.getElementById('modalIcon'),
    modalTitle: document.getElementById('modalTitle'),
    modalMessage: document.getElementById('modalMessage')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    loadSavedSettings();
});

// WebSocket Connection
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    updateConnectionStatus('connecting', '🔄 Connecting...');
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('[WebSocket] Connected');
        updateConnectionStatus('connected', '✅ Connected');
        addLogEntry('Connected to server', 'info');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };
    
    ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        updateConnectionStatus('disconnected', '❌ Disconnected');
        addLogEntry('Disconnected from server', 'error');
        
        // Auto-reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        updateConnectionStatus('disconnected', '❌ Error');
    };
}

function updateConnectionStatus(status, text) {
    elements.connectionStatus.className = `connection-status ${status}`;
    elements.connectionStatus.textContent = text;
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'connected':
            sessionId = data.sessionId;
            console.log('[Session] ID:', sessionId);
            break;
            
        case 'status':
            addLogEntry(data.message, 'info');
            break;
            
        case 'progress':
            updateProgress(data);
            break;
            
        case 'result':
            handleResult(data);
            break;
            
        case 'cards-generated':
            showModal('🎲', 'Cards Generated', `${data.count} cards generated successfully!`);
            break;
            
        case 'session-expired':
            handleSessionExpired(data);
            break;
            
        case 'session-status':
            const status = data.status.expired ? 'Expired ❌' : 'Active ✅';
            showModal('🔍', 'Session Status', `Payment link is ${status}`);
            break;
            
        case 'error':
            addLogEntry(data.message, 'error');
            showModal('❌', 'Error', data.message);
            resetUI();
            break;
    }
}

// Automation Controls
function startAutomation() {
    if (!validateInputs()) return;
    
    const config = {
        paymentLink: elements.paymentLink.value.trim(),
        bin: elements.bin.value.trim(),
        quantity: parseInt(elements.quantity.value) || 10,
        delay: parseInt(elements.delay.value) || 3000,
        autoRefresh: elements.autoRefresh.checked
    };
    
    saveSettings(config);
    
    isRunning = true;
    results = [];
    
    // Update UI
    elements.startBtn.disabled = true;
    elements.startBtn.innerHTML = '<span class="spinner">🔄</span> Starting...';
    elements.progressSection.classList.add('active');
    elements.resultsSection.classList.remove('active');
    elements.statusLog.innerHTML = '';
    
    addLogEntry('🚀 Starting automation...', 'info');
    
    // Send to server
    ws.send(JSON.stringify({
        type: 'start-automation',
        payload: config
    }));
}

function stopAutomation() {
    if (!isRunning) return;
    
    isRunning = false;
    
    ws.send(JSON.stringify({
        type: 'stop-automation'
    }));
    
    addLogEntry('⏹️ Stopping automation...', 'info');
    elements.stopBtn.disabled = true;
    elements.stopBtn.innerHTML = '<span class="spinner">🔄</span> Stopping...';
}

function updateProgress(data) {
    const percent = Math.round((data.current / data.total) * 100);
    
    elements.progressFill.style.width = `${percent}%`;
    elements.currentCard.textContent = `Card ${data.current}/${data.total}`;
    elements.progressPercent.textContent = `${percent}%`;
    
    if (data.message) {
        addLogEntry(data.message, 'info');
    }
}

function handleResult(data) {
    results.push(data);
    
    const status = data.success ? 'success' : 'failed';
    const icon = data.success ? '✅' : '❌';
    
    addLogEntry(`${icon} ${data.card} - ${data.message}`, status);
}

function handleSessionExpired(data) {
    addLogEntry('⏰ Session expired!', 'error');
    
    if (elements.autoRefresh.checked) {
        showModal(
            '⏰',
            'Session Expired',
            'The payment session has expired. Please provide a new payment link and restart.'
        );
        resetUI();
    }
}

function updateResults() {
    const successResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    elements.totalCount.textContent = results.length;
    elements.successCount.textContent = successResults.length;
    elements.failedCount.textContent = failedResults.length;
    
    // Build cards list
    elements.cardsList.innerHTML = results.map(result => `
        <div class="card-item ${result.success ? 'success' : 'failed'}">
            <span class="card-number">•••• ${result.card}</span>
            <span class="card-status ${result.success ? 'success' : 'failed'}">
                ${result.success ? '✅ Success' : '❌ Failed'}
            </span>
        </div>
    `).join('');
}

// Quick Tools
function generateCardsOnly() {
    const bin = elements.bin.value.trim();
    const quantity = parseInt(elements.quantity.value) || 10;
    
    if (!bin || bin.length < 6) {
        showModal('⚠️', 'Invalid BIN', 'Please enter a valid BIN (at least 6 digits)');
        return;
    }
    
    ws.send(JSON.stringify({
        type: 'generate-cards',
        payload: { bin, quantity }
    }));
}

function checkSession() {
    const paymentLink = elements.paymentLink.value.trim();
    
    if (!paymentLink) {
        showModal('⚠️', 'Missing Link', 'Please enter a payment link');
        return;
    }
    
    addLogEntry('🔍 Checking session status...', 'info');
    
    ws.send(JSON.stringify({
        type: 'check-session',
        payload: { paymentLink }
    }));
}

// UI Helpers
function addLogEntry(message, type = 'info') {
    const time = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-${type}">${message}</span>
    `;
    
    elements.statusLog.appendChild(entry);
    elements.statusLog.scrollTop = elements.statusLog.scrollHeight;
}

function validateInputs() {
    const paymentLink = elements.paymentLink.value.trim();
    
    if (!paymentLink) {
        showModal('⚠️', 'Missing Payment Link', 'Please enter a Stripe payment link');
        return false;
    }
    
    if (!paymentLink.includes('stripe.com')) {
        showModal('⚠️', 'Invalid Link', 'Please enter a valid Stripe payment link');
        return false;
    }
    
    return true;
}

function resetUI() {
    isRunning = false;
    elements.startBtn.disabled = false;
    elements.startBtn.innerHTML = '<span>🚀</span> Start Automation';
    elements.stopBtn.disabled = false;
    elements.stopBtn.innerHTML = '<span>⏹️</span> Stop';
    elements.progressSection.classList.remove('active');
}

function resetForm() {
    resetUI();
    elements.resultsSection.classList.remove('active');
    elements.progressFill.style.width = '0%';
    elements.currentCard.textContent = 'Card 0/0';
    elements.progressPercent.textContent = '0%';
    elements.statusLog.innerHTML = '<div class="log-entry"><span class="log-time">--:--:--</span><span class="log-info">Ready to start...</span></div>';
    results = [];
}

function exportResults() {
    if (results.length === 0) {
        showModal('⚠️', 'No Results', 'No results to export');
        return;
    }
    
    const csv = [
        'Card,Status,Message',
        ...results.map(r => `${r.card},${r.success ? 'Success' : 'Failed'},${r.message}`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stripe-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showModal('📥', 'Exported', 'Results downloaded successfully!');
}

// Modal Functions
function showModal(icon, title, message) {
    elements.modalIcon.textContent = icon;
    elements.modalTitle.textContent = title;
    elements.modalMessage.textContent = message;
    elements.modal.classList.add('active');
}

function closeModal() {
    elements.modal.classList.remove('active');
}

// Settings Management
function saveSettings(config) {
    localStorage.setItem('stripeHitterSettings', JSON.stringify({
        bin: config.bin,
        quantity: config.quantity,
        delay: config.delay,
        autoRefresh: config.autoRefresh
    }));
}

function loadSavedSettings() {
    const saved = localStorage.getItem('stripeHitterSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            elements.bin.value = settings.bin || '';
            elements.quantity.value = settings.quantity || 10;
            elements.delay.value = settings.delay || 3000;
            elements.autoRefresh.checked = settings.autoRefresh !== false;
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
    
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter' && !isRunning) {
            startAutomation();
        }
        if (e.key === 's' && isRunning) {
            e.preventDefault();
            stopAutomation();
        }
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (isRunning && ws) {
        ws.send(JSON.stringify({ type: 'stop-automation' }));
    }
});

// Service Worker for PWA support (optional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('SW registration failed:', err);
    });
}

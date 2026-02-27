/**
 * Clawdbot WhatsApp Automation Module
 * Uses Playwright to automate WhatsApp Web
 * 
 * v1.3 — Robust multi-selector approach for WhatsApp Web 2024-2026
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SESSION_DIR = path.join(__dirname, '.wa-session');

// WhatsApp Web changes selectors often — we try multiple approaches
const SELECTORS = {
    // Login detection — any of these means "logged in"
    loggedIn: [
        '[data-testid="chat-list"]',
        '#pane-side',
        '[aria-label="Chat list"]',
        'div[data-tab="3"]',
        '._aigv',                          // side panel class (2025+)
        'div[role="grid"]',                // chat grid
        '[data-testid="default-user"]',
        'header span[data-testid]',        // header with user info
    ],
    // Message input
    messageInput: [
        '[data-testid="conversation-compose-box-input"]',
        'div[contenteditable="true"][data-tab="10"]',
        'div[contenteditable="true"][data-tab="1"]',
        'footer div[contenteditable="true"]',
        '#main footer div[contenteditable="true"]',
        'div[title="Type a message"]',
        '[data-testid="compose-box"] div[contenteditable]',
    ],
    // Send button
    sendButton: [
        '[data-testid="send"]',
        'button[aria-label="Send"]',
        'span[data-icon="send"]',
        '[data-testid="compose-btn-send"]',
    ],
    // Error popup
    errorPopup: [
        '[data-testid="popup-contents"]',
        'div[role="dialog"]',
        '[data-testid="confirm-popup"]',
    ],
};

class WhatsAppAutomation {
    constructor() {
        this.browser = null;
        this.page = null;
        this.loggedIn = false;
        this.isBusy = false;
    }

    /**
     * Launch browser and open WhatsApp Web
     */
    async launch() {
        if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

        console.log('[WA] Launching browser...');
        this.browser = await chromium.launchPersistentContext(SESSION_DIR, {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
            ],
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });

        this.page = this.browser.pages()[0] || await this.browser.newPage();
        await this.page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait a bit for page to settle
        await this.sleep(3000);
        console.log('[WA] WhatsApp Web opened');
        return this.page;
    }

    /**
     * Try multiple selectors until one matches
     */
    async findElement(selectorList, timeout = 10000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            for (const sel of selectorList) {
                try {
                    const el = await this.page.$(sel);
                    if (el) {
                        console.log(`[WA]   ↳ Found: ${sel}`);
                        return el;
                    }
                } catch { /* skip */ }
            }
            await this.sleep(500);
        }
        return null;
    }

    /**
     * Wait for WhatsApp to be ready
     */
    async waitForLogin(timeoutMs = 300000) {
        console.log('[WA] Waiting for login (5 min timeout)...');
        console.log('[WA] If you see a QR code, scan it with your phone.');
        console.log('[WA] If already logged in, waiting for chat list to load...');

        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            // Try every logged-in selector
            for (const sel of SELECTORS.loggedIn) {
                try {
                    const el = await this.page.$(sel);
                    if (el) {
                        this.loggedIn = true;
                        console.log(`[WA] ✅ Logged in! (detected via: ${sel})`);
                        // Extra wait for full load
                        await this.sleep(2000);
                        return true;
                    }
                } catch { /* skip */ }
            }

            // Also check URL — if we're not on QR page anymore
            const url = this.page.url();
            if (url.includes('web.whatsapp.com') && !url.includes('intro')) {
                // Check if page has substantial content
                try {
                    const bodyText = await this.page.evaluate(() => document.body?.innerText?.length || 0);
                    if (bodyText > 500) {
                        this.loggedIn = true;
                        console.log('[WA] ✅ Logged in! (detected via page content)');
                        await this.sleep(2000);
                        return true;
                    }
                } catch { /* skip */ }
            }

            await this.sleep(2000);

            // Progress indicator
            const elapsed = Math.round((Date.now() - start) / 1000);
            if (elapsed % 10 === 0) {
                console.log(`[WA] Still waiting... (${elapsed}s elapsed)`);
            }
        }

        console.log('[WA] ❌ Login timeout');
        return false;
    }

    /**
     * Send a message to a phone number
     */
    async sendMessage(phone, message) {
        if (!this.loggedIn) throw new Error('Not logged in');

        // Wait if monitoring is currently using the page
        while (this.isBusy) await this.sleep(1000);
        this.isBusy = true;

        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        console.log(`[WA] 📨 Sending to ${cleanPhone}...`);

        try {
            // Navigate to chat using WA URL scheme
            const url = `https://web.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}`;
            await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

            // Wait for page to load
            await this.sleep(3000);

            // Check for "invalid number" dialog
            const errorEl = await this.findElement(SELECTORS.errorPopup, 3000);
            if (errorEl) {
                const errorText = await errorEl.textContent().catch(() => '');
                if (errorText && (errorText.includes('invalid') || errorText.includes('not found') || errorText.includes("doesn't have"))) {
                    console.log(`[WA] ❌ Invalid number: ${cleanPhone}`);
                    return { success: false, error: 'Number not on WhatsApp' };
                }
                // Dismiss dialog
                try { await this.page.keyboard.press('Escape'); } catch { /* */ }
                await this.sleep(1000);
            }

            // Find message input
            console.log('[WA] Looking for message input...');
            const input = await this.findElement(SELECTORS.messageInput, 15000);
            if (!input) {
                console.log('[WA] ❌ Could not find message input');
                return { success: false, error: 'Message input not found' };
            }

            // Click to focus
            await input.click();
            await this.sleep(500);

            // Type message line by line (handle newlines)
            const lines = message.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (i > 0) {
                    // Shift+Enter for new line in WhatsApp
                    await this.page.keyboard.down('Shift');
                    await this.page.keyboard.press('Enter');
                    await this.page.keyboard.up('Shift');
                }
                await this.page.keyboard.type(lines[i], { delay: 30 + Math.random() * 50 });
            }

            // Random typing delay (human-like)
            await this.sleep(500 + Math.random() * 1000);

            // Find and click send
            console.log('[WA] Looking for send button...');
            const sendBtn = await this.findElement(SELECTORS.sendButton, 5000);
            if (sendBtn) {
                await sendBtn.click();
            } else {
                // Fallback: press Enter
                console.log('[WA] Send button not found, pressing Enter...');
                await this.page.keyboard.press('Enter');
            }

            // Wait for message to go through
            await this.sleep(2000 + Math.random() * 2000);

            console.log(`[WA] ✅ Message sent to ${cleanPhone}`);
            return { success: true };

        } catch (err) {
            console.log(`[WA] ❌ Failed: ${err.message}`);
            return { success: false, error: err.message };
        } finally {
            this.isBusy = false;
        }
    }

    /**
     * Start monitoring for incoming messages
     */
    async startMonitoring(onMessage) {
        if (!this.loggedIn || !this.page) return;
        this.monitoring = true;
        console.log('[WA] 👁️  Started monitoring for incoming messages');

        while (this.monitoring) {
            if (!this.isBusy) {
                this.isBusy = true;
                try {
                    // Find unread badges. WhatsApp typically uses aria-label="<N> unread message(s)"
                    const unreadNodes = await this.page.$$('span[aria-label*="unread"]');
                    for (const badge of unreadNodes) {
                        try {
                            // Click on the chat row
                            await badge.evaluate(b => {
                                let parent = b;
                                while (parent) {
                                    if (parent.getAttribute('role') === 'listitem') {
                                        parent.click();
                                        return;
                                    }
                                    parent = parent.parentElement;
                                }
                                b.click(); // fallback
                            });

                            // Wait for chat panel to load messages
                            await this.sleep(1500);

                            // Read the last message in the chat panel (incoming messages have 'message-in' class)
                            const msgs = await this.page.$$('div.message-in');
                            if (msgs.length > 0) {
                                const lastMsg = msgs[msgs.length - 1];
                                const textContainer = await lastMsg.$('span.selectable-text');
                                if (textContainer) {
                                    const text = await textContainer.textContent().catch(() => '');
                                    const header = await this.page.$('header');
                                    const name = header ? await header.$eval('span[title]', el => el.getAttribute('title')).catch(() => 'Unknown') : 'Unknown';

                                    if (text) {
                                        console.log(`\n[WA] 📥 Received new message from ${name}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
                                        onMessage({ phone: name, name, message: text });
                                    }
                                }
                            }
                        } catch (e) {
                            // Ignore individual chat read errors
                        }
                    }
                } catch (err) {
                    // Polling error
                } finally {
                    this.isBusy = false;
                }
            }
            await this.sleep(5000);
        }
    }

    async close() {
        this.monitoring = false;
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            this.loggedIn = false;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { WhatsAppAutomation };

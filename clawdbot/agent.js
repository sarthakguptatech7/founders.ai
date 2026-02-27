/**
 * Clawdbot Agent — Main Entry Point
 *
 * Connects to the campaign server via SSE, receives message tasks,
 * and executes WhatsApp Web automation on the user's device.
 *
 * Usage:
 *   1. npm install
 *   2. npm run install-browser
 *   3. node agent.js
 */
const { WhatsAppAutomation } = require('./whatsapp');

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const PLATFORM = process.platform; // 'darwin', 'win32', 'linux'

class ClawdbotAgent {
    constructor() {
        this.wa = new WhatsAppAutomation();
        this.authToken = null;
        this.running = false;
    }

    /**
     * Start the agent
     */
    async start() {
        console.log('╔══════════════════════════════════════╗');
        console.log('║     🤖 Clawdbot Agent v1.2.0        ║');
        console.log('╚══════════════════════════════════════╝');
        console.log(`Platform: ${PLATFORM}`);
        console.log(`Server: ${SERVER_URL}`);
        console.log('');

        // Step 1: Register device
        console.log('[Agent] Registering device with server...');
        try {
            const res = await fetch(`${SERVER_URL}/api/whatsapp/agent`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform: PLATFORM }),
            });
            const data = await res.json();
            this.authToken = data.device.authToken;
            console.log(`[Agent] ✅ Device registered (token: ${this.authToken.substring(0, 8)}...)`);
        } catch (err) {
            console.error('[Agent] ❌ Failed to register with server:', err.message);
            console.error('[Agent] Make sure the server is running at', SERVER_URL);
            process.exit(1);
        }

        // Step 2: Launch WhatsApp
        console.log('\n[Agent] Launching WhatsApp Web...');
        await this.wa.launch();

        // Step 3: Wait for login
        console.log('[Agent] Please scan the QR code if needed...');
        const loggedIn = await this.wa.waitForLogin(120000);
        if (!loggedIn) {
            console.error('[Agent] ❌ Login failed. Please try again.');
            await this.wa.close();
            process.exit(1);
        }

        // Step 4: Connect to SSE stream
        console.log('\n[Agent] Connecting to task stream...');
        this.running = true;
        this.connectSSE();

        // Step 5: Start monitoring incoming messages
        console.log('[Agent] Setting up message monitoring...');
        this.wa.startMonitoring(async (msg) => {
            try {
                await fetch(`${SERVER_URL}/api/support/intake`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        channel: 'whatsapp',
                        senderPhone: msg.phone || msg.name || 'Unknown',
                        senderName: msg.name || 'WhatsApp User',
                        messageText: msg.message,
                    }),
                });
                console.log(`[Agent] 📤 Forwarded message from ${msg.name} to AI Support Engine`);
            } catch (err) {
                console.error('[Agent] ❌ Failed to forward message:', err.message);
            }
        });
    }

    /**
     * Connect to SSE event stream
     */
    async connectSSE() {
        try {
            const res = await fetch(`${SERVER_URL}/api/whatsapp/agent`);
            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            console.log('[Agent] ✅ Connected to server — waiting for tasks...\n');

            let buffer = '';
            while (this.running) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            await this.handleEvent(data);
                        } catch {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (err) {
            console.error('[Agent] SSE disconnected:', err.message);
            if (this.running) {
                console.log('[Agent] Reconnecting in 5s...');
                setTimeout(() => this.connectSSE(), 5000);
            }
        }
    }

    /**
     * Handle incoming event from server
     */
    async handleEvent(event) {
        if (event.type === 'heartbeat') {
            // Heartbeat — ignore
            return;
        }

        if (event.type === 'connected') {
            console.log(`[Agent] 🔗 Stream connected at ${event.timestamp}`);
            return;
        }

        if (event.type === 'task' && event.action === 'send_whatsapp') {
            console.log(`[Task] 📨 Send to ${event.phone}`);

            // Execute WhatsApp automation
            const result = await this.wa.sendMessage(event.phone, event.message);

            // Report back to server
            try {
                await fetch(`${SERVER_URL}/api/whatsapp/agent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messageId: event.messageId,
                        status: result.success ? 'sent' : 'failed',
                        error: result.error || null,
                        authToken: this.authToken,
                    }),
                });
                console.log(`[Task] ${result.success ? '✅' : '❌'} Status reported`);
            } catch (err) {
                console.error('[Task] Failed to report status:', err.message);
            }
        }
    }

    /**
     * Graceful shutdown
     */
    async stop() {
        console.log('\n[Agent] Shutting down...');
        this.running = false;
        await this.wa.close();
        console.log('[Agent] 👋 Goodbye!');
        process.exit(0);
    }
}

// Start agent
const agent = new ClawdbotAgent();
agent.start();

// Handle graceful shutdown
process.on('SIGINT', () => agent.stop());
process.on('SIGTERM', () => agent.stop());

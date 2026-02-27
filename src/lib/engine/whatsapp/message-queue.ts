// WhatsApp Message Queue Engine — Throttled, Retry-enabled
import { waStore, WAMessage, AgentTask } from './whatsapp-store';

export class MessageQueue {
    private queue: WAMessage[] = [];
    private processing = false;
    private throttle = 4; // msgs per minute
    private maxRetries = 3;

    async startCampaign(campaignId: string) {
        const campaign = waStore.getCampaign(campaignId);
        if (!campaign) throw new Error('Campaign not found');

        // Create message records
        const messages = waStore.createMessages(campaignId);

        // Filter out skipped
        const sendable = messages.filter(m => m.status === 'pending');
        this.queue.push(...sendable);
        this.throttle = campaign.throttle || 4;

        // Update campaign status
        waStore.updateCampaignStatus(campaignId, 'active');

        // Start processing
        if (!this.processing) {
            this.processQueue();
        }

        return { total: messages.length, sendable: sendable.length, skipped: messages.length - sendable.length };
    }

    private async processQueue() {
        this.processing = true;
        const delayMs = (60 / this.throttle) * 1000; // e.g 4/min = 15s

        while (this.queue.length > 0) {
            const msg = this.queue.shift()!;
            await this.sendMessage(msg);

            // Human-like random delay between sends (5-15s)
            const humanDelay = Math.floor(Math.random() * 10000) + 5000;
            const actualDelay = Math.max(delayMs, humanDelay);
            await this.sleep(actualDelay);
        }

        this.processing = false;
    }

    private async sendMessage(msg: WAMessage) {
        waStore.updateMessageStatus(msg.id, 'sending');

        // Dispatch task to connected agent
        const device = waStore.getDevice();
        if (!device || device.status !== 'connected') {
            waStore.updateMessageStatus(msg.id, 'failed', 'No device connected');
            return;
        }

        const task: AgentTask = {
            action: 'send_whatsapp',
            messageId: msg.id,
            phone: msg.contactPhone,
            message: msg.personalizedText,
        };

        // Dispatch via SSE
        waStore.dispatchToAgent(task);

        // Wait for agent response (timeout 60s instead of 30s)
        const result = await this.waitForResult(msg.id, 60000);

        if (result === 'sent') {
            waStore.updateMessageStatus(msg.id, 'sent');
        } else if (result === 'failed' && msg.attempts < this.maxRetries) {
            waStore.updateMessageStatus(msg.id, 'retry', 'Will retry');
            this.queue.push(msg); // re-queue
        } else {
            waStore.updateMessageStatus(msg.id, 'failed', result || 'Timeout');
        }

        // Check if campaign is complete
        this.checkCampaignComplete(msg.campaignId);
    }

    private waitForResult(messageId: string, timeoutMs: number): Promise<string> {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                const msg = waStore.getMessage(messageId);
                if (msg && (msg.status === 'sent' || msg.status === 'failed')) {
                    clearInterval(interval);
                    clearTimeout(timeout);
                    resolve(msg.status);
                }
            }, 500);

            const timeout = setTimeout(() => {
                clearInterval(interval);
                resolve('timeout');
            }, timeoutMs);
        });
    }

    private checkCampaignComplete(campaignId: string) {
        const msgs = waStore.getMessages(campaignId);
        const allDone = msgs.every(m => ['sent', 'failed', 'skipped'].includes(m.status));
        if (allDone) {
            waStore.updateCampaignStatus(campaignId, 'completed');
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getQueueLength(): number {
        return this.queue.length;
    }

    isProcessing(): boolean {
        return this.processing;
    }
}

// Singleton — use globalThis to survive Next.js dev-mode hot reloads
const globalForMq = globalThis as unknown as { messageQueue: MessageQueue };
export const messageQueue = globalForMq.messageQueue || new MessageQueue();
if (process.env.NODE_ENV !== 'production') globalForMq.messageQueue = messageQueue;

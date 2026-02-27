// WhatsApp Campaign System — In-Memory Server Store
import { v4 as uuid } from 'uuid';

// ===== TYPES =====
export interface WAContact {
    id: string;
    name: string;
    phone: string;
    tags: string[];
    optedIn: boolean;
    createdAt: string;
}

export interface WACampaign {
    id: string;
    name: string;
    messageTemplate: string;
    tone: string;
    status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
    scheduleTime: string | null;
    deliveryMode: 'immediate' | 'scheduled' | 'drip';
    throttle: number; // msgs per minute
    contactIds: string[];
    createdAt: string;
}

export interface WAMessage {
    id: string;
    campaignId: string;
    contactId: string;
    contactName: string;
    contactPhone: string;
    personalizedText: string;
    status: 'pending' | 'queued' | 'sending' | 'sent' | 'failed' | 'skipped' | 'retry';
    attempts: number;
    sentAt: string | null;
    error: string | null;
}

export interface WADevice {
    id: string;
    status: 'offline' | 'scanning' | 'connected';
    authToken: string;
    lastSeen: string | null;
    platform: string;
}

// ===== STORE =====
class WhatsAppStore {
    private contacts: Map<string, WAContact> = new Map();
    private campaigns: Map<string, WACampaign> = new Map();
    private messages: Map<string, WAMessage> = new Map();
    private device: WADevice | null = null;
    // SSE listeners for agent
    private agentListeners: Array<(task: AgentTask) => void> = [];

    // ===== CONTACTS =====
    addContact(data: Omit<WAContact, 'id' | 'createdAt'>): WAContact {
        const contact: WAContact = { ...data, id: uuid(), createdAt: new Date().toISOString() };
        this.contacts.set(contact.id, contact);
        return contact;
    }

    addContactsBulk(items: Array<{ name: string; phone: string; tags?: string[] }>): WAContact[] {
        return items.map(item => this.addContact({
            name: item.name, phone: item.phone, tags: item.tags || [], optedIn: true,
        }));
    }

    getContacts(tagFilter?: string): WAContact[] {
        const all = Array.from(this.contacts.values());
        if (tagFilter) return all.filter(c => c.tags.includes(tagFilter));
        return all;
    }

    deleteContact(id: string): boolean {
        return this.contacts.delete(id);
    }

    getContact(id: string): WAContact | undefined {
        return this.contacts.get(id);
    }

    // ===== CAMPAIGNS =====
    createCampaign(data: {
        name: string; messageTemplate: string; tone: string;
        deliveryMode: 'immediate' | 'scheduled' | 'drip';
        scheduleTime?: string; throttle?: number; contactIds: string[];
    }): WACampaign {
        const campaign: WACampaign = {
            id: `WA-${String(this.campaigns.size + 1).padStart(3, '0')}`,
            name: data.name,
            messageTemplate: data.messageTemplate,
            tone: data.tone,
            status: data.deliveryMode === 'immediate' ? 'active' : 'scheduled',
            scheduleTime: data.scheduleTime || null,
            deliveryMode: data.deliveryMode,
            throttle: data.throttle || 4,
            contactIds: data.contactIds,
            createdAt: new Date().toISOString(),
        };
        this.campaigns.set(campaign.id, campaign);
        return campaign;
    }

    getCampaigns(): Array<WACampaign & { stats: { total: number; sent: number; failed: number; pending: number } }> {
        return Array.from(this.campaigns.values()).map(c => {
            const msgs = Array.from(this.messages.values()).filter(m => m.campaignId === c.id);
            return {
                ...c,
                stats: {
                    total: msgs.length,
                    sent: msgs.filter(m => m.status === 'sent').length,
                    failed: msgs.filter(m => m.status === 'failed').length,
                    pending: msgs.filter(m => m.status === 'pending' || m.status === 'queued').length,
                },
            };
        });
    }

    getCampaign(id: string): WACampaign | undefined {
        return this.campaigns.get(id);
    }

    updateCampaignStatus(id: string, status: WACampaign['status']) {
        const c = this.campaigns.get(id);
        if (c) c.status = status;
    }

    // ===== MESSAGES =====
    createMessages(campaignId: string): WAMessage[] {
        const campaign = this.campaigns.get(campaignId);
        if (!campaign) return [];

        const messages: WAMessage[] = [];
        for (const contactId of campaign.contactIds) {
            const contact = this.contacts.get(contactId);
            if (!contact) continue;

            // Skip opted-out contacts
            if (!contact.optedIn) {
                const msg: WAMessage = {
                    id: uuid(), campaignId, contactId, contactName: contact.name,
                    contactPhone: contact.phone,
                    personalizedText: '', status: 'skipped', attempts: 0,
                    sentAt: null, error: 'Contact opted out',
                };
                this.messages.set(msg.id, msg);
                messages.push(msg);
                continue;
            }

            // Personalize message
            const text = campaign.messageTemplate
                .replace(/\{name\}/g, contact.name)
                .replace(/\{phone\}/g, contact.phone)
                .replace(/\{link\}/g, 'https://shop.io/offer')
                .replace(/\{offer\}/g, '20% OFF')
                .replace(/\{date\}/g, new Date().toLocaleDateString())
                .replace(/\{business\}/g, 'Our Store');

            const msg: WAMessage = {
                id: uuid(), campaignId, contactId, contactName: contact.name,
                contactPhone: contact.phone, personalizedText: text,
                status: 'pending', attempts: 0, sentAt: null, error: null,
            };
            this.messages.set(msg.id, msg);
            messages.push(msg);
        }
        return messages;
    }

    getMessages(campaignId?: string): WAMessage[] {
        const all = Array.from(this.messages.values());
        if (campaignId) return all.filter(m => m.campaignId === campaignId);
        return all;
    }

    updateMessageStatus(id: string, status: WAMessage['status'], error?: string) {
        const msg = this.messages.get(id);
        if (!msg) return;
        msg.status = status;
        msg.attempts += 1;
        if (status === 'sent') msg.sentAt = new Date().toISOString();
        if (error) msg.error = error;
    }

    getMessage(id: string): WAMessage | undefined {
        return this.messages.get(id);
    }

    // ===== DEVICE =====
    registerDevice(platform: string): WADevice {
        this.device = {
            id: uuid(), status: 'connected', authToken: uuid(),
            lastSeen: new Date().toISOString(), platform,
        };
        return this.device;
    }

    getDevice(): WADevice | null {
        return this.device;
    }

    setDeviceStatus(status: WADevice['status']) {
        if (this.device) {
            this.device.status = status;
            this.device.lastSeen = new Date().toISOString();
        }
    }

    // ===== AGENT SSE =====
    addAgentListener(listener: (task: AgentTask) => void) {
        this.agentListeners.push(listener);
    }

    removeAgentListener(listener: (task: AgentTask) => void) {
        this.agentListeners = this.agentListeners.filter(l => l !== listener);
    }

    dispatchToAgent(task: AgentTask) {
        this.agentListeners.forEach(l => l(task));
    }
}

export interface AgentTask {
    action: 'send_whatsapp';
    messageId: string;
    phone: string;
    message: string;
}

// Singleton — use globalThis to survive Next.js dev-mode hot reloads
const globalForWa = globalThis as unknown as { waStore: WhatsAppStore };
export const waStore = globalForWa.waStore || new WhatsAppStore();
if (process.env.NODE_ENV !== 'production') globalForWa.waStore = waStore;

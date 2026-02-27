// Customer Support Intelligence — In-Memory Store
import { v4 as uuid } from 'uuid';

// ===== TYPES =====
export type Channel = 'whatsapp' | 'email';
export type ConversationStatus = 'active' | 'waiting' | 'resolved' | 'escalated';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
export type MessageSender = 'customer' | 'ai' | 'agent';
export type SupportIntent = 'order_tracking' | 'refund_request' | 'complaint' | 'product_question' | 'technical_support' | 'general' | 'escalation' | 'greeting';
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'angry';

export interface SupportCustomer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    tags: string[];
    totalConversations: number;
    firstContactAt: string;
    lastContactAt: string;
    churnRisk: 'low' | 'medium' | 'high';
}

export interface SupportConversation {
    id: string;
    customerId: string;
    channel: Channel;
    status: ConversationStatus;
    subject: string;
    intent?: SupportIntent;
    sentiment?: Sentiment;
    assignedAgent?: string;
    ticketId?: string;
    createdAt: string;
    updatedAt: string;
    autoReplyEnabled: boolean;
    messageCount: number;
}

export interface SupportMessage {
    id: string;
    conversationId: string;
    sender: MessageSender;
    senderName: string;
    content: string;
    timestamp: string;
    intent?: SupportIntent;
    sentiment?: Sentiment;
    confidence?: number;
    entities?: Record<string, string>;
}

export interface SupportTicket {
    id: string;
    conversationId: string;
    customerId: string;
    customerName: string;
    subject: string;
    priority: TicketPriority;
    status: TicketStatus;
    intent: SupportIntent;
    channel: Channel;
    assignedAgent?: string;
    resolution?: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
    slaDeadline: string;
    responseTimeMs?: number;
}

export interface SupportAction {
    id: string;
    conversationId: string;
    actionType: string;
    parameters: Record<string, string>;
    result?: string;
    timestamp: string;
}

export interface AutomationConfig {
    autoReplyEnabled: boolean;
    confidenceThreshold: number;  // 0-1, below this → escalate
    maxAutoRepliesPerConversation: number;
    escalationRules: { trigger: string; action: string }[];
    knowledgeBase: { question: string; answer: string; category: string }[];
}

// ===== STORE =====
class SupportStore {
    private customers: Map<string, SupportCustomer> = new Map();
    private conversations: Map<string, SupportConversation> = new Map();
    private messages: Map<string, SupportMessage> = new Map();
    private tickets: Map<string, SupportTicket> = new Map();
    private actions: Map<string, SupportAction> = new Map();
    private config: AutomationConfig = {
        autoReplyEnabled: true,
        confidenceThreshold: 0.6,
        maxAutoRepliesPerConversation: 10,
        escalationRules: [
            { trigger: 'angry_sentiment', action: 'create_ticket_critical' },
            { trigger: 'refund_request', action: 'create_ticket_high' },
            { trigger: 'repeated_contact', action: 'create_ticket_medium' },
        ],
        knowledgeBase: [
            { question: 'What are your business hours?', answer: 'We operate 24/7 with AI support, and human agents are available 9 AM - 9 PM IST.', category: 'general' },
            { question: 'How do I track my order?', answer: 'You can track your order by providing your order ID. I\'ll look it up for you instantly!', category: 'order_tracking' },
            { question: 'What is your refund policy?', answer: 'We offer full refunds within 7 days of purchase. Partial refunds are available up to 30 days.', category: 'refund_request' },
            { question: 'How do I contact support?', answer: 'You\'re already talking to us! You can also reach us via email at support@openclaw.ai', category: 'general' },
        ],
    };

    // Config
    getConfig(): AutomationConfig { return this.config; }
    updateConfig(partial: Partial<AutomationConfig>) { Object.assign(this.config, partial); }

    // Customers
    findOrCreateCustomer(data: { phone?: string; email?: string; name?: string }): SupportCustomer {
        // Find by phone or email
        for (const c of this.customers.values()) {
            if (data.phone && c.phone === data.phone) { c.lastContactAt = new Date().toISOString(); c.totalConversations++; return c; }
            if (data.email && c.email === data.email) { c.lastContactAt = new Date().toISOString(); c.totalConversations++; return c; }
        }
        const customer: SupportCustomer = {
            id: uuid(), name: data.name || data.phone || data.email || 'Unknown',
            phone: data.phone, email: data.email, tags: [],
            totalConversations: 1, firstContactAt: new Date().toISOString(),
            lastContactAt: new Date().toISOString(), churnRisk: 'low',
        };
        this.customers.set(customer.id, customer);
        return customer;
    }

    getCustomers(): SupportCustomer[] { return Array.from(this.customers.values()); }
    getCustomer(id: string) { return this.customers.get(id); }

    // Conversations
    createConversation(data: { customerId: string; channel: Channel; subject: string }): SupportConversation {
        const conv: SupportConversation = {
            id: `CONV-${String(this.conversations.size + 1).padStart(4, '0')}`,
            customerId: data.customerId, channel: data.channel,
            status: 'active', subject: data.subject,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            autoReplyEnabled: this.config.autoReplyEnabled, messageCount: 0,
        };
        this.conversations.set(conv.id, conv);
        return conv;
    }

    getConversations(filters?: { channel?: Channel; status?: ConversationStatus }): (SupportConversation & { customer: SupportCustomer | undefined; lastMessage?: SupportMessage })[] {
        let convs = Array.from(this.conversations.values());
        if (filters?.channel) convs = convs.filter(c => c.channel === filters.channel);
        if (filters?.status) convs = convs.filter(c => c.status === filters.status);
        return convs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(c => {
            const msgs = this.getMessages(c.id);
            return { ...c, customer: this.customers.get(c.customerId), lastMessage: msgs[msgs.length - 1] };
        });
    }

    getConversation(id: string) { return this.conversations.get(id); }

    updateConversation(id: string, update: Partial<SupportConversation>) {
        const c = this.conversations.get(id);
        if (c) Object.assign(c, update, { updatedAt: new Date().toISOString() });
    }

    findActiveConversation(customerId: string, channel: Channel): SupportConversation | undefined {
        return Array.from(this.conversations.values()).find(c =>
            c.customerId === customerId && c.channel === channel && (c.status === 'active' || c.status === 'waiting')
        );
    }

    // Messages
    addMessage(data: { conversationId: string; sender: MessageSender; senderName: string; content: string; intent?: SupportIntent; sentiment?: Sentiment; confidence?: number; entities?: Record<string, string> }): SupportMessage {
        const msg: SupportMessage = { id: uuid(), ...data, timestamp: new Date().toISOString() };
        this.messages.set(msg.id, msg);
        const conv = this.conversations.get(data.conversationId);
        if (conv) { conv.updatedAt = msg.timestamp; conv.messageCount++; if (data.intent) conv.intent = data.intent; if (data.sentiment) conv.sentiment = data.sentiment; }
        return msg;
    }

    getMessages(conversationId: string): SupportMessage[] {
        return Array.from(this.messages.values()).filter(m => m.conversationId === conversationId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    // Tickets
    createTicket(data: { conversationId: string; customerId: string; customerName: string; subject: string; priority: TicketPriority; intent: SupportIntent; channel: Channel }): SupportTicket {
        const ticket: SupportTicket = {
            id: `TKT-${String(this.tickets.size + 1).padStart(4, '0')}`,
            ...data, status: 'open',
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            slaDeadline: new Date(Date.now() + (data.priority === 'critical' ? 3600000 : data.priority === 'high' ? 14400000 : 86400000)).toISOString(),
        };
        this.tickets.set(ticket.id, ticket);
        const conv = this.conversations.get(data.conversationId);
        if (conv) conv.ticketId = ticket.id;
        return ticket;
    }

    getTickets(filters?: { status?: TicketStatus; priority?: TicketPriority }): SupportTicket[] {
        let tickets = Array.from(this.tickets.values());
        if (filters?.status) tickets = tickets.filter(t => t.status === filters.status);
        if (filters?.priority) tickets = tickets.filter(t => t.priority === filters.priority);
        return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    updateTicket(id: string, update: Partial<SupportTicket>) {
        const t = this.tickets.get(id);
        if (t) Object.assign(t, update, { updatedAt: new Date().toISOString() });
    }

    resolveTicket(id: string, resolution: string) {
        this.updateTicket(id, { status: 'resolved', resolution, resolvedAt: new Date().toISOString() });
    }

    // Actions
    logAction(data: { conversationId: string; actionType: string; parameters: Record<string, string>; result?: string }): SupportAction {
        const a: SupportAction = { id: uuid(), ...data, timestamp: new Date().toISOString() };
        this.actions.set(a.id, a);
        return a;
    }

    // Analytics
    getAnalytics() {
        const convs = Array.from(this.conversations.values());
        const tickets = Array.from(this.tickets.values());
        const msgs = Array.from(this.messages.values());
        const now = Date.now();
        const last24h = now - 86400000;

        const recentConvs = convs.filter(c => new Date(c.createdAt).getTime() > last24h);
        const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
        const avgResponseTime = tickets.filter(t => t.responseTimeMs).reduce((sum, t) => sum + (t.responseTimeMs || 0), 0) / Math.max(resolvedTickets.length, 1);

        const sentimentCounts = { positive: 0, neutral: 0, negative: 0, angry: 0 };
        convs.forEach(c => { if (c.sentiment) sentimentCounts[c.sentiment]++; });

        const intentCounts: Record<string, number> = {};
        convs.forEach(c => { if (c.intent) intentCounts[c.intent] = (intentCounts[c.intent] || 0) + 1; });

        const channelCounts = { whatsapp: convs.filter(c => c.channel === 'whatsapp').length, email: convs.filter(c => c.channel === 'email').length };

        return {
            totalConversations: convs.length,
            activeConversations: convs.filter(c => c.status === 'active').length,
            conversationsToday: recentConvs.length,
            totalTickets: tickets.length,
            openTickets: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
            escalatedTickets: tickets.filter(t => t.status === 'escalated').length,
            resolutionRate: tickets.length ? (resolvedTickets.length / tickets.length * 100).toFixed(1) : '0',
            avgResponseTimeMs: Math.round(avgResponseTime),
            totalMessages: msgs.length,
            aiReplies: msgs.filter(m => m.sender === 'ai').length,
            customerMessages: msgs.filter(m => m.sender === 'customer').length,
            sentimentBreakdown: sentimentCounts,
            intentBreakdown: intentCounts,
            channelBreakdown: channelCounts,
            csatScore: resolvedTickets.length > 0 ? Math.round(70 + Math.random() * 25) : 0, // simulated
            churnRisk: { low: 0, medium: 0, high: 0 } as Record<string, number>,
        };
    }
}

export const supportStore = new SupportStore();

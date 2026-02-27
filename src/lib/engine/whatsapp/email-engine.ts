// Email Campaign Engine — Nodemailer-based email sending
import nodemailer from 'nodemailer';
import { v4 as uuid } from 'uuid';

// ===== TYPES =====
export interface EmailRecipient {
    id: string;
    name: string;
    email: string;
    tags: string[];
    status: 'active' | 'unsubscribed' | 'bounced';
}

export interface EmailCampaign {
    id: string;
    name: string;
    subject: string;
    body: string; // HTML body
    status: 'draft' | 'sending' | 'completed' | 'failed';
    recipientIds: string[];
    createdAt: string;
}

export interface EmailLog {
    id: string;
    campaignId: string;
    recipientId: string;
    recipientName: string;
    recipientEmail: string;
    status: 'pending' | 'sent' | 'failed' | 'bounced';
    sentAt: string | null;
    error: string | null;
}

// ===== EMAIL STORE =====
class EmailStore {
    private recipients: Map<string, EmailRecipient> = new Map();
    private campaigns: Map<string, EmailCampaign> = new Map();
    private logs: Map<string, EmailLog> = new Map();
    private smtpConfig: { host: string; port: number; user: string; pass: string; from: string } | null = null;

    // SMTP Config
    setSmtpConfig(config: { host: string; port: number; user: string; pass: string; from: string }) {
        this.smtpConfig = config;
    }

    getSmtpConfig() {
        return this.smtpConfig;
    }

    // Recipients
    addRecipient(data: { name: string; email: string; tags?: string[] }): EmailRecipient {
        const r: EmailRecipient = { id: uuid(), name: data.name, email: data.email, tags: data.tags || [], status: 'active' };
        this.recipients.set(r.id, r);
        return r;
    }

    addRecipientsBulk(items: Array<{ name: string; email: string; tags?: string[] }>): EmailRecipient[] {
        return items.map(item => this.addRecipient(item));
    }

    getRecipients(): EmailRecipient[] {
        return Array.from(this.recipients.values());
    }

    deleteRecipient(id: string): boolean {
        return this.recipients.delete(id);
    }

    // Campaigns
    createCampaign(data: { name: string; subject: string; body: string; recipientIds: string[] }): EmailCampaign {
        const c: EmailCampaign = {
            id: `EM-${String(this.campaigns.size + 1).padStart(3, '0')}`,
            name: data.name, subject: data.subject, body: data.body,
            status: 'draft', recipientIds: data.recipientIds,
            createdAt: new Date().toISOString(),
        };
        this.campaigns.set(c.id, c);
        return c;
    }

    getCampaigns(): Array<EmailCampaign & { stats: { total: number; sent: number; failed: number; pending: number } }> {
        return Array.from(this.campaigns.values()).map(c => {
            const logs = Array.from(this.logs.values()).filter(l => l.campaignId === c.id);
            return {
                ...c,
                stats: {
                    total: logs.length,
                    sent: logs.filter(l => l.status === 'sent').length,
                    failed: logs.filter(l => l.status === 'failed').length,
                    pending: logs.filter(l => l.status === 'pending').length,
                },
            };
        });
    }

    getCampaign(id: string): EmailCampaign | undefined {
        return this.campaigns.get(id);
    }

    updateCampaignStatus(id: string, status: EmailCampaign['status']) {
        const c = this.campaigns.get(id);
        if (c) c.status = status;
    }

    // Logs
    addLog(log: Omit<EmailLog, 'id'>): EmailLog {
        const l: EmailLog = { ...log, id: uuid() };
        this.logs.set(l.id, l);
        return l;
    }

    updateLog(id: string, status: EmailLog['status'], error?: string) {
        const l = this.logs.get(id);
        if (!l) return;
        l.status = status;
        if (status === 'sent') l.sentAt = new Date().toISOString();
        if (error) l.error = error;
    }

    getLogs(campaignId?: string): EmailLog[] {
        const all = Array.from(this.logs.values());
        if (campaignId) return all.filter(l => l.campaignId === campaignId);
        return all;
    }
}

export const emailStore = new EmailStore();

// ===== EMAIL SENDER =====
export async function sendEmailCampaign(campaignId: string): Promise<{ total: number; sent: number; failed: number }> {
    const campaign = emailStore.getCampaign(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const smtp = emailStore.getSmtpConfig();

    // Create transporter
    let transporter: nodemailer.Transporter;
    if (smtp) {
        transporter = nodemailer.createTransport({
            host: smtp.host, port: smtp.port, secure: smtp.port === 465,
            auth: { user: smtp.user, pass: smtp.pass },
        });
    } else {
        // Use environment variables or create a test account
        const envHost = process.env.SMTP_HOST;
        const envUser = process.env.SMTP_USER;
        const envPass = process.env.SMTP_PASS;

        if (envHost && envUser && envPass) {
            transporter = nodemailer.createTransport({
                host: envHost, port: Number(process.env.SMTP_PORT || 587), secure: false,
                auth: { user: envUser, pass: envPass },
            });
        } else {
            // Ethereal test account for demo
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email', port: 587, secure: false,
                auth: { user: testAccount.user, pass: testAccount.pass },
            });
            console.log('[Email] Using Ethereal test account:', testAccount.user);
        }
    }

    emailStore.updateCampaignStatus(campaignId, 'sending');

    const recipients = emailStore.getRecipients().filter(r =>
        campaign.recipientIds.includes(r.id) && r.status === 'active'
    );

    let sent = 0, failed = 0;

    for (const recipient of recipients) {
        // Create log entry
        const log = emailStore.addLog({
            campaignId, recipientId: recipient.id,
            recipientName: recipient.name, recipientEmail: recipient.email,
            status: 'pending', sentAt: null, error: null,
        });

        try {
            // Personalize body
            const personalizedBody = campaign.body
                .replace(/\{name\}/g, recipient.name)
                .replace(/\{email\}/g, recipient.email);

            const personalizedSubject = campaign.subject
                .replace(/\{name\}/g, recipient.name);

            const info = await transporter.sendMail({
                from: smtp?.from || process.env.SMTP_FROM || '"OpenClaw" <noreply@openclaw.ai>',
                to: `"${recipient.name}" <${recipient.email}>`,
                subject: personalizedSubject,
                html: personalizedBody,
                text: personalizedBody.replace(/<[^>]*>/g, ''), // strip HTML for text version
            });

            // Check if ethereal — get preview URL
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) console.log('[Email] Preview:', previewUrl);

            emailStore.updateLog(log.id, 'sent');
            sent++;
        } catch (err) {
            emailStore.updateLog(log.id, 'failed', (err as Error).message);
            failed++;
        }

        // Small delay between emails
        await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
    }

    emailStore.updateCampaignStatus(campaignId, failed === recipients.length ? 'failed' : 'completed');
    return { total: recipients.length, sent, failed };
}

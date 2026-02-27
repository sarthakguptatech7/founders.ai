import { NextRequest, NextResponse } from 'next/server';
import { createTransport } from 'nodemailer';
import { processIncomingMessage } from '@/lib/engine/support/ai-support-engine';
import { supportStore } from '@/lib/engine/support/support-store';
import { waStore } from '@/lib/engine/whatsapp/whatsapp-store';

// ===== CHANNEL CONFIG STORE =====
interface EmailConfig {
    imap: { host: string; port: number; user: string; pass: string; tls: boolean };
    smtp: { host: string; port: number; user: string; pass: string; from: string };
    configured: boolean;
    lastPoll?: string;
}

interface WhatsAppConfig {
    connected: boolean;
    monitoring: boolean;
}

const channelConfig: { email: EmailConfig; whatsapp: WhatsAppConfig } = {
    email: {
        imap: { host: '', port: 993, user: '', pass: '', tls: true },
        smtp: { host: '', port: 587, user: '', pass: '', from: '' },
        configured: false,
    },
    whatsapp: { connected: false, monitoring: false },
};

// Track processed email IDs to avoid duplicates
const processedEmailIds = new Set<string>();
// Store inbox emails for display
const inboxEmails: Array<{
    id: string; from: string; fromName: string; subject: string;
    body: string; date: string; processed: boolean;
}> = [];

// ===== IMAP Email Polling =====
async function pollEmails(): Promise<{ newCount: number; emails: typeof inboxEmails }> {
    if (!channelConfig.email.configured) return { newCount: 0, emails: inboxEmails };

    try {
        // Dynamic import for ImapFlow (ESM module)
        const { ImapFlow } = await import('imapflow');
        const client = new ImapFlow({
            host: channelConfig.email.imap.host,
            port: channelConfig.email.imap.port,
            secure: channelConfig.email.imap.tls,
            auth: { user: channelConfig.email.imap.user, pass: channelConfig.email.imap.pass },
            logger: false,
        });

        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        let newCount = 0;

        try {
            // Fetch last 20 unseen messages
            const messages = client.fetch({ seen: false }, { envelope: true, source: true }, { uid: true });

            for await (const msg of messages) {
                const uid = String(msg.uid);
                if (processedEmailIds.has(uid)) continue;
                processedEmailIds.add(uid);

                const from = msg.envelope?.from?.[0] as { name?: string; address?: string; mailbox?: string; host?: string } | undefined;
                const fromEmail = from?.address || (from ? `${from.mailbox || ''}@${from.host || ''}` : 'unknown');
                const fromAddress = from?.address || (from ? `${from.mailbox}@${from.host}` : 'unknown@unknown.com');
                const subject = msg.envelope?.subject || 'No subject';
                const date = msg.envelope?.date?.toISOString() || new Date().toISOString();

                // Extract text body from source
                let body = '';
                if (msg.source) {
                    const raw = msg.source.toString();
                    // Simple text extraction
                    const textMatch = raw.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\.\r\n|$)/i);
                    body = textMatch ? textMatch[1].trim() : raw.split('\r\n\r\n').slice(1).join('\n').slice(0, 500).trim();
                    // Clean up encoding
                    body = body.replace(/=\r\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
                }
                if (!body) body = `Email received: ${subject}`;

                const emailRecord = {
                    id: uid, from: fromAddress, fromName: fromEmail.split('@')[0],
                    subject, body: body.slice(0, 1000), date, processed: false,
                };
                inboxEmails.unshift(emailRecord);

                // Process through AI pipeline
                try {
                    await processIncomingMessage({
                        channel: 'email',
                        senderEmail: fromAddress,
                        senderName: fromEmail.split('@')[0],
                        subject,
                        messageText: body.slice(0, 500),
                    });
                    emailRecord.processed = true;
                    newCount++;
                } catch (err) {
                    console.error('[Channel] Failed to process email:', err);
                }
            }
        } finally {
            lock.release();
        }

        await client.logout();
        channelConfig.email.lastPoll = new Date().toISOString();
        return { newCount, emails: inboxEmails.slice(0, 50) };
    } catch (err) {
        console.error('[Channel] IMAP poll error:', err);
        return { newCount: 0, emails: inboxEmails } as { newCount: number; emails: typeof inboxEmails };
    }
}

// ===== Send Reply via Email =====
async function sendEmailReply(to: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
    if (!channelConfig.email.configured) return { success: false, error: 'Email not configured' };

    try {
        const transporter = createTransport({
            host: channelConfig.email.smtp.host,
            port: channelConfig.email.smtp.port,
            secure: false,
            auth: { user: channelConfig.email.smtp.user, pass: channelConfig.email.smtp.pass },
        });

        await transporter.sendMail({
            from: channelConfig.email.smtp.from || channelConfig.email.smtp.user,
            to,
            subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
            text: body,
            html: `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">${body.replace(/\n/g, '<br>')}</div>`,
        });

        return { success: true };
    } catch (err) {
        return { success: false, error: (err as Error).message };
    }
}

// ===== Send Reply via WhatsApp =====
async function sendWhatsAppReply(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Dispatch task to Clawdbot agent via SSE
        waStore.dispatchToAgent({
            action: 'send_whatsapp',
            phone,
            message,
            messageId: `support_reply_${Date.now()}`,
        });

        return { success: true };
    } catch (err) {
        return { success: false, error: (err as Error).message };
    }
}

// ===== API ROUTE =====
export async function GET(request: NextRequest) {
    const action = request.nextUrl.searchParams.get('action');

    if (action === 'status') {
        const device = waStore.getDevice();
        return NextResponse.json({
            email: { configured: channelConfig.email.configured, user: channelConfig.email.imap.user, lastPoll: channelConfig.email.lastPoll },
            whatsapp: { connected: device?.status === 'connected' || false, deviceId: device?.id, monitoring: channelConfig.whatsapp.monitoring },
        });
    }

    if (action === 'inbox') {
        return NextResponse.json({ emails: inboxEmails.slice(0, 50) });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        // Configure email (IMAP + SMTP)
        if (action === 'configure_email') {
            const { provider, email, password, imapHost, imapPort, smtpHost, smtpPort } = body;

            const PRESETS: Record<string, { imap: { host: string; port: number }; smtp: { host: string; port: number } }> = {
                gmail: { imap: { host: 'imap.gmail.com', port: 993 }, smtp: { host: 'smtp.gmail.com', port: 587 } },
                outlook: { imap: { host: 'outlook.office365.com', port: 993 }, smtp: { host: 'smtp-mail.outlook.com', port: 587 } },
                yahoo: { imap: { host: 'imap.mail.yahoo.com', port: 993 }, smtp: { host: 'smtp.mail.yahoo.com', port: 587 } },
            };

            const preset = PRESETS[provider];
            channelConfig.email = {
                imap: { host: preset?.imap.host || imapHost || '', port: preset?.imap.port || imapPort || 993, user: email, pass: password, tls: true },
                smtp: { host: preset?.smtp.host || smtpHost || '', port: preset?.smtp.port || smtpPort || 587, user: email, pass: password, from: email },
                configured: !!(email && password),
            };

            return NextResponse.json({ ok: true, configured: channelConfig.email.configured });
        }

        // Poll emails
        if (action === 'poll_emails') {
            const result = await pollEmails();
            return NextResponse.json(result);
        }

        // Send reply
        if (action === 'send_reply') {
            const { conversationId, message } = body;
            if (!conversationId || !message) return NextResponse.json({ error: 'conversationId and message required' }, { status: 400 });

            const conv = supportStore.getConversation(conversationId);
            if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

            const customer = supportStore.getCustomer(conv.customerId);
            if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

            // Store the message
            supportStore.addMessage({
                conversationId, sender: 'agent', senderName: 'Support Agent', content: message,
            });

            // Send via channel
            let delivery;
            if (conv.channel === 'email' && customer.email) {
                delivery = await sendEmailReply(customer.email, conv.subject, message);
            } else if (conv.channel === 'whatsapp' && customer.phone) {
                delivery = await sendWhatsAppReply(customer.phone, message);
            } else {
                delivery = { success: false, error: `No ${conv.channel} contact for customer` };
            }

            return NextResponse.json({
                ok: true, delivered: delivery.success,
                error: delivery.error, channel: conv.channel,
                recipient: conv.channel === 'email' ? customer.email : customer.phone,
            });
        }

        // Simulate incoming WhatsApp message (for testing)
        if (action === 'simulate_whatsapp') {
            const { phone, name, message } = body;
            const result = await processIncomingMessage({
                channel: 'whatsapp', senderPhone: phone || '+911234567890',
                senderName: name || 'WhatsApp User', messageText: message,
            });
            return NextResponse.json({
                conversationId: result.conversation.id,
                aiReply: result.aiReply?.content,
                intent: result.aiAnalysis.intent,
                sentiment: result.aiAnalysis.sentiment,
                ticketId: result.ticket?.id,
            });
        }

        // Configure WhatsApp monitoring
        if (action === 'configure_whatsapp') {
            channelConfig.whatsapp.monitoring = body.monitoring ?? true;
            const device = waStore.getDevice();
            channelConfig.whatsapp.connected = device?.status === 'connected' || false;
            return NextResponse.json({ ok: true, connected: channelConfig.whatsapp.connected, monitoring: channelConfig.whatsapp.monitoring });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

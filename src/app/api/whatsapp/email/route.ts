import { NextRequest, NextResponse } from 'next/server';
import { emailStore, sendEmailCampaign } from '@/lib/engine/whatsapp/email-engine';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// GET — list recipients, campaigns, logs
export async function GET(request: NextRequest) {
    const type = request.nextUrl.searchParams.get('type') || 'all';

    if (type === 'recipients') {
        return NextResponse.json({ recipients: emailStore.getRecipients() });
    }
    if (type === 'campaigns') {
        return NextResponse.json({ campaigns: emailStore.getCampaigns() });
    }
    if (type === 'logs') {
        const campaignId = request.nextUrl.searchParams.get('campaignId') || undefined;
        return NextResponse.json({ logs: emailStore.getLogs(campaignId) });
    }

    // All
    return NextResponse.json({
        recipients: emailStore.getRecipients(),
        campaigns: emailStore.getCampaigns(),
        logs: emailStore.getLogs(),
    });
}

// POST — multi-action endpoint
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        // === Add recipients ===
        if (action === 'add_recipients') {
            if (body.bulk && Array.isArray(body.recipients)) {
                const added = emailStore.addRecipientsBulk(body.recipients);
                return NextResponse.json({ recipients: added, count: added.length });
            }
            const { name, email, tags } = body;
            if (!name || !email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
            const recipient = emailStore.addRecipient({ name, email, tags });
            return NextResponse.json({ recipient });
        }

        // === Delete recipient ===
        if (action === 'delete_recipient') {
            emailStore.deleteRecipient(body.id);
            return NextResponse.json({ ok: true });
        }

        // === Configure SMTP ===
        if (action === 'smtp_config') {
            const { host, port, user, pass, from } = body;
            if (!host || !user || !pass) return NextResponse.json({ error: 'SMTP host, user, pass required' }, { status: 400 });
            emailStore.setSmtpConfig({ host, port: port || 587, user, pass, from: from || user });
            return NextResponse.json({ ok: true, message: 'SMTP configured' });
        }

        // === Create campaign ===
        if (action === 'create_campaign') {
            const { name, subject, body: htmlBody, recipientIds } = body;
            if (!name || !subject || !htmlBody) return NextResponse.json({ error: 'Name, subject, and body required' }, { status: 400 });

            let targets = recipientIds;
            if (!targets || targets.length === 0) {
                targets = emailStore.getRecipients().filter(r => r.status === 'active').map(r => r.id);
            }
            if (targets.length === 0) return NextResponse.json({ error: 'No recipients available' }, { status: 400 });

            const campaign = emailStore.createCampaign({ name, subject, body: htmlBody, recipientIds: targets });
            return NextResponse.json({ campaign });
        }

        // === Send campaign ===
        if (action === 'send_campaign') {
            const { campaignId } = body;
            if (!campaignId) return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
            const result = await sendEmailCampaign(campaignId);
            return NextResponse.json({ status: 'completed', ...result });
        }

        // === AI Generate email ===
        if (action === 'generate') {
            const { businessType, purpose, tone } = body;
            const prompt = `Generate a professional marketing email for a ${businessType || 'business'}.

Purpose: ${purpose || 'Promotional newsletter'}
Tone: ${tone || 'professional'}

Return a JSON object with two fields:
- "subject": The email subject line (compelling, under 60 chars)
- "body": The email body as clean HTML (use styling inline, include a header, body paragraphs, call-to-action button, and footer. Use {name} for personalization.)

Return ONLY valid JSON, no markdown, no explanation.`;

            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
                const result = await model.generateContent(prompt);
                const text = result.response.text().trim();
                const match = text.match(/\{[\s\S]*\}/);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    return NextResponse.json(parsed);
                }
            } catch { /* fallback below */ }

            // Fallback
            return NextResponse.json({
                subject: `Special Offer for {name} 🎉`,
                body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;background:#f9f9f9;border-radius:8px;">
<h1 style="color:#333;margin:0 0 16px;">Hi {name}!</h1>
<p style="color:#555;font-size:16px;line-height:1.6;">We have an exclusive offer just for you. Don't miss out on our latest deals and updates.</p>
<a href="#" style="display:inline-block;padding:12px 28px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin:16px 0;">Shop Now →</a>
<p style="color:#999;font-size:12px;margin-top:24px;">If you wish to unsubscribe, reply to this email.</p>
</div>`,
                fallback: true,
            });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { processIncomingMessage } from '@/lib/engine/support/ai-support-engine';

// POST — receive incoming message from WhatsApp agent or email
// This is the main entry point for the AI support pipeline
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { channel, senderPhone, senderEmail, senderName, subject, messageText } = body;

        if (!channel || !messageText) {
            return NextResponse.json({ error: 'channel and messageText are required' }, { status: 400 });
        }

        if (channel === 'whatsapp' && !senderPhone) {
            return NextResponse.json({ error: 'senderPhone required for WhatsApp' }, { status: 400 });
        }

        if (channel === 'email' && !senderEmail) {
            return NextResponse.json({ error: 'senderEmail required for email' }, { status: 400 });
        }

        // Run the full AI pipeline
        const result = await processIncomingMessage({
            channel,
            senderPhone,
            senderEmail,
            senderName,
            subject,
            messageText,
        });

        return NextResponse.json({
            conversationId: result.conversation.id,
            customerId: result.customer.id,
            customerName: result.customer.name,
            intent: result.aiAnalysis.intent,
            sentiment: result.aiAnalysis.sentiment,
            confidence: result.aiAnalysis.confidence,
            entities: result.aiAnalysis.entities,
            aiReply: result.aiReply?.content || null,
            shouldEscalate: result.aiAnalysis.shouldEscalate,
            escalationReason: result.aiAnalysis.escalationReason || null,
            ticketId: result.ticket?.id || null,
            // Include reply for agent to send back via WhatsApp/Email
            replyAction: result.aiReply ? {
                channel,
                recipient: channel === 'whatsapp' ? senderPhone : senderEmail,
                message: result.aiReply.content,
            } : null,
        });
    } catch (err) {
        console.error('[Support Intake] Error:', err);
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

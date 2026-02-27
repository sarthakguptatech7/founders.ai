import { NextRequest, NextResponse } from 'next/server';
import { supportStore } from '@/lib/engine/support/support-store';

// GET — list conversations with filters
export async function GET(request: NextRequest) {
    const channel = request.nextUrl.searchParams.get('channel') as 'whatsapp' | 'email' | null;
    const status = request.nextUrl.searchParams.get('status') as 'active' | 'waiting' | 'resolved' | 'escalated' | null;
    const id = request.nextUrl.searchParams.get('id');

    // Get single conversation with messages
    if (id) {
        const conv = supportStore.getConversation(id);
        if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const messages = supportStore.getMessages(id);
        const customer = supportStore.getCustomer(conv.customerId);
        return NextResponse.json({ conversation: conv, messages, customer });
    }

    const conversations = supportStore.getConversations({
        channel: channel || undefined,
        status: status || undefined,
    });

    return NextResponse.json({ conversations, total: conversations.length });
}

// POST — create/update conversation, add message
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'add_message') {
            const { conversationId, sender, senderName, content } = body;
            if (!conversationId || !content) return NextResponse.json({ error: 'conversationId and content required' }, { status: 400 });
            const msg = supportStore.addMessage({ conversationId, sender: sender || 'agent', senderName: senderName || 'Support Agent', content });
            return NextResponse.json({ message: msg });
        }

        if (action === 'update_status') {
            const { conversationId, status } = body;
            supportStore.updateConversation(conversationId, { status });
            return NextResponse.json({ ok: true });
        }

        if (action === 'get_analytics') {
            return NextResponse.json(supportStore.getAnalytics());
        }

        if (action === 'get_config') {
            return NextResponse.json(supportStore.getConfig());
        }

        if (action === 'update_config') {
            const { config } = body;
            supportStore.updateConfig(config);
            return NextResponse.json({ ok: true, config: supportStore.getConfig() });
        }

        if (action === 'add_kb') {
            const { question, answer, category } = body;
            const config = supportStore.getConfig();
            config.knowledgeBase.push({ question, answer, category: category || 'general' });
            return NextResponse.json({ ok: true, knowledgeBase: config.knowledgeBase });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

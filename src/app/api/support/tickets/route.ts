import { NextRequest, NextResponse } from 'next/server';
import { supportStore } from '@/lib/engine/support/support-store';

// GET — list tickets with filters
export async function GET(request: NextRequest) {
    const status = request.nextUrl.searchParams.get('status') as 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed' | null;
    const priority = request.nextUrl.searchParams.get('priority') as 'low' | 'medium' | 'high' | 'critical' | null;

    const tickets = supportStore.getTickets({
        status: status || undefined,
        priority: priority || undefined,
    });

    return NextResponse.json({ tickets, total: tickets.length });
}

// POST — create, escalate, resolve tickets
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'create') {
            const { conversationId, customerId, customerName, subject, priority, intent, channel } = body;
            if (!conversationId || !subject) return NextResponse.json({ error: 'conversationId and subject required' }, { status: 400 });
            const ticket = supportStore.createTicket({
                conversationId, customerId, customerName: customerName || 'Unknown',
                subject, priority: priority || 'medium', intent: intent || 'general', channel: channel || 'whatsapp',
            });
            return NextResponse.json({ ticket });
        }

        if (action === 'escalate') {
            supportStore.updateTicket(body.ticketId, { status: 'escalated', priority: body.priority || 'high' });
            return NextResponse.json({ ok: true });
        }

        if (action === 'resolve') {
            supportStore.resolveTicket(body.ticketId, body.resolution || 'Resolved');
            // Also resolve the conversation
            const ticket = supportStore.getTickets().find(t => t.id === body.ticketId);
            if (ticket) supportStore.updateConversation(ticket.conversationId, { status: 'resolved' });
            return NextResponse.json({ ok: true });
        }

        if (action === 'assign') {
            supportStore.updateTicket(body.ticketId, { assignedAgent: body.agent, status: 'in_progress' });
            return NextResponse.json({ ok: true });
        }

        if (action === 'update_status') {
            supportStore.updateTicket(body.ticketId, { status: body.status });
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

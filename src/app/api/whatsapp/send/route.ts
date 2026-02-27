import { NextRequest, NextResponse } from 'next/server';
import { waStore } from '@/lib/engine/whatsapp/whatsapp-store';
import { messageQueue } from '@/lib/engine/whatsapp/message-queue';

// POST — trigger campaign execution
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { campaignId } = body;

        if (!campaignId) {
            return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
        }

        const campaign = waStore.getCampaign(campaignId);
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Start the message queue for this campaign
        const result = await messageQueue.startCampaign(campaignId);

        return NextResponse.json({
            status: 'started',
            campaignId,
            ...result,
        });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// GET — get messages for a campaign (polling for logs)
export async function GET(request: NextRequest) {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    const messages = waStore.getMessages(campaignId || undefined);
    const campaigns = waStore.getCampaigns();

    return NextResponse.json({
        messages: messages.map(m => ({
            id: m.id,
            contact: m.contactName,
            phone: m.contactPhone,
            status: m.status,
            attempts: m.attempts,
            sentAt: m.sentAt,
            error: m.error,
        })),
        queueLength: messageQueue.getQueueLength(),
        processing: messageQueue.isProcessing(),
        campaigns: campaigns.map(c => ({ id: c.id, status: c.status, stats: c.stats })),
    });
}

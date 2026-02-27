import { NextRequest, NextResponse } from 'next/server';
import { waStore } from '@/lib/engine/whatsapp/whatsapp-store';

// GET — list campaigns with delivery stats
export async function GET() {
    const campaigns = waStore.getCampaigns();
    return NextResponse.json({ campaigns });
}

// POST — create campaign
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, messageTemplate, tone, deliveryMode, scheduleTime, throttle, contactIds } = body;

        if (!name || !messageTemplate) {
            return NextResponse.json({ error: 'Name and message template are required' }, { status: 400 });
        }

        // If no contactIds specified, use all opted-in contacts
        let targets = contactIds;
        if (!targets || targets.length === 0) {
            targets = waStore.getContacts().filter(c => c.optedIn).map(c => c.id);
        }

        if (targets.length === 0) {
            return NextResponse.json({ error: 'No contacts available. Upload contacts first.' }, { status: 400 });
        }

        const campaign = waStore.createCampaign({
            name, messageTemplate, tone: tone || 'friendly',
            deliveryMode: deliveryMode || 'immediate',
            scheduleTime, throttle: throttle || 4, contactIds: targets,
        });

        return NextResponse.json({ campaign });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

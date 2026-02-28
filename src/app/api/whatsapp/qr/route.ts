import { NextResponse } from 'next/server';
import { waStore } from '@/lib/engine/whatsapp/whatsapp-store';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const device = waStore.getDevice();
        if (!device) {
            return NextResponse.json({ status: 'disconnected', qrData: null });
        }
        return NextResponse.json({ status: device.status, qrData: device.qrData });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

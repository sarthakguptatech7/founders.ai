import { NextRequest, NextResponse } from 'next/server';
import { getFundraisingState, runFundraisingAgent } from '@/lib/engine/fundraising/fundraising-intelligence';

export async function GET() {
    try {
        return NextResponse.json(getFundraisingState());
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { business_context } = await req.json();
        if (!business_context) return NextResponse.json({ error: 'business_context required' }, { status: 400 });
        const result = await runFundraisingAgent(business_context);
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

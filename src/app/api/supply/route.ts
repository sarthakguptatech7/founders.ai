import { NextRequest, NextResponse } from 'next/server';
import {
    getSupplyChainState,
    analyzeSupplyChain,
} from '@/lib/engine/supply/supply-intelligence';

export async function GET() {
    try {
        const state = getSupplyChainState();
        return NextResponse.json(state);
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { business_context } = await req.json();
        if (!business_context) {
            return NextResponse.json({ error: 'business_context required' }, { status: 400 });
        }

        const result = await analyzeSupplyChain(business_context);
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

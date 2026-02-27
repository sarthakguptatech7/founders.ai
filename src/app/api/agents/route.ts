import { NextRequest, NextResponse } from 'next/server';
import { generateAgents } from '@/lib/engine/agent-generator';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { profile, complexity_scores } = body;

        if (!profile || !complexity_scores) {
            return NextResponse.json(
                { error: 'Business profile and complexity scores are required' },
                { status: 400 }
            );
        }

        const agents = generateAgents(profile, complexity_scores);

        return NextResponse.json({ agents });
    } catch (error) {
        console.error('Agent generation error:', error);
        return NextResponse.json(
            { error: `Agent generation failed: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}

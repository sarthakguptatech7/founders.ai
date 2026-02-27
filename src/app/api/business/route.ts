import { NextRequest, NextResponse } from 'next/server';
import { analyzeBusinessIntent } from '@/lib/engine/business-understanding';
import { calculateComplexityScores } from '@/lib/engine/scoring';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt } = body;

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: 'Business description is required' },
                { status: 400 }
            );
        }

        const profile = await analyzeBusinessIntent(prompt);
        const complexity_scores = calculateComplexityScores(profile);

        return NextResponse.json({ profile, complexity_scores });
    } catch (error) {
        console.error('Business analysis error:', error);
        return NextResponse.json(
            { error: `Business analysis failed: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}

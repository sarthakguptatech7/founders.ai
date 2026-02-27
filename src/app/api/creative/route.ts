import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { prompt, profile } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

        const businessContext = profile ? `Context: We are a ${profile.industry} company targeting ${profile.target_audience || 'customers'}.` : '';

        const systemPrompt = `You are an expert AI graphic designer and marketer. 
The user wants to create a flyer, poster, or photo ad.
${businessContext}

User request: "${prompt}"

Generate the perfect text and a highly detailed image background prompt for this creative.
The image prompt should describe a photograph, 3D render, or digital illustration that represents the request. IT MUST BE HIGH QUALITY. NO TEXT IN THE IMAGE PROMPT. Just describe the visual scene.

Return pure JSON exactly in this format:
{
    "headline": "Short, punchy headline (max 5 words)",
    "subtext": "Engaging subheadline or description (max 15 words)",
    "ctaText": "Short call to action button text (max 3 words)",
    "imagePrompt": "Highly descriptive, comma-separated list of visual elements, lighting, style, 8k, photorealistic etc."
}`;

        const result = await model.generateContent(systemPrompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error('Failed to parse JSON from AI response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);

    } catch (err) {
        console.error('Creative generation error:', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

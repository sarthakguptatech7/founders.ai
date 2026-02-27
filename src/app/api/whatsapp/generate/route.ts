import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// POST — AI-generate promotional WhatsApp message
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { businessType, offerDetails, tone, language, customerSegment } = body;

        if (!businessType) {
            return NextResponse.json({ error: 'Business type is required' }, { status: 400 });
        }

        const prompt = `You are a WhatsApp marketing message generator for a ${businessType} business.

Generate a promotional WhatsApp message with these parameters:
- Offer: ${offerDetails || 'General promotion'}
- Tone: ${tone || 'friendly'}
- Language: ${language || 'English'}
- Customer segment: ${customerSegment || 'General'}

Rules:
1. Keep it under 200 characters
2. Use appropriate emojis (2-3 max)
3. Include a clear call-to-action
4. Use personalization tokens: {name} for customer name, {link} for offer link
5. Make it feel personal, not spammy
6. Add line breaks for readability

Return ONLY the message text, nothing else. No quotes, no explanation.`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Also generate A/B variants
        const variantPrompt = `Generate 2 alternative versions of this WhatsApp marketing message in different styles. Keep same parameters.
Original: ${text}

Return as JSON array of strings: ["variant1", "variant2"]`;

        let variants: string[] = [];
        try {
            const varResult = await model.generateContent(variantPrompt);
            const varText = varResult.response.text().trim();
            const match = varText.match(/\[[\s\S]*\]/);
            if (match) variants = JSON.parse(match[0]);
        } catch {
            // Variants are optional
        }

        return NextResponse.json({
            message: text,
            variants,
            tone: tone || 'friendly',
            language: language || 'English',
        });
    } catch (error) {
        // Fallback if no Gemini key
        const fallback = `Hi {name}! 🎉\nWe have an amazing offer for you today.\nCheck it out: {link}\nDon't miss out! 💫`;
        return NextResponse.json({
            message: fallback,
            variants: [],
            tone: 'friendly',
            language: 'English',
            fallback: true,
            error: (error as Error).message,
        });
    }
}

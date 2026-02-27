import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in environment variables' }, { status: 500 });
        }

        const { profile, prompt } = await req.json();

        const systemInstruction = `
        You are an elite Brand Strategist and Creative Director. 
        Your task is to generate exactly THREE (3) highly distinct, premium business name ideas for the user's business.
        For each name, provide:
        1. 'name': The brand name.
        2. 'rationale': A 1-sentence explanation of why it fits the business and industry.
        3. 'logoPrompt': A highly detailed, descriptive prompt for an AI image generator (Pollinations.ai / Midjourney style) to create a striking, professional logo. 
        
        CRITICAL RULES FOR LOGO PROMPT:
        - NEVER include text, words, or letters in the logo design itself (AI struggles with spelling). Specify "icon only", "no text", "no typography".
        - Describe the visual style (e.g., minimalist vector, cyberpunk neon, elegant gold foil, isometric 3D).
        - Describe the core symbol/icon.
        - Describe the background (e.g., "isolated on black background", "transparent background").
        
        Return the result AS A PURE JSON ARRAY of objects, with no markdown formatting, no \`\`\`json block. Just the raw array.
        Example format:
        [
            {
                "name": "Synapse Health",
                "rationale": "Evokes connection and intelligence, perfect for an AI-driven medical platform.",
                "logoPrompt": "A minimalist vector icon of a stylized glowing brain connected by glowing nodes, neon blue and purple, sleek tech style, isolated on dark background, no text, highly detailed, high quality logo design"
            }
        ]
        `;

        const userPrompt = `
        Business Profile Context:
        ${profile ? JSON.stringify(profile, null, 2) : 'No specific profile provided.'}
        
        Custom User Request (if any):
        ${prompt || 'Generate 3 amazing brand identities based on the profile.'}
        `;

        const result = await model.generateContent([systemInstruction, userPrompt]);
        const responseText = result.response.text();

        // Clean markdown if Gemini accidentally included it
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const brands = JSON.parse(cleanedText);

        return NextResponse.json({ brands });
    } catch (error: any) {
        console.error('Brand AI Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error during brand generation' }, { status: 500 });
    }
}

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }
    return genAI;
}

export async function callClaude(
    systemPrompt: string,
    userMessage: string,
    options?: {
        maxTokens?: number;
        temperature?: number;
    }
): Promise<string> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
        model: 'gemini-2.5-pro',
        systemInstruction: systemPrompt,
        generationConfig: {
            maxOutputTokens: options?.maxTokens || 16384,
            temperature: options?.temperature ?? 0.7,
        },
    });

    const result = await model.generateContent(userMessage);
    const response = result.response;
    return response.text();
}

export async function callClaudeJSON<T>(
    systemPrompt: string,
    userMessage: string,
    options?: {
        maxTokens?: number;
        temperature?: number;
    }
): Promise<T> {
    const client = getGeminiClient();

    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const model = client.getGenerativeModel({
                model: 'gemini-2.5-pro',
                systemInstruction: systemPrompt + '\n\nCRITICAL: Respond ONLY with a valid JSON object. Be CONCISE — keep all string values under 200 characters. No markdown. No code blocks.',
                generationConfig: {
                    maxOutputTokens: options?.maxTokens || 16384,
                    temperature: options?.temperature ?? 0.7,
                    responseMimeType: 'application/json',
                },
            });

            const result = await model.generateContent(userMessage);
            const response = result.response;
            const text = response.text().trim();

            if (!text) {
                throw new Error('Empty response from Gemini');
            }

            return JSON.parse(text) as T;
        } catch (e) {
            lastError = e as Error;
            console.error(`[Gemini] Attempt ${attempt + 1} failed:`, (e as Error).message?.substring(0, 150));

            // If it's a JSON parse error, try fallback extraction
            if ((e as Error).message?.includes('JSON')) {
                try {
                    const model = client.getGenerativeModel({
                        model: 'gemini-2.5-pro',
                        systemInstruction: 'You are a concise JSON responder. Keep ALL values SHORT (under 100 characters each). Respond only with valid JSON.',
                        generationConfig: {
                            maxOutputTokens: 8192,
                            temperature: 0.3,
                            responseMimeType: 'application/json',
                        },
                    });

                    const retryPrompt = userMessage + '\n\nIMPORTANT: Keep your entire response under 2000 characters. Be extremely concise.';
                    const retryResult = await model.generateContent(retryPrompt);
                    const retryText = retryResult.response.text().trim();

                    if (retryText) {
                        return JSON.parse(retryText) as T;
                    }
                } catch (retryError) {
                    console.error(`[Gemini] Retry also failed:`, (retryError as Error).message?.substring(0, 100));
                    lastError = retryError as Error;
                }
            }
        }
    }

    throw lastError || new Error('Failed to get valid JSON from Gemini');
}

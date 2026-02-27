// AI Support Intelligence Engine — Gemini-powered intent classification, sentiment analysis, response generation
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supportStore, SupportIntent, Sentiment, SupportMessage, SupportConversation, SupportCustomer } from './support-store';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface AIAnalysis {
    intent: SupportIntent;
    sentiment: Sentiment;
    confidence: number;
    entities: Record<string, string>;
    suggestedReply: string;
    shouldEscalate: boolean;
    escalationReason?: string;
}

// ===== INTENT CLASSIFICATION + RESPONSE GENERATION =====
export async function analyzeAndRespond(
    message: string,
    conversation: SupportConversation,
    customer: SupportCustomer,
    history: SupportMessage[]
): Promise<AIAnalysis> {
    const config = supportStore.getConfig();
    const kb = config.knowledgeBase.map(k => `Q: ${k.question}\nA: ${k.answer}`).join('\n\n');
    const historyText = history.slice(-6).map(m => `[${m.sender}] ${m.content}`).join('\n');

    const prompt = `You are an AI customer support agent for a business. Analyze the customer message and generate a helpful response.

CUSTOMER INFO:
Name: ${customer.name}
Channel: ${conversation.channel}
Previous conversations: ${customer.totalConversations}

CONVERSATION HISTORY:
${historyText || 'No previous messages'}

KNOWLEDGE BASE:
${kb}

CUSTOMER'S NEW MESSAGE:
"${message}"

Respond with a JSON object (NO markdown, NO explanation, ONLY valid JSON):
{
  "intent": one of ["order_tracking", "refund_request", "complaint", "product_question", "technical_support", "general", "escalation", "greeting"],
  "sentiment": one of ["positive", "neutral", "negative", "angry"],
  "confidence": number between 0 and 1,
  "entities": object with extracted key-value pairs (e.g. {"order_id": "56321", "product": "shoes"}),
  "suggestedReply": "A natural, helpful reply to the customer. Use their name. Be concise and professional. If you can answer from the knowledge base, do so. If you need more info, ask politely.",
  "shouldEscalate": boolean (true if angry customer, refund request, or you can't help),
  "escalationReason": "reason if shouldEscalate is true, null otherwise"
}`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            const parsed = JSON.parse(match[0]) as AIAnalysis;
            // Apply escalation rules
            if (parsed.sentiment === 'angry' || parsed.intent === 'refund_request') {
                parsed.shouldEscalate = true;
                if (!parsed.escalationReason) parsed.escalationReason = parsed.sentiment === 'angry' ? 'Angry customer detected' : 'Refund request';
            }
            if (parsed.confidence < config.confidenceThreshold) {
                parsed.shouldEscalate = true;
                parsed.escalationReason = `Low confidence (${(parsed.confidence * 100).toFixed(0)}%)`;
            }
            return parsed;
        }
    } catch (err) {
        console.error('[AI Support] Gemini error:', err);
    }

    // Fallback
    return {
        intent: 'general',
        sentiment: 'neutral',
        confidence: 0.3,
        entities: {},
        suggestedReply: `Hi ${customer.name}, thank you for reaching out! I've received your message and will get back to you shortly. If this is urgent, please let me know.`,
        shouldEscalate: true,
        escalationReason: 'AI processing failed — fallback response',
    };
}

// ===== FULL MESSAGE PROCESSING PIPELINE =====
export async function processIncomingMessage(data: {
    channel: 'whatsapp' | 'email';
    senderPhone?: string;
    senderEmail?: string;
    senderName?: string;
    subject?: string;
    messageText: string;
}): Promise<{
    conversation: SupportConversation;
    customer: SupportCustomer;
    customerMessage: SupportMessage;
    aiAnalysis: AIAnalysis;
    aiReply?: SupportMessage;
    ticket?: ReturnType<typeof supportStore.createTicket>;
}> {
    // 1. Find or create customer
    const customer = supportStore.findOrCreateCustomer({
        phone: data.senderPhone,
        email: data.senderEmail,
        name: data.senderName,
    });

    // 2. Find or create conversation
    let conversation = supportStore.findActiveConversation(customer.id, data.channel);
    if (!conversation) {
        conversation = supportStore.createConversation({
            customerId: customer.id,
            channel: data.channel,
            subject: data.subject || data.messageText.slice(0, 60) + '...',
        });
    }

    // 3. Store customer message
    const customerMessage = supportStore.addMessage({
        conversationId: conversation.id,
        sender: 'customer',
        senderName: customer.name,
        content: data.messageText,
    });

    // 4. AI analysis
    const history = supportStore.getMessages(conversation.id);
    const aiAnalysis = await analyzeAndRespond(data.messageText, conversation, customer, history);

    // 5. Update conversation with AI insights
    supportStore.updateConversation(conversation.id, {
        intent: aiAnalysis.intent,
        sentiment: aiAnalysis.sentiment,
    });

    // Update customer message with AI metadata
    customerMessage.intent = aiAnalysis.intent;
    customerMessage.sentiment = aiAnalysis.sentiment;
    customerMessage.confidence = aiAnalysis.confidence;
    customerMessage.entities = aiAnalysis.entities;

    // 6. Log action
    supportStore.logAction({
        conversationId: conversation.id,
        actionType: 'ai_analysis',
        parameters: { intent: aiAnalysis.intent, sentiment: aiAnalysis.sentiment, confidence: String(aiAnalysis.confidence) },
        result: aiAnalysis.shouldEscalate ? 'escalation_triggered' : 'auto_reply',
    });

    let aiReply: SupportMessage | undefined;
    let ticket;

    // 7. Auto-reply if enabled and not escalating
    const config = supportStore.getConfig();
    if (config.autoReplyEnabled && !aiAnalysis.shouldEscalate && conversation.autoReplyEnabled) {
        aiReply = supportStore.addMessage({
            conversationId: conversation.id,
            sender: 'ai',
            senderName: 'Clawdbot AI',
            content: aiAnalysis.suggestedReply,
            intent: aiAnalysis.intent,
            confidence: aiAnalysis.confidence,
        });
    }

    // 8. Create ticket if escalation needed
    if (aiAnalysis.shouldEscalate) {
        const priority = aiAnalysis.sentiment === 'angry' ? 'critical' as const :
            aiAnalysis.intent === 'refund_request' ? 'high' as const :
                aiAnalysis.confidence < 0.4 ? 'high' as const : 'medium' as const;

        ticket = supportStore.createTicket({
            conversationId: conversation.id,
            customerId: customer.id,
            customerName: customer.name,
            subject: conversation.subject,
            priority,
            intent: aiAnalysis.intent,
            channel: data.channel,
        });

        supportStore.updateConversation(conversation.id, { status: 'escalated' });

        // Still send a holding reply
        if (config.autoReplyEnabled && !aiReply) {
            aiReply = supportStore.addMessage({
                conversationId: conversation.id,
                sender: 'ai',
                senderName: 'Clawdbot AI',
                content: `Hi ${customer.name}, I've noted your concern and created a support ticket (${ticket.id}). A team member will review this shortly. ${aiAnalysis.suggestedReply}`,
                intent: aiAnalysis.intent,
                confidence: aiAnalysis.confidence,
            });
        }
    }

    return { conversation, customer, customerMessage, aiAnalysis, aiReply, ticket };
}

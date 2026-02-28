import { NextRequest } from 'next/server';
import { runDebate } from '@/lib/engine/debate-engine';
import { AgentMessage, DebatePhase, ConflictSummary } from '@/lib/types';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { profile, agents } = body;

        if (!profile || !agents) {
            return new Response(JSON.stringify({ error: 'Profile and agents required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Use streaming response for real-time debate updates
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (type: string, data: unknown) => {
                    const event = JSON.stringify({ type, data });
                    controller.enqueue(encoder.encode(`data: ${event}\n\n`));
                };

                try {
                    const debateState = await runDebate(
                        profile,
                        agents,
                        (message: AgentMessage) => {
                            sendEvent('agent_message', message);
                        },
                        (phase: DebatePhase) => {
                            sendEvent('phase_change', phase);
                        },
                        (conflict: ConflictSummary) => {
                            sendEvent('conflict', conflict);
                        }
                    );

                    sendEvent('complete', debateState);
                    controller.close();
                } catch (error) {
                    sendEvent('error', (error as Error).message);
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { executeCommand } from '@/lib/engine/ops/execution-engine';
import { opsStore, OPS_TEMPLATES } from '@/lib/engine/ops/ops-store';

// POST — Execute a natural language command
export async function POST(request: NextRequest) {
    try {
        const { command } = await request.json();

        if (!command || typeof command !== 'string' || !command.trim()) {
            return NextResponse.json({ error: 'Command is required' }, { status: 400 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (data: unknown) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    await executeCommand(command.trim(), (progress) => {
                        sendEvent(progress);
                    });
                    controller.close();
                } catch (error) {
                    sendEvent({ type: 'error', message: (error as Error).message });
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
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// GET — List workflows and templates
export async function GET() {
    const workflows = opsStore.getWorkflows();
    return NextResponse.json({
        workflows: workflows.slice(0, 50),
        templates: OPS_TEMPLATES,
    });
}

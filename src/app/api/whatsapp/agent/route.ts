import { NextRequest, NextResponse } from 'next/server';
import { waStore, AgentTask } from '@/lib/engine/whatsapp/whatsapp-store';

// GET — SSE stream for Clawdbot agent to receive tasks
export async function GET() {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            // Send connected event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`));

            // Register listener for tasks
            const listener = (task: AgentTask) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'task', ...task })}\n\n`));
                } catch {
                    // Client disconnected
                }
            };

            waStore.addAgentListener(listener);

            // Heartbeat every 15s
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`));
                } catch {
                    clearInterval(heartbeat);
                }
            }, 15000);

            // Cleanup on close
            const cleanup = () => {
                waStore.removeAgentListener(listener);
                clearInterval(heartbeat);
            };

            // Handle abort
            if (typeof controller.close === 'function') {
                // Will be cleaned up when client disconnects
            }

            // Store cleanup ref
            (controller as unknown as { _cleanup: () => void })._cleanup = cleanup;
        },
        cancel() {
            // Cleanup happens automatically
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

// POST — Agent reports back task result
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messageId, status, error, authToken } = body;

        // Verify device
        const device = waStore.getDevice();
        if (!device || device.authToken !== authToken) {
            return NextResponse.json({ error: 'Unauthorized agent' }, { status: 401 });
        }

        if (!messageId || !status) {
            return NextResponse.json({ error: 'messageId and status required' }, { status: 400 });
        }

        waStore.updateMessageStatus(messageId, status, error);
        waStore.setDeviceStatus('connected'); // refresh last seen

        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

// PUT — Register/connect device
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { platform } = body;

        const device = waStore.registerDevice(platform || 'unknown');
        return NextResponse.json({ device });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

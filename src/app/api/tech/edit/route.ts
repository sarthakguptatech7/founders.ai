import { NextRequest, NextResponse } from 'next/server';
import { editProject } from '@/lib/engine/tech/edit-engine';

export async function POST(request: NextRequest) {
    try {
        const { projectId, editCommand } = await request.json();

        if (!projectId || !editCommand) {
            return NextResponse.json({ error: 'projectId and editCommand required' }, { status: 400 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (data: unknown) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    const project = await editProject(projectId, editCommand, (msg) => {
                        sendEvent({ type: 'progress', message: msg });
                    });

                    if (project) {
                        sendEvent({ type: 'complete', project });
                    } else {
                        sendEvent({ type: 'error', message: 'Project not found' });
                    }
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

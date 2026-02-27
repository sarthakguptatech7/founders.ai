import { NextRequest } from 'next/server';
import { buildProject } from '@/lib/engine/tech/tech-controller';
import { BusinessProfile } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { profile, userRequest } = body as { profile: BusinessProfile; userRequest?: string };

        if (!profile) {
            return new Response(JSON.stringify({ error: 'Business profile required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (data: unknown) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    const project = await buildProject(profile, (progress) => {
                        sendEvent(progress);
                    }, userRequest);

                    // Send each file individually to avoid massive single-payload SSE issues
                    for (const file of project.files) {
                        sendEvent({
                            type: 'file_ready',
                            path: file.path,
                            purpose: file.purpose,
                            content: file.content,
                        });
                    }

                    // Send completion event (lightweight — no file content)
                    sendEvent({
                        type: 'complete',
                        project: {
                            id: project.id,
                            name: project.name,
                            scope: project.scope,
                            status: project.status,
                            currentVersion: project.currentVersion,
                            previewReady: project.previewReady,
                            fileCount: project.files.length,
                        },
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
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

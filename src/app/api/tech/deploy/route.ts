import { NextRequest, NextResponse } from 'next/server';

// POST — Deploy project to Vercel using their REST API
// Accepts files directly from the client to avoid server-side store issues
export async function POST(request: NextRequest) {
    try {
        const { projectName, files } = await request.json() as {
            projectName: string;
            files: { path: string; content: string }[];
        };

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files to deploy' }, { status: 400 });
        }

        const vercelToken = process.env.VERCEL_TOKEN;
        if (!vercelToken) {
            return NextResponse.json({ error: 'VERCEL_TOKEN not configured in .env.local' }, { status: 500 });
        }

        // Build the files array for Vercel API
        const vercelFiles = files.map(f => ({
            file: f.path,
            data: Buffer.from(f.content, 'utf-8').toString('base64'),
            encoding: 'base64' as const,
        }));

        // Deploy via Vercel API v13
        const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${vercelToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: (projectName || 'my-website').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').substring(0, 52),
                files: vercelFiles,
                projectSettings: {
                    framework: null, // Static HTML
                },
                target: 'production',
            }),
        });

        if (!deployRes.ok) {
            const errData = await deployRes.json().catch(() => ({}));
            const errMsg = (errData as { error?: { message?: string } }).error?.message || `Vercel API error: ${deployRes.status}`;
            return NextResponse.json({ error: errMsg }, { status: deployRes.status });
        }

        const deployment = await deployRes.json() as {
            id: string;
            url: string;
            readyState: string;
            alias?: string[];
        };

        return NextResponse.json({
            success: true,
            deploymentId: deployment.id,
            url: `https://${deployment.url}`,
            readyState: deployment.readyState,
            aliases: deployment.alias || [],
        });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

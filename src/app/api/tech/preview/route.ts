import { NextRequest, NextResponse } from 'next/server';
import { getProjectFile, getProject } from '@/lib/engine/tech/project-store';

const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    let filePath = searchParams.get('path') || 'index.html';

    if (!projectId) {
        return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const project = getProject(projectId);
    if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Handle root path
    if (filePath === '/' || filePath === '') {
        filePath = 'index.html';
    }

    // Remove leading slash
    filePath = filePath.replace(/^\//, '');

    const file = getProjectFile(projectId, filePath);
    if (!file) {
        // Try index.html as fallback
        const indexFile = getProjectFile(projectId, 'index.html');
        if (indexFile && filePath !== 'index.html') {
            return new Response(indexFile.content, {
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'no-cache',
                },
            });
        }
        return NextResponse.json({ error: `File not found: ${filePath}` }, { status: 404 });
    }

    // Determine MIME type
    const ext = '.' + filePath.split('.').pop()?.toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'text/plain';

    // For HTML files, inject base tag to handle relative URLs
    let content = file.content;
    if (ext === '.html') {
        // Rewrite relative CSS/JS references to use our preview API
        content = content.replace(
            /href="(?!http|\/\/|#|mailto)(.*?)"/g,
            `href="/api/tech/preview?projectId=${projectId}&path=$1"`
        );
        content = content.replace(
            /src="(?!http|\/\/|data:)(.*?)"/g,
            `src="/api/tech/preview?projectId=${projectId}&path=$1"`
        );
    }

    return new Response(content, {
        headers: {
            'Content-Type': `${mimeType}; charset=utf-8`,
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*',
        },
    });
}

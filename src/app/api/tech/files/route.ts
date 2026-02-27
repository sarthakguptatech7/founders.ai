import { NextRequest, NextResponse } from 'next/server';
import { getFileTree, getProjectFile, getProject } from '@/lib/engine/tech/project-store';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const filePath = searchParams.get('path');

    if (!projectId) {
        return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const project = getProject(projectId);
    if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // If path specified, return file content
    if (filePath) {
        const file = getProjectFile(projectId, filePath);
        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        return NextResponse.json(file);
    }

    // Return file tree + project metadata
    return NextResponse.json({
        project: {
            id: project.id,
            name: project.name,
            scope: project.scope,
            status: project.status,
            currentVersion: project.currentVersion,
            previewReady: project.previewReady,
        },
        files: getFileTree(projectId),
    });
}

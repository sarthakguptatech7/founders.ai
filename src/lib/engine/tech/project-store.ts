import { v4 as uuidv4 } from 'uuid';

// ===== TYPES =====
export interface ProjectFile {
    path: string;
    content: string;
    purpose: string;
    hash: string;
    version: number;
}

export interface ProjectVersion {
    version: number;
    files: ProjectFile[];
    timestamp: string;
    changeSummary: string;
}

export interface TechProject {
    id: string;
    businessId: string;
    name: string;
    framework: 'static' | 'react' | 'nextjs';
    scope: 'landing' | 'multipage' | 'dashboard' | 'ecommerce' | 'saas';
    status: 'planning' | 'generating' | 'ready' | 'editing' | 'error';
    files: ProjectFile[];
    versions: ProjectVersion[];
    currentVersion: number;
    createdAt: string;
    updatedAt: string;
    previewReady: boolean;
    error?: string;
}

// ===== IN-MEMORY STORE (globalThis for Next.js dev-mode hot reload survival) =====
const globalForProjects = globalThis as unknown as { __techProjects: Map<string, TechProject> };
if (!globalForProjects.__techProjects) {
    globalForProjects.__techProjects = new Map<string, TechProject>();
}
const projects = globalForProjects.__techProjects;

function hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

export function createProject(params: {
    businessId: string;
    name: string;
    scope: TechProject['scope'];
}): TechProject {
    const project: TechProject = {
        id: uuidv4(),
        businessId: params.businessId,
        name: params.name,
        framework: 'static',
        scope: params.scope,
        status: 'planning',
        files: [],
        versions: [],
        currentVersion: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        previewReady: false,
    };
    projects.set(project.id, project);
    return project;
}

export function getProject(id: string): TechProject | undefined {
    return projects.get(id);
}

export function setProjectFiles(projectId: string, files: ProjectFile[]): void {
    const project = projects.get(projectId);
    if (!project) return;

    project.files = files.map(f => ({
        ...f,
        hash: hashContent(f.content),
        version: project.currentVersion,
    }));
    project.updatedAt = new Date().toISOString();
    projects.set(projectId, project);
}

export function updateProjectFile(projectId: string, filePath: string, content: string): void {
    const project = projects.get(projectId);
    if (!project) return;

    const fileIndex = project.files.findIndex(f => f.path === filePath);
    if (fileIndex >= 0) {
        project.files[fileIndex].content = content;
        project.files[fileIndex].hash = hashContent(content);
        project.files[fileIndex].version = project.currentVersion;
    }
    project.updatedAt = new Date().toISOString();
    projects.set(projectId, project);
}

export function snapshotVersion(projectId: string, changeSummary: string): void {
    const project = projects.get(projectId);
    if (!project) return;

    project.currentVersion++;
    const snapshot: ProjectVersion = {
        version: project.currentVersion,
        files: project.files.map(f => ({ ...f })),
        timestamp: new Date().toISOString(),
        changeSummary,
    };
    project.versions.push(snapshot);
    projects.set(projectId, project);
}

export function rollbackVersion(projectId: string, version: number): boolean {
    const project = projects.get(projectId);
    if (!project) return false;

    const snapshot = project.versions.find(v => v.version === version);
    if (!snapshot) return false;

    project.files = snapshot.files.map(f => ({ ...f }));
    project.currentVersion = version;
    project.updatedAt = new Date().toISOString();
    projects.set(projectId, project);
    return true;
}

export function setProjectStatus(projectId: string, status: TechProject['status'], error?: string): void {
    const project = projects.get(projectId);
    if (!project) return;
    project.status = status;
    project.error = error;
    project.previewReady = status === 'ready';
    project.updatedAt = new Date().toISOString();
    projects.set(projectId, project);
}

export function getProjectFile(projectId: string, filePath: string): ProjectFile | undefined {
    const project = projects.get(projectId);
    if (!project) return undefined;
    return project.files.find(f => f.path === filePath);
}

export function getFileTree(projectId: string): { path: string; purpose: string }[] {
    const project = projects.get(projectId);
    if (!project) return [];
    return project.files.map(f => ({ path: f.path, purpose: f.purpose }));
}

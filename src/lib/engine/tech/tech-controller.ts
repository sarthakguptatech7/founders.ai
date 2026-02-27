import { BusinessProfile } from '../../types';
import { planArchitecture, generateProject } from './code-generator';
import {
    createProject,
    setProjectFiles,
    setProjectStatus,
    snapshotVersion,
    getProject,
    TechProject,
} from './project-store';

export interface BuildProgress {
    type: 'planning' | 'generating_file' | 'complete' | 'error';
    message: string;
    file?: string;
    fileIndex?: number;
    totalFiles?: number;
    projectId?: string;
}

export async function buildProject(
    profile: BusinessProfile,
    onProgress: (progress: BuildProgress) => void,
    userRequest?: string
): Promise<TechProject> {
    // Create project
    const project = createProject({
        businessId: profile.summary.substring(0, 50),
        name: `${profile.industry} Website`,
        scope: 'landing',
    });

    try {
        // Step 1: Plan architecture
        setProjectStatus(project.id, 'planning');
        onProgress({ type: 'planning', message: 'Analyzing business & planning architecture...', projectId: project.id });

        const plan = await planArchitecture(profile, userRequest);
        project.scope = plan.scope;

        // Step 2: Generate files
        setProjectStatus(project.id, 'generating');
        onProgress({ type: 'generating_file', message: 'Generating project files...', projectId: project.id, fileIndex: 0, totalFiles: plan.pages.length + 2 });

        const files = await generateProject(profile, plan, (file, index, total) => {
            onProgress({
                type: 'generating_file',
                message: `Generating ${file}...`,
                file,
                fileIndex: index,
                totalFiles: total,
                projectId: project.id,
            });
        });

        // Step 3: Store files and finalize
        setProjectFiles(project.id, files);
        snapshotVersion(project.id, 'Initial generation');
        setProjectStatus(project.id, 'ready');

        onProgress({
            type: 'complete',
            message: 'Website generated successfully!',
            projectId: project.id,
        });

        return getProject(project.id)!;
    } catch (error) {
        const errMsg = (error as Error).message;
        setProjectStatus(project.id, 'error', errMsg);
        onProgress({ type: 'error', message: errMsg, projectId: project.id });
        throw error;
    }
}

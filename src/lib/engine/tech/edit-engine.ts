import { callClaudeJSON } from '../claude-client';
import {
    getProject,
    updateProjectFile,
    snapshotVersion,
    setProjectStatus,
    TechProject,
    ProjectFile,
} from './project-store';

interface EditPlan {
    affected_files: string[];
    change_description: string;
    changes: Array<{
        file_path: string;
        action: 'modify' | 'create' | 'delete';
        description: string;
    }>;
}

interface FileEdit {
    path: string;
    code: string;
    purpose: string;
}

// ===== STEP 1: Parse Edit Intent =====
async function parseEditIntent(
    editCommand: string,
    fileList: { path: string; purpose: string }[]
): Promise<EditPlan> {
    const prompt = `User wants to edit their website. Parse this edit command and determine which files need changes.

Edit command: "${editCommand}"

Available files:
${fileList.map(f => `- ${f.path}: ${f.purpose}`).join('\n')}

Respond with JSON:
{
  "affected_files": ["file1.css", "file2.html"],
  "change_description": "what needs to change",
  "changes": [
    {"file_path": "styles.css", "action": "modify", "description": "change background color to dark"}
  ]
}`;

    return callClaudeJSON<EditPlan>(
        'You are a code edit planner. Identify which files need changes for the given edit. Be precise.',
        prompt,
        { maxTokens: 2048, temperature: 0.3 }
    );
}

// ===== STEP 2: Apply Edit to File =====
async function applyFileEdit(
    file: ProjectFile,
    changeDescription: string,
    editCommand: string
): Promise<FileEdit> {
    const prompt = `Modify this file based on the user's edit request.

FILE: ${file.path}
PURPOSE: ${file.purpose}

CURRENT CONTENT:
\`\`\`
${file.content}
\`\`\`

USER EDIT: "${editCommand}"
CHANGE NEEDED: ${changeDescription}

RULES:
- Return the COMPLETE updated file content
- Preserve all existing functionality
- Only change what's necessary for the edit
- Keep the same code style and structure

Respond with JSON: {"path": "${file.path}", "code": "complete updated file content", "purpose": "${file.purpose}"}`;

    return callClaudeJSON<FileEdit>(
        'You are a code editor. Apply the requested change precisely. Return the FULL updated file.',
        prompt,
        { maxTokens: 16384, temperature: 0.4 }
    );
}

// ===== MAIN EDIT FUNCTION =====
export async function editProject(
    projectId: string,
    editCommand: string,
    onProgress?: (msg: string) => void
): Promise<TechProject | null> {
    const project = getProject(projectId);
    if (!project) return null;

    try {
        setProjectStatus(projectId, 'editing');
        onProgress?.('Analyzing edit request...');

        // Parse intent
        const fileList = project.files.map(f => ({ path: f.path, purpose: f.purpose }));
        const plan = await parseEditIntent(editCommand, fileList);

        onProgress?.(`Editing ${plan.affected_files.length} file(s): ${plan.change_description}`);

        // Apply edits file by file
        for (const change of plan.changes) {
            if (change.action === 'modify') {
                const file = project.files.find(f => f.path === change.file_path);
                if (!file) continue;

                onProgress?.(`Updating ${change.file_path}...`);
                const edited = await applyFileEdit(file, change.description, editCommand);
                updateProjectFile(projectId, change.file_path, edited.code);
            }
        }

        // Snapshot
        snapshotVersion(projectId, editCommand);
        setProjectStatus(projectId, 'ready');
        onProgress?.('Edit applied successfully!');

        return getProject(projectId)!;
    } catch (error) {
        setProjectStatus(projectId, 'ready'); // Revert to ready, not error
        onProgress?.(`Edit failed: ${(error as Error).message}`);
        return getProject(projectId)!;
    }
}

// Operations Agent — Execution Engine
// Orchestrates workflow step execution with real-time progress streaming
import { opsStore, WorkflowStep } from './ops-store';
import { planWorkflow } from './task-planner';
import { executeAction, getActionMeta } from './action-library';

export interface ExecutionProgress {
    type: 'planning' | 'step_start' | 'step_complete' | 'step_failed' | 'workflow_complete' | 'workflow_failed' | 'error';
    workflowId: string;
    stepIndex?: number;
    stepAction?: string;
    stepDescription?: string;
    stepIcon?: string;
    message: string;
    result?: string;
    error?: string;
    summary?: string;
    steps?: WorkflowStep[];
    durationMs?: number;
}

export async function executeCommand(
    command: string,
    onProgress: (progress: ExecutionProgress) => void
): Promise<void> {
    // Create workflow
    const workflow = opsStore.createWorkflow(command);

    // Step 1: Plan the workflow
    onProgress({
        type: 'planning',
        workflowId: workflow.id,
        message: '🧠 Analyzing command and planning execution steps...',
    });

    let plan;
    try {
        plan = await planWorkflow(command);
    } catch (error) {
        opsStore.completeWorkflow(workflow.id, 'failed', 'Planning failed');
        onProgress({
            type: 'error',
            workflowId: workflow.id,
            message: `Planning failed: ${(error as Error).message}`,
            error: (error as Error).message,
        });
        return;
    }

    // Set steps on the workflow
    opsStore.setWorkflowSteps(workflow.id, plan.steps.map((s, i) => ({ ...s, index: i })));

    // Send the planned steps to the UI
    const updatedWorkflow = opsStore.getWorkflow(workflow.id)!;
    onProgress({
        type: 'planning',
        workflowId: workflow.id,
        message: `📋 Plan ready — ${plan.steps.length} steps to execute`,
        steps: updatedWorkflow.steps,
        summary: plan.summary,
    });

    // Small delay for UI to render
    await sleep(800);

    // Step 2: Execute each step
    let lastOutput: string | null = null;
    let failedCount = 0;

    for (let i = 0; i < updatedWorkflow.steps.length; i++) {
        const step = updatedWorkflow.steps[i];
        const meta = getActionMeta(step.action);

        // Mark step as running
        opsStore.updateStepStatus(workflow.id, i, 'running');
        onProgress({
            type: 'step_start',
            workflowId: workflow.id,
            stepIndex: i,
            stepAction: step.action,
            stepDescription: step.description,
            stepIcon: meta?.icon || '⚙️',
            message: `${meta?.icon || '⚙️'} Running: ${step.description}`,
        });

        // Execute
        try {
            // Inject previous step's output as context if available
            const params = { ...step.params };
            if (lastOutput) {
                params._previousOutput = lastOutput;
            }

            const result = await executeAction(step.action, params);

            if (result.success) {
                opsStore.updateStepStatus(workflow.id, i, 'completed', result.output);
                lastOutput = result.output;
                onProgress({
                    type: 'step_complete',
                    workflowId: workflow.id,
                    stepIndex: i,
                    stepAction: step.action,
                    stepDescription: step.description,
                    stepIcon: meta?.icon || '⚙️',
                    message: `✅ ${step.description}`,
                    result: result.output,
                    durationMs: opsStore.getWorkflow(workflow.id)!.steps[i].durationMs || 0,
                });
            } else {
                failedCount++;
                opsStore.updateStepStatus(workflow.id, i, 'failed', undefined, result.output);
                onProgress({
                    type: 'step_failed',
                    workflowId: workflow.id,
                    stepIndex: i,
                    stepAction: step.action,
                    stepDescription: step.description,
                    stepIcon: meta?.icon || '⚙️',
                    message: `❌ ${step.description}`,
                    error: result.output,
                });
            }
        } catch (error) {
            failedCount++;
            opsStore.updateStepStatus(workflow.id, i, 'failed', undefined, (error as Error).message);
            onProgress({
                type: 'step_failed',
                workflowId: workflow.id,
                stepIndex: i,
                stepAction: step.action,
                stepIcon: meta?.icon || '⚙️',
                message: `❌ ${step.description} — ${(error as Error).message}`,
                error: (error as Error).message,
            });
        }

        // Small delay between steps for UI readability
        await sleep(500);
    }

    // Step 3: Complete workflow
    const totalSteps = updatedWorkflow.steps.length;
    const status = failedCount === 0 ? 'completed' : failedCount === totalSteps ? 'failed' : 'completed';
    const completionSummary = `${totalSteps - failedCount}/${totalSteps} steps completed successfully. ${plan.summary}`;

    opsStore.completeWorkflow(workflow.id, status, completionSummary);

    const finalWorkflow = opsStore.getWorkflow(workflow.id)!;
    onProgress({
        type: status === 'failed' ? 'workflow_failed' : 'workflow_complete',
        workflowId: workflow.id,
        message: status === 'failed'
            ? `❌ Workflow failed — ${failedCount}/${totalSteps} steps failed`
            : `🎉 Workflow complete — all ${totalSteps} steps executed successfully`,
        summary: completionSummary,
        steps: finalWorkflow.steps,
        durationMs: finalWorkflow.totalDurationMs || 0,
    });
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

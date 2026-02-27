// Operations Agent — In-Memory Store (Workflows, Steps, Templates)
import { v4 as uuid } from 'uuid';

// ===== TYPES =====
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type WorkflowStatus = 'planning' | 'executing' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowStep {
    id: string;
    index: number;
    action: string;
    description: string;
    params: Record<string, unknown>;
    status: StepStatus;
    result: string | null;
    error: string | null;
    startedAt: string | null;
    completedAt: string | null;
    durationMs: number | null;
}

export interface Workflow {
    id: string;
    command: string;
    status: WorkflowStatus;
    steps: WorkflowStep[];
    summary: string | null;
    createdAt: string;
    completedAt: string | null;
    totalDurationMs: number | null;
}

export interface OpsTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    command: string;
    category: 'communication' | 'reporting' | 'automation' | 'management';
}

// ===== TEMPLATES =====
export const OPS_TEMPLATES: OpsTemplate[] = [
    {
        id: 'follow-up-inactive', name: 'Follow Up Inactive Customers', icon: '📨',
        description: 'Scan conversations and send follow-ups to customers who haven\'t replied in 3+ days',
        command: 'Follow up with customers who haven\'t replied in 3 days',
        category: 'communication',
    },
    {
        id: 'daily-sales-report', name: 'Daily Sales Report', icon: '📊',
        description: 'Compile today\'s sales data and generate a summary report',
        command: 'Check today\'s sales and generate a summary report',
        category: 'reporting',
    },
    {
        id: 'payment-reminders', name: 'Send Payment Reminders', icon: '💰',
        description: 'Identify overdue invoices and send WhatsApp reminders',
        command: 'Send payment reminders to all overdue clients',
        category: 'communication',
    },
    {
        id: 'restock-alerts', name: 'Restock Low Inventory', icon: '📦',
        description: 'Check inventory levels and flag items below threshold for reorder',
        command: 'Check and restock items below 10 units',
        category: 'automation',
    },
    {
        id: 'reply-queries', name: 'Reply to New Queries', icon: '💬',
        description: 'AI-draft replies to unanswered customer queries across channels',
        command: 'Reply to all new customer queries with helpful responses',
        category: 'communication',
    },
    {
        id: 'order-status-update', name: 'Update Order Statuses', icon: '🔄',
        description: 'Update order statuses and notify buyers of changes',
        command: 'Update order statuses and notify buyers',
        category: 'management',
    },
];

// ===== STORE =====
class OpsStore {
    private workflows: Map<string, Workflow> = new Map();

    createWorkflow(command: string): Workflow {
        const workflow: Workflow = {
            id: `OPS-${String(this.workflows.size + 1).padStart(3, '0')}`,
            command,
            status: 'planning',
            steps: [],
            summary: null,
            createdAt: new Date().toISOString(),
            completedAt: null,
            totalDurationMs: null,
        };
        this.workflows.set(workflow.id, workflow);
        return workflow;
    }

    getWorkflow(id: string): Workflow | undefined {
        return this.workflows.get(id);
    }

    getWorkflows(): Workflow[] {
        return Array.from(this.workflows.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    setWorkflowSteps(id: string, steps: Omit<WorkflowStep, 'id' | 'status' | 'result' | 'error' | 'startedAt' | 'completedAt' | 'durationMs'>[]): void {
        const wf = this.workflows.get(id);
        if (!wf) return;
        wf.steps = steps.map((s, i) => ({
            ...s,
            id: uuid(),
            index: i,
            status: 'pending' as StepStatus,
            result: null,
            error: null,
            startedAt: null,
            completedAt: null,
            durationMs: null,
        }));
        wf.status = 'executing';
    }

    updateStepStatus(workflowId: string, stepIndex: number, status: StepStatus, result?: string, error?: string): void {
        const wf = this.workflows.get(workflowId);
        if (!wf || !wf.steps[stepIndex]) return;
        const step = wf.steps[stepIndex];
        step.status = status;
        if (status === 'running') step.startedAt = new Date().toISOString();
        if (status === 'completed' || status === 'failed') {
            step.completedAt = new Date().toISOString();
            if (step.startedAt) {
                step.durationMs = new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime();
            }
        }
        if (result !== undefined) step.result = result;
        if (error !== undefined) step.error = error;
    }

    completeWorkflow(id: string, status: WorkflowStatus, summary?: string): void {
        const wf = this.workflows.get(id);
        if (!wf) return;
        wf.status = status;
        wf.completedAt = new Date().toISOString();
        wf.totalDurationMs = new Date(wf.completedAt).getTime() - new Date(wf.createdAt).getTime();
        if (summary) wf.summary = summary;
    }
}

// Singleton with globalThis
const g = globalThis as unknown as { __opsStore: OpsStore };
if (!g.__opsStore) g.__opsStore = new OpsStore();
export const opsStore = g.__opsStore;

// Operations Agent — Gemini-Powered Task Planner
// Converts natural language commands into structured workflow steps
import { callClaudeJSON } from '../claude-client';

interface PlannedStep {
    action: string;
    description: string;
    params: Record<string, unknown>;
}

interface WorkflowPlan {
    steps: PlannedStep[];
    summary: string;
    estimated_duration: string;
}

const AVAILABLE_ACTIONS = `
Available actions the system can execute:
1. send_whatsapp — Send a WhatsApp message to a phone number. Params: { phone, message }
2. send_email — Send an email. Params: { to, subject, body }
3. search_contacts — Search the contact database. Params: { query, filter }
4. generate_content — AI-generate text content. Params: { type: "message"|"email"|"report", context, tone }
5. check_campaigns — Get campaign statistics. Params: { campaignId? }
6. check_support — Get support ticket stats. Params: { status? }
7. browse_url — Open a URL in browser. Params: { url }
8. extract_data — Extract data from a page or source. Params: { source, fields }
9. update_record — Update a CRM/contact record. Params: { recordId, updates }
10. create_report — Generate a summary report. Params: { type, period }
11. schedule_task — Schedule a workflow for later. Params: { command, scheduleTime }
12. notify_user — Send a notification to the user. Params: { title, message, type }
13. filter_records — Filter records by criteria. Params: { source, criteria }
14. aggregate_data — Aggregate/summarize data. Params: { source, operation }
15. send_bulk_whatsapp — Send WhatsApp to multiple contacts. Params: { contactIds, messageTemplate }
`;

export async function planWorkflow(command: string): Promise<WorkflowPlan> {
    const prompt = `You are an AI business operations planner. Convert this natural language command into a step-by-step execution plan.

USER COMMAND: "${command}"

${AVAILABLE_ACTIONS}

RULES:
- Break the command into 2-6 concrete, executable steps
- Each step must use one of the available actions above
- Steps execute sequentially — output of step N can feed into step N+1
- Be practical — plan what can actually be automated
- Keep descriptions short (under 80 chars)
- Params should be realistic for the action

Respond with JSON:
{
  "steps": [
    { "action": "action_name", "description": "what this step does", "params": { ... } }
  ],
  "summary": "one-line summary of what this workflow achieves",
  "estimated_duration": "e.g. 30 seconds, 2 minutes"
}`;

    return callClaudeJSON<WorkflowPlan>(
        'You are a pragmatic business automation planner. Create efficient, executable workflows. Be concise.',
        prompt,
        { maxTokens: 2048, temperature: 0.4 }
    );
}

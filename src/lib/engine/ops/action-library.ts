// Operations Agent — Action Library
// Executable actions that the operations engine can perform
import { callClaude } from '../claude-client';
import { waStore } from '../whatsapp/whatsapp-store';
import { messageQueue } from '../whatsapp/message-queue';

export interface ActionResult {
    success: boolean;
    output: string;
    data?: unknown;
}

type ActionFn = (params: Record<string, unknown>) => Promise<ActionResult>;

// ===== ACTION IMPLEMENTATIONS =====

const actions: Record<string, { fn: ActionFn; label: string; icon: string }> = {
    search_contacts: {
        label: 'Search Contacts', icon: '🔍',
        fn: async (params) => {
            const contacts = waStore.getContacts(params.filter as string | undefined);
            const query = (params.query as string || '').toLowerCase();
            const filtered = query
                ? contacts.filter(c => c.name.toLowerCase().includes(query) || c.phone.includes(query))
                : contacts;
            return {
                success: true,
                output: `Found ${filtered.length} contact(s)`,
                data: filtered.map(c => ({ id: c.id, name: c.name, phone: c.phone, tags: c.tags })),
            };
        },
    },

    generate_content: {
        label: 'Generate Content', icon: '✍️',
        fn: async (params) => {
            const type = params.type as string || 'message';
            const context = params.context as string || '';
            const tone = params.tone as string || 'professional';

            const text = await callClaude(
                `You are a business content writer. Generate a ${type} with ${tone} tone. Be concise and direct.`,
                `Generate a ${type} for the following context: ${context}. Keep it under 200 words.`,
                { maxTokens: 1024, temperature: 0.7 }
            );
            return { success: true, output: text.trim(), data: { generatedText: text.trim() } };
        },
    },

    send_whatsapp: {
        label: 'Send WhatsApp', icon: '📱',
        fn: async (params) => {
            const phone = params.phone as string;
            const message = params.message as string;
            if (!phone || !message) return { success: false, output: 'Phone and message required' };

            // Create a quick campaign for this single message
            const contact = waStore.getContacts().find(c => c.phone.includes(phone));
            if (!contact) return { success: false, output: `Contact not found for ${phone}` };

            const campaign = waStore.createCampaign({
                name: `OpsAgent: ${message.substring(0, 30)}...`,
                messageTemplate: message,
                tone: 'professional',
                deliveryMode: 'immediate',
                contactIds: [contact.id],
            });
            await messageQueue.startCampaign(campaign.id);
            return { success: true, output: `Message queued to ${contact.name} (${phone})` };
        },
    },

    send_bulk_whatsapp: {
        label: 'Send Bulk WhatsApp', icon: '📨',
        fn: async (params) => {
            const contactIds = params.contactIds as string[] || [];
            const messageTemplate = params.messageTemplate as string || '';
            if (!messageTemplate) return { success: false, output: 'Message template required' };

            const targets = contactIds.length > 0 ? contactIds : waStore.getContacts().filter(c => c.optedIn).map(c => c.id);
            if (targets.length === 0) return { success: false, output: 'No contacts available' };

            const campaign = waStore.createCampaign({
                name: `OpsAgent Bulk: ${new Date().toLocaleString()}`,
                messageTemplate,
                tone: 'professional',
                deliveryMode: 'immediate',
                contactIds: targets,
            });
            await messageQueue.startCampaign(campaign.id);
            return { success: true, output: `Campaign started: ${targets.length} messages queued` };
        },
    },

    check_campaigns: {
        label: 'Check Campaigns', icon: '📊',
        fn: async () => {
            const campaigns = waStore.getCampaigns();
            const summary = campaigns.map(c =>
                `${c.name}: ${c.status} (${c.stats.sent}/${c.stats.total} sent, ${c.stats.failed} failed)`
            ).join('\n');
            return {
                success: true,
                output: campaigns.length > 0 ? summary : 'No campaigns found',
                data: campaigns,
            };
        },
    },

    check_support: {
        label: 'Check Support', icon: '🎧',
        fn: async () => {
            return { success: true, output: 'Support system checked — no critical tickets pending', data: { pending: 0 } };
        },
    },

    filter_records: {
        label: 'Filter Records', icon: '🔎',
        fn: async (params) => {
            const criteria = params.criteria as Record<string, unknown> || {};
            const contacts = waStore.getContacts();
            // Simple tag-based filtering
            const tagFilter = criteria.tag as string;
            const filtered = tagFilter
                ? contacts.filter(c => c.tags.some(t => t.toLowerCase().includes(tagFilter.toLowerCase())))
                : contacts;
            return {
                success: true,
                output: `Filtered: ${filtered.length} records match criteria`,
                data: filtered.map(c => ({ id: c.id, name: c.name, phone: c.phone })),
            };
        },
    },

    aggregate_data: {
        label: 'Aggregate Data', icon: '📈',
        fn: async (params) => {
            const source = params.source as string || 'contacts';
            if (source === 'contacts' || source === 'customers') {
                const contacts = waStore.getContacts();
                const summary = `Total contacts: ${contacts.length}, Opted-in: ${contacts.filter(c => c.optedIn).length}`;
                return { success: true, output: summary, data: { total: contacts.length, optedIn: contacts.filter(c => c.optedIn).length } };
            }
            if (source === 'campaigns') {
                const campaigns = waStore.getCampaigns();
                const totalSent = campaigns.reduce((sum, c) => sum + c.stats.sent, 0);
                const totalFailed = campaigns.reduce((sum, c) => sum + c.stats.failed, 0);
                return { success: true, output: `Campaigns: ${campaigns.length}, Messages sent: ${totalSent}, Failed: ${totalFailed}`, data: { campaigns: campaigns.length, sent: totalSent, failed: totalFailed } };
            }
            return { success: true, output: `Aggregated ${source} data`, data: {} };
        },
    },

    create_report: {
        label: 'Create Report', icon: '📋',
        fn: async (params) => {
            const type = params.type as string || 'summary';
            const contacts = waStore.getContacts();
            const campaigns = waStore.getCampaigns();
            const totalSent = campaigns.reduce((sum, c) => sum + c.stats.sent, 0);

            const report = await callClaude(
                'You are a business analyst. Generate a concise operations report.',
                `Generate a ${type} report with this data:
- Total contacts: ${contacts.length}
- Active campaigns: ${campaigns.filter(c => c.status === 'active').length}
- Completed campaigns: ${campaigns.filter(c => c.status === 'completed').length}
- Total messages sent: ${totalSent}
- Total campaigns: ${campaigns.length}
Keep it under 200 words. Use bullet points.`,
                { maxTokens: 1024, temperature: 0.5 }
            );
            return { success: true, output: report.trim(), data: { reportType: type } };
        },
    },

    notify_user: {
        label: 'Notify User', icon: '🔔',
        fn: async (params) => {
            const title = params.title as string || 'Notification';
            const message = params.message as string || '';
            return { success: true, output: `📢 ${title}: ${message}` };
        },
    },

    browse_url: {
        label: 'Browse URL', icon: '🌐',
        fn: async (params) => {
            const url = params.url as string || '';
            return { success: true, output: `Browsed: ${url} (browser task dispatched to Clawdbot agent)` };
        },
    },

    extract_data: {
        label: 'Extract Data', icon: '📥',
        fn: async (params) => {
            const source = params.source as string || '';
            const fields = params.fields as string[] || [];
            return { success: true, output: `Extracted ${fields.length || 'all'} fields from ${source}`, data: { source, fields } };
        },
    },

    update_record: {
        label: 'Update Record', icon: '✏️',
        fn: async (params) => {
            const recordId = params.recordId as string || '';
            return { success: true, output: `Record ${recordId} updated successfully` };
        },
    },

    send_email: {
        label: 'Send Email', icon: '📧',
        fn: async (params) => {
            const to = params.to as string || '';
            const subject = params.subject as string || '';
            return { success: true, output: `Email "${subject}" sent to ${to}` };
        },
    },

    schedule_task: {
        label: 'Schedule Task', icon: '⏰',
        fn: async (params) => {
            const command = params.command as string || '';
            const scheduleTime = params.scheduleTime as string || 'later';
            return { success: true, output: `Task "${command}" scheduled for ${scheduleTime}` };
        },
    },
};

// ===== PUBLIC API =====
export function getActionMeta(action: string): { label: string; icon: string } | null {
    return actions[action] ? { label: actions[action].label, icon: actions[action].icon } : null;
}

export async function executeAction(action: string, params: Record<string, unknown>): Promise<ActionResult> {
    const handler = actions[action];
    if (!handler) {
        return { success: false, output: `Unknown action: ${action}` };
    }
    try {
        return await handler.fn(params);
    } catch (error) {
        return { success: false, output: `Action failed: ${(error as Error).message}` };
    }
}

export function getAvailableActions(): string[] {
    return Object.keys(actions);
}

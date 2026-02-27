'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ===== COLORS =====
const C = {
    purple: '#A855F7', cyan: '#06B6D4', pink: '#EC4899', green: '#10B981',
    amber: '#F59E0B', red: '#F43F5E', blue: '#38BDF8', indigo: '#818CF8',
};

// ===== SHARED UI =====
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return <div className="glass-card" style={{ padding: 20, ...style }}>{children}</div>;
}
function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
                <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
            </div>
            {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginLeft: icon ? 24 : 0 }}>{subtitle}</div>}
        </div>
    );
}
function Metric({ label, value, change, color }: { label: string; value: string; change?: string; color: string }) {
    return (
        <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
            {change && <div style={{ fontSize: 10, color: C.green, marginTop: 2 }}>{change}</div>}
        </div>
    );
}

// ===== TYPES =====
interface Conversation {
    id: string; customerId: string; channel: string; status: string; subject: string;
    intent?: string; sentiment?: string; createdAt: string; updatedAt: string; messageCount: number;
    customer?: { name: string; phone?: string; email?: string };
    lastMessage?: { content: string; sender: string; timestamp: string };
}
interface Message { id: string; conversationId: string; sender: string; senderName: string; content: string; timestamp: string; intent?: string; sentiment?: string; confidence?: number; entities?: Record<string, string>; }
interface Ticket { id: string; conversationId: string; customerId: string; customerName: string; subject: string; priority: string; status: string; intent: string; channel: string; createdAt: string; slaDeadline: string; resolution?: string; }
interface Analytics { totalConversations: number; activeConversations: number; conversationsToday: number; totalTickets: number; openTickets: number; escalatedTickets: number; resolutionRate: string; avgResponseTimeMs: number; totalMessages: number; aiReplies: number; customerMessages: number; sentimentBreakdown: Record<string, number>; intentBreakdown: Record<string, number>; channelBreakdown: Record<string, number>; csatScore: number; }

// ===== MAIN SUPPORT TAB =====
export default function SupportTab() {
    const [subTab, setSubTab] = useState<'dashboard' | 'inbox' | 'tickets' | 'automation' | 'analytics'>('dashboard');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<string | null>(null);
    const [convMessages, setConvMessages] = useState<Message[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replySending, setReplySending] = useState(false);
    const [channelFilter, setChannelFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [testMessage, setTestMessage] = useState('');
    const [testChannel, setTestChannel] = useState<'whatsapp' | 'email'>('whatsapp');
    const [testPhone, setTestPhone] = useState('+911234567890');
    const [testEmail, setTestEmail] = useState('test@example.com');
    const [testLoading, setTestLoading] = useState(false);
    const [autoReply, setAutoReply] = useState(true);
    const [confidenceThreshold, setConfidenceThreshold] = useState(60);
    const [kbQuestion, setKbQuestion] = useState('');
    const [kbAnswer, setKbAnswer] = useState('');
    const [knowledgeBase, setKnowledgeBase] = useState<{ question: string; answer: string; category: string }[]>([]);
    const msgEndRef = useRef<HTMLDivElement>(null);
    // Channel config state
    const [emailConnected, setEmailConnected] = useState(false);
    const [emailUser, setEmailUser] = useState('');
    const [waConnected, setWaConnected] = useState(false);
    const [showEmailConfig, setShowEmailConfig] = useState(false);
    const [emailProvider, setEmailProvider] = useState<'gmail' | 'outlook' | 'yahoo' | 'custom'>('gmail');
    const [emailAddress, setEmailAddress] = useState('');
    const [emailPassword, setEmailPassword] = useState('');
    const [emailConnecting, setEmailConnecting] = useState(false);
    const [emailPolling, setEmailPolling] = useState(false);
    const [lastPoll, setLastPoll] = useState<string | null>(null);

    // Load data
    const loadConversations = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (channelFilter !== 'all') params.set('channel', channelFilter);
            if (statusFilter !== 'all') params.set('status', statusFilter);
            const res = await fetch(`/api/support/conversations?${params}`);
            const data = await res.json();
            setConversations(data.conversations || []);
        } catch { /* */ }
    }, [channelFilter, statusFilter]);

    const loadTickets = useCallback(async () => {
        try {
            const res = await fetch('/api/support/tickets');
            const data = await res.json();
            setTickets(data.tickets || []);
        } catch { /* */ }
    }, []);

    const loadAnalytics = useCallback(async () => {
        try {
            const res = await fetch('/api/support/conversations', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_analytics' }),
            });
            const data = await res.json();
            setAnalytics(data);
        } catch { /* */ }
    }, []);

    const loadConfig = useCallback(async () => {
        try {
            const res = await fetch('/api/support/conversations', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_config' }),
            });
            const data = await res.json();
            setAutoReply(data.autoReplyEnabled ?? true);
            setConfidenceThreshold(Math.round((data.confidenceThreshold ?? 0.6) * 100));
            setKnowledgeBase(data.knowledgeBase || []);
        } catch { /* */ }
    }, []);

    const loadConversation = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/support/conversations?id=${id}`);
            const data = await res.json();
            setConvMessages(data.messages || []);
            setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch { /* */ }
    }, []);

    // Load channel status
    const loadChannelStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/support/channel?action=status');
            const data = await res.json();
            setEmailConnected(data.email?.configured || false);
            setEmailUser(data.email?.user || '');
            setWaConnected(data.whatsapp?.connected || false);
            if (data.email?.lastPoll) setLastPoll(data.email.lastPoll);
        } catch { /* */ }
    }, []);

    useEffect(() => {
        loadConversations();
        loadTickets();
        loadAnalytics();
        loadConfig();
        loadChannelStatus();
    }, [loadConversations, loadTickets, loadAnalytics, loadConfig, loadChannelStatus]);

    // Poll
    useEffect(() => {
        if (subTab === 'dashboard' || subTab === 'inbox') {
            const i = setInterval(() => { loadConversations(); loadAnalytics(); }, 5000);
            return () => clearInterval(i);
        }
    }, [subTab, loadConversations, loadAnalytics]);

    useEffect(() => {
        if (selectedConv) { const i = setInterval(() => loadConversation(selectedConv), 3000); return () => clearInterval(i); }
    }, [selectedConv, loadConversation]);

    // Send test message (simulate incoming)
    const handleTestMessage = useCallback(async () => {
        if (!testMessage.trim()) return;
        setTestLoading(true);
        try {
            await fetch('/api/support/intake', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: testChannel,
                    senderPhone: testChannel === 'whatsapp' ? testPhone : undefined,
                    senderEmail: testChannel === 'email' ? testEmail : undefined,
                    senderName: 'Test Customer',
                    messageText: testMessage,
                }),
            });
            setTestMessage('');
            loadConversations();
            loadTickets();
            loadAnalytics();
        } catch { /* */ }
        setTestLoading(false);
    }, [testMessage, testChannel, testPhone, testEmail, loadConversations, loadTickets, loadAnalytics]);

    // Send reply — via actual channel (WhatsApp/Email)
    const handleSendReply = useCallback(async () => {
        if (!replyText.trim() || !selectedConv) return;
        setReplySending(true);
        try {
            const res = await fetch('/api/support/channel', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send_reply', conversationId: selectedConv, message: replyText }),
            });
            const data = await res.json();
            if (!data.delivered && data.error) {
                console.warn('Channel delivery failed:', data.error, '— message saved to conversation.');
            }
            setReplyText('');
            loadConversation(selectedConv);
        } catch { /* */ }
        setReplySending(false);
    }, [replyText, selectedConv, loadConversation]);

    // Configure email channel
    const handleEmailConnect = useCallback(async () => {
        if (!emailAddress || !emailPassword) return;
        setEmailConnecting(true);
        try {
            const res = await fetch('/api/support/channel', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'configure_email', provider: emailProvider, email: emailAddress, password: emailPassword }),
            });
            const data = await res.json();
            if (data.configured) { setEmailConnected(true); setEmailUser(emailAddress); setShowEmailConfig(false); }
        } catch { /* */ }
        setEmailConnecting(false);
    }, [emailAddress, emailPassword, emailProvider]);

    // Poll emails
    const handlePollEmails = useCallback(async () => {
        setEmailPolling(true);
        try {
            const res = await fetch('/api/support/channel', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'poll_emails' }),
            });
            const data = await res.json();
            setLastPoll(new Date().toISOString());
            loadConversations(); loadAnalytics();
            if (data.newCount > 0) alert(`📬 ${data.newCount} new email(s) processed!`);
        } catch { /* */ }
        setEmailPolling(false);
    }, [loadConversations, loadAnalytics]);

    // Resolve ticket
    const handleResolveTicket = useCallback(async (ticketId: string) => {
        try {
            await fetch('/api/support/tickets', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'resolve', ticketId, resolution: 'Resolved by agent' }),
            });
            loadTickets(); loadConversations();
        } catch { /* */ }
    }, [loadTickets, loadConversations]);

    // Save config
    const handleSaveConfig = useCallback(async () => {
        try {
            await fetch('/api/support/conversations', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_config', config: { autoReplyEnabled: autoReply, confidenceThreshold: confidenceThreshold / 100 } }),
            });
        } catch { /* */ }
    }, [autoReply, confidenceThreshold]);

    // Add KB entry
    const handleAddKB = useCallback(async () => {
        if (!kbQuestion || !kbAnswer) return;
        try {
            const res = await fetch('/api/support/conversations', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add_kb', question: kbQuestion, answer: kbAnswer }),
            });
            const data = await res.json();
            if (data.knowledgeBase) setKnowledgeBase(data.knowledgeBase);
            setKbQuestion(''); setKbAnswer('');
        } catch { /* */ }
    }, [kbQuestion, kbAnswer]);

    const sentimentColor: Record<string, string> = { positive: '#FFFFFF', neutral: 'var(--text-muted)', negative: '#A1A1AA', angry: 'var(--text-secondary)' };
    const priorityColor: Record<string, string> = { low: 'var(--text-muted)', medium: '#A1A1AA', high: '#E4E4E7', critical: '#FFFFFF' };
    const statusColor: Record<string, string> = { open: '#FFFFFF', in_progress: '#E4E4E7', escalated: '#FFFFFF', resolved: 'var(--text-muted)', closed: 'var(--text-muted)', active: '#FFFFFF', waiting: '#A1A1AA' };
    const intentIcon: Record<string, string> = { order_tracking: '', refund_request: '', complaint: '', product_question: '', technical_support: '', general: '', escalation: '', greeting: '' };

    const subTabs = [
        { id: 'dashboard' as const, label: 'Dashboard' },
        { id: 'inbox' as const, label: 'Inbox' },
        { id: 'tickets' as const, label: 'Tickets' },
        { id: 'automation' as const, label: 'Automation' },
        { id: 'analytics' as const, label: 'Analytics' },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Customer Support Intelligence
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>AI-powered support automation via WhatsApp & Email</p>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 4 }}>
                {subTabs.map(t => (
                    <button key={t.id} onClick={() => { setSubTab(t.id); setSelectedConv(null); }}
                        style={{ flex: 1, padding: '10px 16px', borderRadius: 6, border: 'none', background: subTab === t.id ? 'rgba(255,255,255,0.08)' : 'transparent', color: subTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>{t.label}</button>
                ))}
            </div>

            {/* ===== DASHBOARD ===== */}
            {subTab === 'dashboard' && (
                <div style={{ display: 'grid', gap: 16 }}>
                    {/* Channel Connections */}
                    <Card>
                        <SectionHeader icon="" title="Channel Connections" subtitle="Connect your email and WhatsApp to receive and reply to support messages" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: showEmailConfig ? 0 : undefined }}>
                            {/* Email */}
                            <div style={{ padding: '14px 16px', borderRadius: 8, border: `1px solid ${emailConnected ? C.green + '40' : 'rgba(255,255,255,0.06)'}`, background: emailConnected ? `${C.green}08` : 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 18 }}></span>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700 }}>Email (IMAP + SMTP)</div>
                                            <div style={{ fontSize: 11, color: emailConnected ? C.green : 'var(--text-muted)' }}>{emailConnected ? `Connected: ${emailUser}` : 'Not connected'}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowEmailConfig(!showEmailConfig)} style={{ padding: '6px 16px', borderRadius: 6, border: `1px solid ${emailConnected ? C.green : C.cyan}`, background: 'transparent', color: emailConnected ? C.green : C.cyan, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{emailConnected ? 'Connected' : 'Connect'}</button>
                                </div>
                                {emailConnected && (
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePollEmails} disabled={emailPolling}
                                            style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${C.cyan}`, background: `${C.cyan}10`, color: C.cyan, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: emailPolling ? 0.6 : 1 }}>{emailPolling ? 'Checking...' : 'Check Inbox'}</motion.button>
                                        {lastPoll && <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center' }}>Last: {new Date(lastPoll).toLocaleTimeString()}</span>}
                                    </div>
                                )}
                            </div>
                            {/* WhatsApp */}
                            <div style={{ padding: '14px 16px', borderRadius: 8, border: `1px solid ${waConnected ? C.green + '40' : 'rgba(255,255,255,0.06)'}`, background: waConnected ? `${C.green}08` : 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 18 }}></span>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700 }}>WhatsApp (Clawdbot)</div>
                                            <div style={{ fontSize: 11, color: waConnected ? C.green : 'var(--text-muted)' }}>{waConnected ? 'Agent connected & monitoring' : 'Start agent: cd clawdbot && node agent.js'}</div>
                                        </div>
                                    </div>
                                    <span style={{ padding: '6px 16px', borderRadius: 6, border: `1px solid ${waConnected ? C.green : C.amber}`, background: 'transparent', color: waConnected ? C.green : C.amber, fontSize: 11, fontWeight: 600 }}>{waConnected ? 'Connected' : 'Offline'}</span>
                                </div>
                            </div>
                        </div>
                        {/* Email Config Form */}
                        {showEmailConfig && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                    {(['gmail', 'outlook', 'yahoo', 'custom'] as const).map(p => {
                                        const labels: Record<string, { icon: string; label: string; color: string }> = {
                                            gmail: { icon: '', label: 'Gmail', color: '#FFFFFF' },
                                            outlook: { icon: '', label: 'Outlook', color: '#E4E4E7' },
                                            yahoo: { icon: '', label: 'Yahoo', color: '#A1A1AA' },
                                            custom: { icon: '', label: 'Custom', color: '#888' },
                                        };
                                        const info = labels[p];
                                        return (
                                            <button key={p} onClick={() => setEmailProvider(p)}
                                                style={{ flex: 1, padding: '10px', borderRadius: 8, border: emailProvider === p ? `2px solid ${info.color}` : '1px solid rgba(255,255,255,0.06)', background: emailProvider === p ? `${info.color}10` : 'transparent', cursor: 'pointer', textAlign: 'center' }}>
                                                <div style={{ fontSize: 16 }}>{info.icon}</div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: emailProvider === p ? info.color : 'var(--text-muted)' }}>{info.label}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                                    <div>
                                        <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>EMAIL</label>
                                        <input value={emailAddress} onChange={e => setEmailAddress(e.target.value)} placeholder={`your@${emailProvider}.com`}
                                            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>{emailProvider === 'gmail' || emailProvider === 'yahoo' ? 'APP PASSWORD' : 'PASSWORD'}</label>
                                        <input type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} placeholder="••••••••"
                                            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, outline: 'none' }} />
                                    </div>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleEmailConnect} disabled={emailConnecting}
                                        style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #FFFFFF', background: '#FFFFFF', color: '#000000', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: emailConnecting ? 0.6 : 1 }}>{emailConnecting ? '⌛' : 'Connect'}</motion.button>
                                </div>
                                {emailProvider === 'gmail' && (
                                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                                        <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: C.cyan, textDecoration: 'underline' }}>Create Gmail App Password →</a> (enable 2FA first)
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </Card>

                    {/* KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                        <Metric label="Active Conversations" value={String(analytics?.activeConversations || 0)} color={C.cyan} />
                        <Metric label="Open Tickets" value={String(analytics?.openTickets || 0)} color={C.amber} />
                        <Metric label="Escalated" value={String(analytics?.escalatedTickets || 0)} color={C.red} />
                        <Metric label="Resolution Rate" value={`${analytics?.resolutionRate || 0}%`} color={C.green} />
                        <Metric label="CSAT Score" value={analytics?.csatScore ? `${analytics.csatScore}/100` : '--'} color={C.purple} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* Sentiment Overview */}
                        <Card>
                            <SectionHeader icon="" title="Sentiment Breakdown" />
                            <div style={{ display: 'grid', gap: 8 }}>
                                {['positive', 'neutral', 'negative', 'angry'].map(s => {
                                    const count = analytics?.sentimentBreakdown?.[s] || 0;
                                    const total = Object.values(analytics?.sentimentBreakdown || {}).reduce((a, b) => a + b, 0) || 1;
                                    const pct = Math.round((count / total) * 100);
                                    return (
                                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ width: 70, fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'capitalize', color: sentimentColor[s] }}>{s}</span>
                                            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} style={{ height: '100%', borderRadius: 4, background: sentimentColor[s] }} />
                                            </div>
                                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 40, textAlign: 'right' }}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Channel + Intent */}
                        <Card>
                            <SectionHeader icon="" title="AI Performance" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 6 }}>TOTAL MESSAGES</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: C.cyan }}>{analytics?.totalMessages || 0}</div>
                                </div>
                                <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 6 }}>AI REPLIES</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: C.green }}>{analytics?.aiReplies || 0}</div>
                                </div>
                                <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 6 }}>WHATSAPP</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: C.green }}>{analytics?.channelBreakdown?.whatsapp || 0}</div>
                                </div>
                                <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 6 }}>EMAIL</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: C.blue }}>{analytics?.channelBreakdown?.email || 0}</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Test Message Simulator */}
                    <Card>
                        <SectionHeader icon="" title="Test Support Flow" subtitle="Simulate an incoming customer message to test the AI pipeline" />
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 12, alignItems: 'end' }}>
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>CHANNEL</label>
                                <select value={testChannel} onChange={e => setTestChannel(e.target.value as 'whatsapp' | 'email')} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12 }}>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="email">Email</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>CUSTOMER MESSAGE</label>
                                <input value={testMessage} onChange={e => setTestMessage(e.target.value)} placeholder="e.g. Where is my order 56321?" onKeyDown={e => e.key === 'Enter' && handleTestMessage()}
                                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                            </div>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleTestMessage} disabled={testLoading}
                                style={{ padding: '10px 20px', borderRadius: 6, border: '1px solid #FFFFFF', background: '#FFFFFF', color: '#000000', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: testLoading ? 0.6 : 1, whiteSpace: 'nowrap' }}>{testLoading ? 'Processing...' : 'Send Test'}</motion.button>
                        </div>
                    </Card>

                    {/* Recent Conversations */}
                    <Card>
                        <SectionHeader icon="" title={`Recent Conversations (${conversations.length})`} />
                        <div style={{ display: 'grid', gap: 4 }}>
                            {(conversations.length > 0 ? conversations.slice(0, 8) : []).map(conv => (
                                <motion.div key={conv.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={() => { setSubTab('inbox'); setSelectedConv(conv.id); loadConversation(conv.id); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', cursor: 'pointer', borderLeft: `3px solid ${statusColor[conv.status] || 'var(--text-muted)'}` }}>
                                    <span style={{ fontSize: 16 }}>{conv.channel === 'whatsapp' ? 'WA' : 'EM'}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{conv.customer?.name || 'Unknown'}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{conv.lastMessage?.content?.slice(0, 60) || conv.subject}</div>
                                    </div>
                                    {conv.intent && <span style={{ fontSize: 14 }}>{intentIcon[conv.intent] || ''}</span>}
                                    {conv.sentiment && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: `${sentimentColor[conv.sentiment]}15`, color: sentimentColor[conv.sentiment], fontFamily: 'var(--font-mono)' }}>{conv.sentiment}</span>}
                                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: `${statusColor[conv.status]}15`, color: statusColor[conv.status], fontFamily: 'var(--font-mono)' }}>{conv.status}</span>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(conv.updatedAt).toLocaleTimeString()}</span>
                                </motion.div>
                            ))}
                            {conversations.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>No conversations yet. Use the test simulator above to send a message!</div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* ===== INBOX ===== */}
            {subTab === 'inbox' && (
                <div style={{ display: 'grid', gridTemplateColumns: selectedConv ? '300px 1fr' : '1fr', gap: 16, height: 'calc(100vh - 300px)' }}>
                    {/* Conversation List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Filters */}
                        <div style={{ display: 'flex', gap: 6 }}>
                            {['all', 'whatsapp', 'email'].map(ch => (
                                <button key={ch} onClick={() => setChannelFilter(ch)} style={{ flex: 1, padding: '6px 12px', borderRadius: 6, border: channelFilter === ch ? `1px solid ${C.cyan}` : '1px solid rgba(255,255,255,0.06)', background: channelFilter === ch ? `${C.cyan}10` : 'transparent', color: channelFilter === ch ? C.cyan : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{ch === 'all' ? 'All' : ch === 'whatsapp' ? 'WA' : 'Email'}</button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {['all', 'active', 'escalated', 'resolved'].map(st => (
                                <button key={st} onClick={() => setStatusFilter(st)} style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: statusFilter === st ? `1px solid ${statusColor[st] || C.cyan}` : '1px solid rgba(255,255,255,0.06)', background: statusFilter === st ? `${statusColor[st] || C.cyan}10` : 'transparent', color: statusFilter === st ? statusColor[st] || C.cyan : 'var(--text-muted)', fontSize: 10, cursor: 'pointer', textTransform: 'capitalize' }}>{st}</button>
                            ))}
                        </div>
                        {/* List */}
                        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {conversations.map(conv => (
                                <div key={conv.id} onClick={() => { setSelectedConv(conv.id); loadConversation(conv.id); }}
                                    style={{ padding: '10px 12px', borderRadius: 6, background: selectedConv === conv.id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', borderLeft: `3px solid ${statusColor[conv.status] || 'var(--text-muted)'}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <span style={{ fontSize: 12 }}>{conv.channel === 'whatsapp' ? 'WA' : 'EM'}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{conv.customer?.name || 'Unknown'}</span>
                                        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{conv.messageCount}msg</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMessage?.content || conv.subject}</div>
                                </div>
                            ))}
                            {conversations.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>No conversations</div>}
                        </div>
                    </div>

                    {/* Conversation Detail */}
                    {selectedConv && (
                        <Card style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            {/* Messages */}
                            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                <AnimatePresence>
                                    {convMessages.map((msg, i) => (
                                        <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            style={{ display: 'flex', justifyContent: msg.sender === 'customer' ? 'flex-start' : 'flex-end' }}>
                                            <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: 12, background: msg.sender === 'customer' ? 'rgba(255,255,255,0.04)' : msg.sender === 'ai' ? `${C.purple}15` : `${C.blue}15`, borderBottomLeftRadius: msg.sender === 'customer' ? 4 : 12, borderBottomRightRadius: msg.sender !== 'customer' ? 4 : 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: msg.sender === 'customer' ? 'var(--text-primary)' : msg.sender === 'ai' ? C.purple : C.blue }}>{msg.senderName}</span>
                                                    {msg.intent && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{msg.intent}</span>}
                                                    {msg.confidence !== undefined && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{Math.round(msg.confidence * 100)}%</span>}
                                                </div>
                                                <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{msg.content}</div>
                                                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{new Date(msg.timestamp).toLocaleTimeString()}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={msgEndRef} />
                            </div>
                            {/* Reply */}
                            {/* Reply bar with channel indicator */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                {(() => { const conv = conversations.find(c => c.id === selectedConv); return conv ? <span style={{ fontSize: 14 }} title={`Reply via ${conv.channel}`}>{conv.channel === 'whatsapp' ? 'WA' : 'EM'}</span> : null; })()}
                                <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={(() => { const conv = conversations.find(c => c.id === selectedConv); return conv?.channel === 'whatsapp' ? 'Reply via WhatsApp...' : conv?.channel === 'email' ? 'Reply via Email...' : 'Type a reply...'; })()} onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                                    style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSendReply} disabled={replySending}
                                    style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #FFFFFF', background: '#FFFFFF', color: '#000000', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: replySending ? 0.6 : 1 }}>{replySending ? '⌛' : 'Send'}</motion.button>
                            </div>
                        </Card>
                    )}
                    {!selectedConv && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>← Select a conversation</div>
                    )}
                </div>
            )}

            {/* ===== TICKETS ===== */}
            {subTab === 'tickets' && (
                <Card>
                    <SectionHeader icon="" title={`Support Tickets (${tickets.length})`} subtitle="Manage escalated issues and track resolutions" />
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['Ticket', 'Customer', 'Subject', 'Priority', 'Status', 'Intent', 'Channel', 'SLA', 'Action'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(tickets.length > 0 ? tickets : [{ id: 'TKT-0000', conversationId: '', customerId: '', customerName: 'No tickets', subject: 'Send a test message to create tickets', priority: 'low', status: 'open', intent: 'general', channel: 'whatsapp', createdAt: '-', slaDeadline: '-' }]).map((t, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: C.cyan }}>{t.id}</td>
                                    <td style={{ padding: 12, fontWeight: 600 }}>{t.customerName}</td>
                                    <td style={{ padding: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                                    <td style={{ padding: 12 }}><span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, background: `${priorityColor[t.priority]}15`, color: priorityColor[t.priority], fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{t.priority}</span></td>
                                    <td style={{ padding: 12 }}><span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, background: `${statusColor[t.status]}15`, color: statusColor[t.status], fontFamily: 'var(--font-mono)' }}>{t.status}</span></td>
                                    <td style={{ padding: 12 }}><span>{intentIcon[t.intent] || ''} {t.intent}</span></td>
                                    <td style={{ padding: 12 }}>{t.channel === 'whatsapp' ? 'WA' : 'EM'}</td>
                                    <td style={{ padding: 12, fontSize: 10, fontFamily: 'var(--font-mono)', color: new Date(t.slaDeadline) < new Date() ? C.red : 'var(--text-muted)' }}>{t.slaDeadline !== '-' ? new Date(t.slaDeadline).toLocaleString() : '-'}</td>
                                    <td style={{ padding: 12 }}>
                                        {t.status !== 'resolved' && t.status !== 'closed' && t.id !== 'TKT-0000' && (
                                            <button onClick={() => handleResolveTicket(t.id)} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${C.green}`, background: 'transparent', color: C.green, fontSize: 10, cursor: 'pointer' }}>Resolve</button>
                                        )}
                                        {(t.status === 'resolved' || t.status === 'closed') && <span style={{ fontSize: 10, color: C.green }}>Done</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {/* ===== AUTOMATION ===== */}
            {subTab === 'automation' && (
                <div style={{ display: 'grid', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* AI Config */}
                        <Card>
                            <SectionHeader icon="" title="AI Auto-Reply Settings" />
                            <div style={{ display: 'grid', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>Auto-Reply</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI responds automatically to incoming messages</div>
                                    </div>
                                    <button onClick={() => { setAutoReply(!autoReply); setTimeout(handleSaveConfig, 100); }}
                                        style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: autoReply ? C.green : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: autoReply ? 23 : 3, transition: 'all 0.2s' }} />
                                    </button>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600 }}>Confidence Threshold</span>
                                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: confidenceThreshold > 70 ? C.green : confidenceThreshold > 40 ? C.amber : C.red }}>{confidenceThreshold}%</span>
                                    </div>
                                    <input type="range" min="10" max="95" value={confidenceThreshold} onChange={e => { setConfidenceThreshold(Number(e.target.value)); }} onMouseUp={handleSaveConfig}
                                        style={{ width: '100%', accentColor: C.purple }} />
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Below this confidence → escalate to human agent</div>
                                </div>
                            </div>
                        </Card>

                        {/* Escalation Rules */}
                        <Card>
                            <SectionHeader icon="" title="Escalation Rules" />
                            <div style={{ display: 'grid', gap: 8 }}>
                                {[
                                    { trigger: 'Angry Sentiment', action: 'Create Critical Ticket', active: true },
                                    { trigger: 'Refund Request', action: 'Create High Priority Ticket', active: true },
                                    { trigger: 'Low AI Confidence', action: 'Escalate to Human', active: true },
                                    { trigger: 'Repeated Contact (3+)', action: 'Flag for Review', active: true },
                                    { trigger: 'Legal Keywords', action: 'Immediate Escalation', active: true },
                                ].map((rule, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                                        <span style={{ fontSize: 12, color: rule.active ? C.green : C.red }}>{rule.active ? 'Yes' : 'No'}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600 }}>{rule.trigger}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>→ {rule.action}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Knowledge Base */}
                    <Card>
                        <SectionHeader icon="" title="Knowledge Base" subtitle="FAQ entries that help the AI answer common questions" />
                        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                            {knowledgeBase.map((kb, i) => (
                                <div key={i} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, borderLeft: `3px solid ${C.cyan}` }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Q: {kb.question}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>A: {kb.answer}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                            <div>
                                <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>QUESTION</label>
                                <input value={kbQuestion} onChange={e => setKbQuestion(e.target.value)} placeholder="Common question..."
                                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>ANSWER</label>
                                <input value={kbAnswer} onChange={e => setKbAnswer(e.target.value)} placeholder="The answer..."
                                    style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, outline: 'none' }} />
                            </div>
                            <button onClick={handleAddKB} style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${C.cyan}`, background: `${C.cyan}10`, color: C.cyan, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
                        </div>
                    </Card>
                </div>
            )}

            {/* ===== ANALYTICS ===== */}
            {subTab === 'analytics' && (
                <div style={{ display: 'grid', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                        <Metric label="Total Conversations" value={String(analytics?.totalConversations || 0)} color={C.cyan} />
                        <Metric label="Today" value={String(analytics?.conversationsToday || 0)} color={C.green} />
                        <Metric label="Avg Response" value={analytics?.avgResponseTimeMs ? `${Math.round(analytics.avgResponseTimeMs / 1000)}s` : '--'} color={C.amber} />
                        <Metric label="AI Automation Rate" value={analytics && analytics.totalMessages > 0 ? `${Math.round((analytics.aiReplies / Math.max(analytics.customerMessages, 1)) * 100)}%` : '0%'} color={C.purple} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* Intent Breakdown */}
                        <Card>
                            <SectionHeader icon="" title="Intent Distribution" />
                            <div style={{ display: 'grid', gap: 8 }}>
                                {Object.entries(analytics?.intentBreakdown || {}).map(([intent, count]) => {
                                    const total = Object.values(analytics?.intentBreakdown || {}).reduce((a, b) => a + b, 0) || 1;
                                    const pct = Math.round((count / total) * 100);
                                    return (
                                        <div key={intent} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontSize: 14 }}>{intentIcon[intent] || ''}</span>
                                            <span style={{ width: 120, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{intent}</span>
                                            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>
                                                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: C.purple }} />
                                            </div>
                                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 30, textAlign: 'right' }}>{count}</span>
                                        </div>
                                    );
                                })}
                                {Object.keys(analytics?.intentBreakdown || {}).length === 0 && (
                                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>Send test messages to see intent distribution</div>
                                )}
                            </div>
                        </Card>

                        {/* SLA & Performance */}
                        <Card>
                            <SectionHeader icon="" title="SLA & Performance" />
                            <div style={{ display: 'grid', gap: 12 }}>
                                {[
                                    { label: 'Critical SLA (1hr)', value: tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').length, total: tickets.filter(t => t.priority === 'critical').length, color: C.red },
                                    { label: 'High SLA (4hr)', value: tickets.filter(t => t.priority === 'high' && t.status !== 'resolved').length, total: tickets.filter(t => t.priority === 'high').length, color: '#F97316' },
                                    { label: 'Medium SLA (24hr)', value: tickets.filter(t => t.priority === 'medium' && t.status !== 'resolved').length, total: tickets.filter(t => t.priority === 'medium').length, color: C.amber },
                                ].map(sla => (
                                    <div key={sla.label} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: 12, fontWeight: 600 }}>{sla.label}</span>
                                            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: sla.color }}>{sla.value} open / {sla.total} total</span>
                                        </div>
                                        <div style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }}>
                                            <div style={{ width: sla.total ? `${Math.round(((sla.total - sla.value) / sla.total) * 100)}%` : '0%', height: '100%', borderRadius: 3, background: sla.color }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

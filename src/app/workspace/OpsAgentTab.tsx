'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ===== TYPES =====
interface StepProgress {
    index: number;
    action: string;
    description: string;
    icon: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: string;
    error?: string;
    durationMs?: number;
}

interface WorkflowHistory {
    id: string;
    command: string;
    status: string;
    createdAt: string;
    totalDurationMs: number | null;
    summary: string | null;
    steps: StepProgress[];
}

interface Template {
    id: string;
    name: string;
    description: string;
    icon: string;
    command: string;
    category: string;
}

// ===== STATUS BADGE =====
function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; color: string; label: string }> = {
        pending: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', label: 'Pending' },
        running: { bg: 'var(--bg-card)', color: '#FFFFFF', label: 'Running' },
        completed: { bg: 'rgba(255,255,255,0.1)', color: '#FFFFFF', label: 'Done' },
        failed: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', label: 'Failed' },
        planning: { bg: 'rgba(255,255,255,0.05)', color: '#FFFFFF', label: 'Planning' },
        executing: { bg: 'var(--bg-card)', color: '#FFFFFF', label: 'Executing' },
    };
    const c = config[status] || config.pending;
    return (
        <span style={{
            padding: '2px 8px', borderRadius: 6, fontSize: 10,
            fontFamily: 'var(--font-mono)', fontWeight: 700,
            background: c.bg, color: c.color,
        }}>
            {c.label}
        </span>
    );
}

// ===== STEP CARD =====
function StepCard({ step, index }: { step: StepProgress; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 16px', borderRadius: 12,
                background: step.status === 'running'
                    ? 'var(--bg-card)'
                    : step.status === 'completed'
                        ? 'rgba(255,255,255,0.05)'
                        : step.status === 'failed'
                            ? 'rgba(255,255,255,0.02)'
                            : 'rgba(255,255,255,0.02)',
                border: `1px solid ${step.status === 'running' ? 'var(--border-primary)' : 'rgba(255,255,255,0.04)'}`,
                position: 'relative', overflow: 'hidden',
            }}
        >
            {/* Running animation bar */}
            {step.status === 'running' && (
                <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '40%', height: 2,
                        background: 'linear-gradient(90deg, transparent, #FFFFFF, transparent)',
                    }}
                />
            )}

            {/* Step number */}
            <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step.status === 'completed'
                    ? 'rgba(255,255,255,0.1)'
                    : step.status === 'failed'
                        ? 'rgba(255,255,255,0.05)'
                        : step.status === 'running'
                            ? 'var(--bg-card)'
                            : 'rgba(255,255,255,0.05)',
                fontSize: 14,
            }}>
                {step.status === 'completed' ? '' : step.status === 'failed' ? '' : step.status === 'running' ? '' : ''}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {step.description}
                    </span>
                    {step.durationMs !== undefined && step.durationMs > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {step.durationMs < 1000 ? `${step.durationMs}ms` : `${(step.durationMs / 1000).toFixed(1)}s`}
                        </span>
                    )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {step.action}
                </div>
                {step.result && (
                    <div style={{
                        marginTop: 8, padding: '8px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: 11, color: '#FFFFFF', fontFamily: 'var(--font-mono)',
                        lineHeight: 1.5, maxHeight: 80, overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                    }}>
                        {step.result}
                    </div>
                )}
                {step.error && (
                    <div style={{
                        marginTop: 8, padding: '8px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                    }}>
                        {step.error}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ===== TEMPLATE CARD =====
function TemplateCard({ template, onSelect }: { template: Template; onSelect: (cmd: string) => void }) {
    return (
        <motion.button
            onClick={() => onSelect(template.command)}
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12, width: '100%',
                background: 'rgba(255,255,255,0.02)', textAlign: 'left',
                border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
        >
            <span style={{ fontSize: 20, flexShrink: 0 }}>{template.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {template.name}
                </div>
                <div style={{
                    fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.4,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {template.description}
                </div>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>▶</span>
        </motion.button>
    );
}

// ===== MAIN COMPONENT =====
export default function OpsAgentTab() {
    const [command, setCommand] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionPhase, setExecutionPhase] = useState<string>('');
    const [steps, setSteps] = useState<StepProgress[]>([]);
    const [summary, setSummary] = useState<string | null>(null);
    const [workflowId, setWorkflowId] = useState<string | null>(null);
    const [workflowStatus, setWorkflowStatus] = useState<string | null>(null);
    const [totalDuration, setTotalDuration] = useState<number | null>(null);
    const [history, setHistory] = useState<WorkflowHistory[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const stepsContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load history + templates on mount
    useEffect(() => {
        fetch('/api/ops')
            .then(r => r.json())
            .then(data => {
                setHistory(data.workflows || []);
                setTemplates(data.templates || []);
            })
            .catch(() => { });
    }, []);

    // Auto-scroll steps
    useEffect(() => {
        stepsContainerRef.current?.scrollTo({ top: stepsContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [steps]);

    // ===== EXECUTE COMMAND =====
    const handleExecute = useCallback(async (cmd?: string) => {
        const finalCmd = cmd || command;
        if (!finalCmd.trim() || isExecuting) return;

        setIsExecuting(true);
        setSteps([]);
        setSummary(null);
        setWorkflowStatus(null);
        setTotalDuration(null);
        setExecutionPhase('Planning...');
        setCommand('');

        try {
            const res = await fetch('/api/ops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: finalCmd }),
            });

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const event = JSON.parse(line.slice(6));

                                if (event.type === 'planning') {
                                    setExecutionPhase(event.message);
                                    setWorkflowId(event.workflowId);
                                    if (event.steps) {
                                        setSteps(event.steps.map((s: any, i: number) => ({
                                            index: i,
                                            action: s.action,
                                            description: s.description,
                                            icon: '',
                                            status: 'pending',
                                        })));
                                    }
                                    if (event.summary) setSummary(event.summary);
                                }

                                if (event.type === 'step_start') {
                                    setExecutionPhase(event.message);
                                    setSteps(prev => prev.map((s, i) =>
                                        i === event.stepIndex
                                            ? { ...s, status: 'running', icon: event.stepIcon || '' }
                                            : s
                                    ));
                                }

                                if (event.type === 'step_complete') {
                                    setSteps(prev => prev.map((s, i) =>
                                        i === event.stepIndex
                                            ? { ...s, status: 'completed', result: event.result, durationMs: event.durationMs, icon: '' }
                                            : s
                                    ));
                                }

                                if (event.type === 'step_failed') {
                                    setSteps(prev => prev.map((s, i) =>
                                        i === event.stepIndex
                                            ? { ...s, status: 'failed', error: event.error || event.message, icon: '' }
                                            : s
                                    ));
                                }

                                if (event.type === 'workflow_complete' || event.type === 'workflow_failed') {
                                    setExecutionPhase(event.message);
                                    setWorkflowStatus(event.type === 'workflow_complete' ? 'completed' : 'failed');
                                    setTotalDuration(event.durationMs || null);
                                    if (event.summary) setSummary(event.summary);
                                }

                                if (event.type === 'error') {
                                    setExecutionPhase(event.message);
                                    setWorkflowStatus('failed');
                                }
                            } catch {
                                // skip
                            }
                        }
                    }
                }
            }
        } catch (err) {
            setExecutionPhase(`Error: ${(err as Error).message}`);
            setWorkflowStatus('failed');
        } finally {
            setIsExecuting(false);
            // Refresh history
            fetch('/api/ops').then(r => r.json()).then(data => setHistory(data.workflows || [])).catch(() => { });
        }
    }, [command, isExecuting]);

    const handleTemplate = useCallback((cmd: string) => {
        setCommand(cmd);
        handleExecute(cmd);
    }, [handleExecute]);

    // ===== RENDER =====
    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            {/* ===== MAIN PANEL ===== */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* HEADER */}
                <div style={{
                    padding: '20px 24px 16px', borderBottom: '1px solid var(--border-primary)',
                    background: 'transparent',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'var(--bg-secondary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, border: '1px solid var(--border-primary)',
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
                                <circle cx="12" cy="5" r="2"></circle>
                                <path d="M12 7v4"></path>
                                <line x1="8" y1="16" x2="8" y2="16"></line>
                                <line x1="16" y1="16" x2="16" y2="16"></line>
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                Operations Agent
                            </h2>
                            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0, fontFamily: 'var(--font-mono)' }}>
                                Autonomous business task execution
                            </p>
                        </div>
                        {workflowId && (
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                    {workflowId}
                                </span>
                                {workflowStatus && <StatusBadge status={workflowStatus} />}
                                {totalDuration && (
                                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                        {(totalDuration / 1000).toFixed(1)}s
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* COMMAND INPUT */}
                <div style={{
                    padding: '16px 24px', borderBottom: '1px solid var(--border-primary)',
                    background: 'rgba(0,0,0,0.2)',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '4px 4px 4px 16px', borderRadius: 14,
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isExecuting ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        transition: 'all 0.3s ease',
                        boxShadow: isExecuting ? '0 0 30px rgba(255,255,255,0.08)' : '0 0 0 transparent',
                    }}>
                        <span style={{ fontSize: 16 }}>{isExecuting ? '' : ''}</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleExecute(); }}
                            placeholder={isExecuting ? 'Executing...' : 'Type a business command — "Send payment reminders", "Check today\'s sales"...'}
                            disabled={isExecuting}
                            style={{
                                flex: 1, padding: '12px 0', border: 'none',
                                background: 'transparent', color: 'var(--text-primary)',
                                fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
                            }}
                        />
                        <motion.button
                            onClick={() => handleExecute()}
                            disabled={!command.trim() || isExecuting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                padding: '10px 20px', borderRadius: 10,
                                background: isExecuting
                                    ? 'var(--bg-card)'
                                    : '#FFFFFF',
                                color: isExecuting ? 'var(--text-tertiary)' : '#000000', fontSize: 13, fontWeight: 600, cursor: isExecuting ? 'wait' : 'pointer',
                                opacity: !command.trim() || isExecuting ? 0.5 : 1,
                                fontFamily: 'var(--font-mono)', border: '1px solid ' + (isExecuting ? 'var(--border-primary)' : '#FFFFFF'),
                            }}
                        >
                            {isExecuting ? 'Running...' : 'Execute'}
                        </motion.button>
                    </div>

                    {/* Phase indicator */}
                    {executionPhase && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)',
                                fontFamily: 'var(--font-mono)', paddingLeft: 4,
                            }}
                        >
                            {executionPhase}
                        </motion.div>
                    )}
                </div>

                {/* EXECUTION AREA */}
                <div ref={stepsContainerRef} style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
                    <AnimatePresence>
                        {steps.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                            >
                                {/* Summary */}
                                {summary && (
                                    <div style={{
                                        padding: '10px 14px', borderRadius: 10, marginBottom: 8,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        fontSize: 12, color: '#FFFFFF', fontFamily: 'var(--font-mono)',
                                    }}>
                                        {summary}
                                    </div>
                                )}

                                {/* Steps */}
                                {steps.map((step, i) => (
                                    <StepCard key={i} step={step} index={i} />
                                ))}

                                {/* Completion banner */}
                                {workflowStatus && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            marginTop: 12, padding: '16px 20px', borderRadius: 14,
                                            background: workflowStatus === 'completed'
                                                ? 'rgba(255,255,255,0.05)'
                                                : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${workflowStatus === 'completed' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                                            textAlign: 'center',
                                        }}
                                    >
                                        <div style={{ fontSize: 32, marginBottom: 8 }}>
                                            {workflowStatus === 'completed' ? '' : ''}
                                        </div>
                                        <div style={{
                                            fontSize: 14, fontWeight: 700,
                                            color: workflowStatus === 'completed' ? '#FFFFFF' : 'var(--text-secondary)',
                                        }}>
                                            {workflowStatus === 'completed' ? 'Workflow Complete' : 'Workflow Failed'}
                                        </div>
                                        {totalDuration && (
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                                                Total time: {(totalDuration / 1000).toFixed(1)}s
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        ) : (
                            /* EMPTY STATE — Show templates */
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ paddingTop: 8 }}
                            >
                                <div style={{
                                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                                    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16,
                                }}>
                                    Quick Actions
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                                    {templates.map(t => (
                                        <TemplateCard key={t.id} template={t} onSelect={handleTemplate} />
                                    ))}
                                </div>

                                {/* Capabilities */}
                                <div style={{
                                    marginTop: 32, padding: '20px 24px', borderRadius: 14,
                                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                                        letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12,
                                    }}>
                                        What I can do
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                        {[
                                            { icon: '', label: 'Send WhatsApp messages' },
                                            { icon: '', label: 'Send emails' },
                                            { icon: '', label: 'Generate reports' },
                                            { icon: '', label: 'Search contacts & CRM' },
                                            { icon: '', label: 'Generate content' },
                                            { icon: '', label: 'Browse & extract data' },
                                            { icon: '', label: 'Aggregate analytics' },
                                            { icon: '', label: 'Send notifications' },
                                            { icon: '', label: 'Schedule tasks' },
                                        ].map(cap => (
                                            <div key={cap.label} style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                padding: '8px 10px', borderRadius: 8,
                                                background: 'rgba(255,255,255,0.02)',
                                            }}>
                                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{cap.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ===== SIDEBAR — History ===== */}
            <div style={{
                width: 260, borderLeft: '1px solid var(--border-primary)',
                overflow: 'auto', background: 'rgba(0,0,0,0.15)', flexShrink: 0,
            }}>
                <div style={{
                    padding: '14px 16px', borderBottom: '1px solid var(--border-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                        letterSpacing: 1.5, textTransform: 'uppercase',
                    }}>
                        Workflow History
                    </span>
                    <span style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)',
                        padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(255,255,255,0.1)', color: '#FFFFFF',
                    }}>
                        {history.length}
                    </span>
                </div>

                <div style={{ padding: 8 }}>
                    {history.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '32px 16px',
                            color: 'var(--text-muted)', fontSize: 12,
                        }}>
                            No workflows yet.<br />Execute a command to start.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {history.map(wf => (
                                <motion.div
                                    key={wf.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{
                                        padding: '10px 12px', borderRadius: 10,
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.04)',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => {
                                        setSteps(wf.steps || []);
                                        setSummary(wf.summary);
                                        setWorkflowId(wf.id);
                                        setWorkflowStatus(wf.status);
                                        setTotalDuration(wf.totalDurationMs);
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <StatusBadge status={wf.status} />
                                        <span style={{
                                            fontSize: 9, color: 'var(--text-muted)',
                                            fontFamily: 'var(--font-mono)', marginLeft: 'auto',
                                        }}>
                                            {wf.id}
                                        </span>
                                    </div>
                                    <div style={{
                                        fontSize: 12, color: 'var(--text-secondary)',
                                        lineHeight: 1.4, overflow: 'hidden',
                                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {wf.command}
                                    </div>
                                    {wf.totalDurationMs && (
                                        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                                            {(wf.totalDurationMs / 1000).toFixed(1)}s • {(wf.steps || []).length} steps
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

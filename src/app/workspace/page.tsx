'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAppStore } from '@/lib/store';
import { AgentMessage, AgentRole, DebatePhase, StrategyOutput, ViabilityScore } from '@/lib/types';
import TechBuildTab from './TechBuildTab';
import MarketingTab from './MarketingTab';
import GrowthTab from './GrowthTab';
import RenovationTab from './RenovationTab';
import SupplyTab from './SupplyTab';
import FinanceTab from './FinanceTab';
import SupportTab from './SupportTab';
import OpsAgentTab from './OpsAgentTab';
import FundraisingTab from './FundraisingTab';
import LaunchTab from './LaunchTab';

// ===> DEPARTMENT COLORS (Rich Glass Theme)
const DEPT_COLORS: Record<string, string> = {
    orchestrator: '#38BDF8', finance: '#10B981', marketing: '#818CF8',
    growth: '#F43F5E', market_research: '#F59E0B', tech: '#06B6D4',
    licensing: '#A855F7', supply: '#EAB308', launch: '#EC4899',
};
const PHASE_LABELS: Record<string, string> = {
    INITIAL_PROPOSAL: 'Initial Proposals',
    CROSS_ANALYSIS: 'Cross-Analysis',
    CONFLICT_DETECTION: 'Conflict Detection',
    REVISION_REQUEST: 'Revision Requested',
    REVISED_PROPOSAL: 'Revised Proposals',
    ORCHESTRATOR_EVALUATION: 'Orchestrator Evaluation',
    ACCEPTED: 'Strategy Accepted',
    REJECTED: 'Strategy Rejected',
};

const TABS = [
    { id: 'overview', label: 'Overview', icon: '' },
    { id: 'ops_agent', label: 'Operations', icon: '' },
    { id: 'tech_build', label: 'Tech Build', icon: '' },
    { id: 'finance', label: 'Finance', icon: '' },
    { id: 'marketing', label: 'Marketing', icon: '' },
    { id: 'market_research', label: 'Market Intel', icon: '' },
    { id: 'tech', label: 'Technology', icon: '' },
    { id: 'growth', label: 'Growth', icon: '' },
    { id: 'launch', label: 'Launch', icon: '' },
    { id: 'licensing', label: 'Licensing', icon: '' },
    { id: 'supply', label: 'Supply Chain', icon: '' },
    { id: 'fundraising', label: 'Fundraising', icon: '' },
    { id: 'support', label: 'Support', icon: '' },
];

// ========= SIDEBAR: DEBATE FEED =========
function DebateSidebar({ messages, agents, phase, selectedAgent, onSelectAgent }: {
    messages: AgentMessage[];
    agents: AgentRole[];
    phase: DebatePhase | null;
    selectedAgent: string | null;
    onSelectAgent: (id: string | null) => void;
}) {
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="workspace-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Agent List */}
            <div style={{ padding: 16, borderBottom: '1px solid var(--border-primary)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                    Active Agents ({agents.filter(a => a.department !== 'orchestrator').length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {agents.filter(a => a.department !== 'orchestrator').map(agent => {
                        const deptColor = DEPT_COLORS[agent.department] || agent.color || '#38BDF8';
                        return (
                            <motion.button
                                key={agent.id}
                                onClick={() => onSelectAgent(selectedAgent === agent.id ? null : agent.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '6px 12px',
                                    background: selectedAgent === agent.id ? `${deptColor}20` : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${selectedAgent === agent.id ? deptColor + '60' : 'var(--border-primary)'}`,
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600,
                                    color: selectedAgent === agent.id ? deptColor : 'var(--text-secondary)',
                                    boxShadow: selectedAgent === agent.id ? `0 0 10px ${deptColor}30` : 'none',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <span style={{ fontSize: 14 }}>{agent.icon}</span>
                                {agent.name}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Phase Indicator */}
            {phase && (
                <div style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border-primary)',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    {!['ACCEPTED', 'REJECTED'].includes(phase) && <div className="spinner" />}
                    <span className={`badge ${phase === 'ACCEPTED' ? 'badge-accepted' : phase === 'REJECTED' ? 'badge-rejected' : 'badge-debating'}`}>
                        {PHASE_LABELS[phase] || phase}
                    </span>
                </div>
            )}

            {/* Message Feed */}
            <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column' }}>
                <AnimatePresence>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={msg.id || i}
                            initial={{ opacity: 0, y: 15, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.4, duration: 0.5, delay: i * 0.05 }}
                            className="agent-msg"
                            style={{
                                borderTop: `2px solid ${DEPT_COLORS[msg.department] || '#666'}`,
                                borderRadius: msg.department === 'orchestrator' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                alignSelf: msg.department === 'orchestrator' ? 'flex-end' : 'flex-start',
                                maxWidth: '90%',
                                marginBottom: 16,
                            }}
                        >
                            <div className="agent-msg-header">
                                <span className="agent-msg-name" style={{ color: DEPT_COLORS[msg.department] || '#fff' }}>
                                    {msg.agent_name}
                                </span>
                                <span className="agent-msg-type">{msg.type}</span>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                                    {msg.confidence_score ? `${Math.round(msg.confidence_score * 100)}%` : ''}
                                </span>
                            </div>
                            <div className="agent-msg-content">
                                {msg.content.summary}
                            </div>
                            {msg.risk_flags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                                    {msg.risk_flags.slice(0, 3).map((flag, fi) => (
                                        <span key={fi} style={{
                                            fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                            background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                                            fontFamily: 'var(--font-mono)',
                                        }}>{flag}</span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>
        </div>
    );
}

// ========= VIABILITY GAUGE =========
function ViabilityGauge({ score }: { score: ViabilityScore }) {
    const pct = Math.round(score.composite * 100);
    const color = '#FFFFFF';
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (pct / 100) * circumference;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <svg width={120} height={120} viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" stroke="var(--border-primary)" strokeWidth="8" fill="none" />
                <motion.circle
                    cx="60" cy="60" r="50"
                    stroke={color}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
                <text x="60" y="55" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="var(--font-mono)">
                    {pct}
                </text>
                <text x="60" y="72" textAnchor="middle" fill="var(--text-tertiary)" fontSize="10" fontFamily="var(--font-mono)">
                    VIABILITY
                </text>
            </svg>
            <div style={{ display: 'grid', gap: 8, flex: 1 }}>
                {[
                    { label: 'Financial', value: score.financial_feasibility, weight: '30%' },
                    { label: 'Market', value: score.market_realism, weight: '20%' },
                    { label: 'Operations', value: score.operational_feasibility, weight: '15%' },
                    { label: 'Regulatory', value: score.regulatory_compliance, weight: '15%' },
                    { label: 'Resources', value: score.resource_alignment, weight: '10%' },
                    { label: 'Risk (inv)', value: score.risk_exposure_inverse, weight: '10%' },
                ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', width: 80, fontFamily: 'var(--font-mono)' }}>{item.label}</span>
                        <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3 }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.round(item.value * 100)}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                style={{
                                    height: '100%', borderRadius: 3,
                                    background: '#FFFFFF',
                                }}
                            />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', width: 40, textAlign: 'right' }}>
                            {Math.round(item.value * 100)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ========= OVERVIEW TAB =========
function OverviewTab({ output, viability }: { output: StrategyOutput; viability: ViabilityScore }) {
    return (
        <div style={{ display: 'grid', gap: 24 }}>
            {/* Executive Summary */}
            <div className="glass-card" style={{ padding: 28 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Executive Summary
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                    {output.executive_summary}
                </p>
            </div>

            {/* Viability Score */}
            <div className="glass-card" style={{ padding: 28 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
                    Viability Assessment
                </h3>
                <ViabilityGauge score={viability} />
            </div>

            {/* Department Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {output.departments.map((dept, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card"
                        style={{
                            padding: 24,
                            borderColor: DEPT_COLORS[dept.department] ? DEPT_COLORS[dept.department] + '30' : 'var(--border-primary)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{
                                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12,
                                color: DEPT_COLORS[dept.department] || 'var(--text-primary)',
                            }}>
                                {dept.agent_name}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>— {dept.title}</span>
                        </div>
                        <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 16 }}>
                            {dept.summary}
                        </p>
                        {/* Key Metrics */}
                        {dept.key_metrics && Object.keys(dept.key_metrics).length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                                {Object.entries(dept.key_metrics).slice(0, 4).map(([key, val]) => (
                                    <div key={key} style={{
                                        padding: '8px 12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)',
                                    }}>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{key}</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{String(val)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Action Items */}
                        {dept.action_items.length > 0 && (
                            <div>
                                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: 6 }}>ACTION ITEMS</div>
                                {dept.action_items.slice(0, 4).map((item, ai) => (
                                    <div key={ai} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0', display: 'flex', gap: 6 }}>
                                        <span style={{ color: DEPT_COLORS[dept.department] || '#666' }}>▸</span> {item}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Key Risks & Next Steps */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="glass-card" style={{ padding: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        Key Risks
                    </h4>
                    {output.key_risks.map((risk, i) => (
                        <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '6px 0', borderBottom: '1px solid var(--border-primary)' }}>
                            {risk}
                        </div>
                    ))}
                </div>
                <div className="glass-card" style={{ padding: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        Next Steps
                    </h4>
                    {output.next_steps.map((step, i) => (
                        <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '6px 0', borderBottom: '1px solid var(--border-primary)' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginRight: 8 }}>{i + 1}.</span>{step}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ========= DEPARTMENT TAB =========
function DepartmentTab({ department, output }: { department: string; output: StrategyOutput }) {
    const dept = output.departments.find(d => d.department === department);
    if (!dept) return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}></div>
            <div>No {department} agent was activated for this business.</div>
        </div>
    );

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            {/* Header */}
            <div className="glass-card" style={{
                padding: 28,
                borderColor: (DEPT_COLORS[department] || '#666') + '30',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `var(--bg-card-hover)`, border: '1px solid var(--border-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff'
                    }}>
                        {TABS.find(t => t.id === department)?.icon || ''}
                    </div>
                    <div>
                        <h3 style={{ fontSize: 20, fontWeight: 800 }}>{dept.title}</h3>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: DEPT_COLORS[department] || '#666' }}>
                            {dept.agent_name} — {department.toUpperCase()}
                        </span>
                    </div>
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)' }}>{dept.summary}</p>
            </div>

            {/* Details */}
            {dept.details && (
                <div className="glass-card" style={{ padding: 28 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Detailed Analysis</h4>
                    <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{dept.details}</p>
                </div>
            )}

            {/* Metrics */}
            {dept.key_metrics && Object.keys(dept.key_metrics).length > 0 && (
                <div className="glass-card" style={{ padding: 28 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Key Metrics</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        {Object.entries(dept.key_metrics).map(([key, val]) => (
                            <div key={key} style={{
                                padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-primary)',
                            }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>{key.replace(/_/g, ' ')}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: DEPT_COLORS[department] || 'var(--text-primary)' }}>{String(val)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Items & Risks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="glass-card" style={{ padding: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Action Items</h4>
                    {dept.action_items.map((item, i) => (
                        <div key={i} style={{
                            fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border-primary)',
                            color: 'var(--text-secondary)', display: 'flex', gap: 8,
                        }}>
                            <span style={{ color: DEPT_COLORS[department] || '#666', fontFamily: 'var(--font-mono)' }}>{i + 1}</span>
                            {item}
                        </div>
                    ))}
                </div>
                <div className="glass-card" style={{ padding: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Risks</h4>
                    {dept.risks.map((risk, i) => (
                        <div key={i} style={{
                            fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border-primary)',
                            color: 'var(--text-secondary)',
                        }}>{risk}</div>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            {dept.timeline && (
                <div className="glass-card" style={{ padding: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Timeline</h4>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{dept.timeline}</p>
                </div>
            )}
        </div>
    );
}

// ========= PIPELINE STATUS BAR =========
function PipelineStatus({ stage }: { stage: string }) {
    const stages = [
        { key: 'analyzing_business', label: 'Analyzing Business', pct: 15 },
        { key: 'generating_agents', label: 'Generating Agents', pct: 30 },
        { key: 'debating', label: 'Executive Debate', pct: 65 },
        { key: 'generating_output', label: 'Generating Output', pct: 85 },
        { key: 'complete', label: 'Strategy Complete', pct: 100 },
    ];
    const current = stages.find(s => s.key === stage);
    const pct = current?.pct || 0;

    return (
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
                <div className="progress-bar">
                    <motion.div
                        className="progress-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: stage === 'complete' ? '#10B981' : 'var(--accent-purple-light)',
            }}>
                {stage !== 'complete' && stage !== 'idle' && stage !== 'error' && <div className="spinner" />}
                {current?.label || stage}
            </div>
        </div>
    );
}

// ========= MAIN WORKSPACE PAGE =========
export default function WorkspacePage() {
    const {
        stage, error, businessProfile, agents, debateMessages,
        debatePhase, viabilityScore, strategyOutput,
        selectedAgent, activeTab,
        setStage, setError, setBusinessProfile, setComplexityScores,
        setAgents, addDebateMessage, setDebatePhase, addConflict,
        setViabilityScore, setStrategyOutput, setSelectedAgent, setActiveTab, reset,
    } = useAppStore();

    const [inputText, setInputText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const exportToPDF = async () => {
        const input = document.getElementById('pdf-export-content');
        if (!input) return;

        setIsExporting(true);
        try {
            // Temporarily disable overflow so html2canvas captures the full scrolling height
            const originalOverflow = input.style.overflow;
            const originalHeight = input.style.height;
            input.style.overflow = 'visible';
            input.style.height = 'auto';

            const canvas = await html2canvas(input, { scale: 2, useCORS: true, logging: false });

            // Restore original scroll lock styles
            input.style.overflow = originalOverflow;
            input.style.height = originalHeight;

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            if (pdfHeight > pageHeight) {
                let heightLeft = pdfHeight;
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
                while (heightLeft > 0) {
                    position = heightLeft - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;
                }
            } else {
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }

            pdf.save(`OpenClaw_${activeTab}_Report.pdf`);
        } catch (e) {
            console.error('PDF Export failed:', e);
        }
        setIsExporting(false);
    };

    const runPipeline = useCallback(async (prompt: string) => {
        try {
            setIsProcessing(true);
            reset();
            setStage('analyzing_business');

            // Step 1: Business Analysis
            const bizRes = await fetch('/api/business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });
            if (!bizRes.ok) throw new Error(await bizRes.text());
            const bizData = await bizRes.json();
            setBusinessProfile(bizData.profile);
            setComplexityScores(bizData.complexity_scores);

            // Step 2: Agent Generation
            setStage('generating_agents');
            const agentRes = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile: bizData.profile,
                    complexity_scores: bizData.complexity_scores,
                }),
            });
            if (!agentRes.ok) throw new Error(await agentRes.text());
            const agentData = await agentRes.json();
            setAgents(agentData.agents);

            // Step 3: Debate (SSE streaming)
            setStage('debating');
            const debateRes = await fetch('/api/debate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile: bizData.profile,
                    agents: agentData.agents,
                }),
            });

            if (!debateRes.ok) throw new Error(await debateRes.text());

            const reader = debateRes.body?.getReader();
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
                                switch (event.type) {
                                    case 'agent_message':
                                        addDebateMessage(event.data);
                                        break;
                                    case 'phase_change':
                                        setDebatePhase(event.data);
                                        break;
                                    case 'conflict':
                                        addConflict(event.data);
                                        break;
                                    case 'complete':
                                        setStage('generating_output');
                                        if (event.data.viability_score) {
                                            setViabilityScore(event.data.viability_score);
                                        }
                                        if (event.data.final_strategy) {
                                            setStrategyOutput(event.data.final_strategy);
                                            if (event.data.final_strategy.viability_score) {
                                                setViabilityScore(event.data.final_strategy.viability_score);
                                            }
                                        }
                                        setStage('complete');
                                        setDebatePhase('ACCEPTED');
                                        break;
                                    case 'error':
                                        throw new Error(event.data);
                                }
                            } catch (e) {
                                if ((e as Error).message !== 'Unexpected end of JSON input') {
                                    console.warn('SSE parse error:', e);
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Pipeline error:', err);
            setStage('error');
            setError((err as Error).message);
        } finally {
            setIsProcessing(false);
        }
    }, [reset, setStage, setBusinessProfile, setComplexityScores, setAgents, addDebateMessage, setDebatePhase, addConflict, setViabilityScore, setStrategyOutput, setError]);

    const handleSubmit = () => {
        if (!inputText.trim() || isProcessing) return;
        runPipeline(inputText.trim());
    };

    return (
        <div className="workspace-layout">
            {/* ===== HEADER ===== */}
            <header className="workspace-header" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px', height: 60, background: 'rgba(3,3,3,0.8)',
                backdropFilter: 'blur(16px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
                        <div style={{
                            width: 16, height: 16, background: '#fff'
                        }}>
                        </div>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>founders.ai</span>
                    </Link>
                    {businessProfile && (
                        <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 11,
                            color: 'var(--text-tertiary)', marginLeft: 12,
                        }}>
                            {businessProfile.industry} · {businessProfile.geography} · {businessProfile.business_stage}
                        </span>
                    )}
                </div>

                {stage !== 'idle' && <PipelineStatus stage={stage} />}

                <button className="btn-ghost" onClick={reset} style={{ padding: '6px 14px', fontSize: 12 }}>
                    New Session
                </button>
            </header>

            {/* ===== SIDEBAR ===== */}
            {stage !== 'idle' ? (
                <DebateSidebar
                    messages={debateMessages}
                    agents={agents}
                    phase={debatePhase}
                    selectedAgent={selectedAgent}
                    onSelectAgent={setSelectedAgent}
                />
            ) : (
                <div className="workspace-sidebar" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: 32, textAlign: 'center',
                }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                        Agents will appear here once you describe your business
                    </div>
                </div>
            )}

            {/* ===== MAIN PANEL ===== */}
            <main className="workspace-main" style={{ background: 'var(--bg-primary)' }}>
                {/* IDLE STATE — Input Form */}
                {stage === 'idle' && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        height: '100%', maxWidth: 700, margin: '0 auto', padding: '0 24px',
                    }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ width: '100%', textAlign: 'center' }}
                        >
                            <h2 style={{ fontSize: 28, fontWeight: 500, marginBottom: 8, letterSpacing: -1 }}>
                                Describe Your Business
                            </h2>
                            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
                                Tell us about your business idea, stage, goals, and constraints. Our AI executive team will analyze it and produce a comprehensive strategy.
                            </p>

                            <div className="glass-card gradient-border" style={{ padding: 4, marginBottom: 16 }}>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Example: I want to start a cloud kitchen in Mumbai specializing in healthy meals. I have ₹15 lakh to invest. I want to target health-conscious professionals aged 25-40 through delivery apps and my own website..."
                                    style={{
                                        width: '100%', minHeight: 160, padding: 20,
                                        background: 'transparent', border: 'none', outline: 'none',
                                        color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.7,
                                        fontFamily: 'var(--font-sans)', resize: 'vertical',
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.metaKey) handleSubmit();
                                    }}
                                />
                            </div>

                            <motion.button
                                className="btn-primary"
                                onClick={handleSubmit}
                                disabled={!inputText.trim() || isProcessing}
                                style={{ padding: '14px 40px', fontSize: 16, width: '100%' }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                Generate Strategy
                            </motion.button>

                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
                                ⌘ + Enter to submit · AI agents will debate for 1-3 minutes
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* PROCESSING STATE */}
                {(stage === 'analyzing_business' || stage === 'generating_agents' || stage === 'debating' || stage === 'generating_output') && !strategyOutput && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        height: '60%', textAlign: 'center',
                    }}>
                        <div style={{ width: 40, height: 40, border: '1px solid var(--border-primary)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 24 }} />
                        <h3 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>
                            {stage === 'analyzing_business' && 'Analyzing Your Business...'}
                            {stage === 'generating_agents' && 'Generating AI Executive Team...'}
                            {stage === 'debating' && 'Executive Debate in Progress...'}
                            {stage === 'generating_output' && 'Generating Strategy Output...'}
                        </h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, lineHeight: 1.6 }}>
                            {stage === 'debating' ? 'Watch the live debate in the sidebar →' : 'This may take a moment...'}
                        </p>
                    </div>
                )}

                {/* ERROR STATE */}
                {stage === 'error' && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        height: '60%', textAlign: 'center',
                    }}>
                        <h3 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8, color: '#EF4444' }}>Pipeline Error</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 500, marginBottom: 24, lineHeight: 1.6 }}>
                            {error}
                        </p>
                        <button className="btn-primary" onClick={reset}>Try Again</button>
                    </div>
                )}

                {/* RESULTS STATE */}
                {stage === 'complete' && strategyOutput && (
                    <div>
                        {/* Tab Bar */}
                        <div className="tab-bar" style={{ marginBottom: (activeTab === 'tech_build' || activeTab === 'ops_agent') ? 0 : 24 }}>
                            {TABS.map(tab => {
                                const hasDept = tab.id === 'overview' || tab.id === 'ops_agent' || tab.id === 'tech_build' || tab.id === 'support' || strategyOutput.departments.some(d => d.department === tab.id);
                                return (
                                    <button
                                        key={tab.id}
                                        className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{ opacity: hasDept ? 1 : 0.4 }}
                                        disabled={!hasDept}
                                    >
                                        {tab.icon ? `${tab.icon} ` : ''}{tab.label}
                                    </button>
                                );
                            })}
                            {/* Conditional Renovation tab — only for businesses needing physical space */}
                            {businessProfile && businessProfile.physical_infrastructure_score > 0.3 && (
                                <button
                                    className={`tab-item ${activeTab === 'renovation' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('renovation')}
                                >
                                    Renovation
                                </button>
                            )}
                            <div style={{ flex: 1 }} />
                            <button
                                onClick={exportToPDF}
                                disabled={isExporting}
                                style={{
                                    padding: '6px 16px', borderRadius: 8,
                                    background: 'var(--bg-glass)', border: '1px solid var(--border-primary)',
                                    color: 'var(--text-primary)', fontSize: 13, fontWeight: 600,
                                    cursor: isExporting ? 'wait' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}
                            >
                                {isExporting ? <div className="spinner" style={{ width: 14, height: 14 }} /> : ''}
                                {isExporting ? 'Generating...' : 'Export PDF'}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                id="pdf-export-content"
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                style={(activeTab === 'tech_build' || activeTab === 'ops_agent') ? { height: 'calc(100vh - 160px)' } : undefined}
                            >
                                {activeTab === 'ops_agent' ? (
                                    <OpsAgentTab />
                                ) : activeTab === 'tech_build' ? (
                                    <TechBuildTab />
                                ) : activeTab === 'overview' && viabilityScore ? (
                                    <OverviewTab output={strategyOutput} viability={viabilityScore} />
                                ) : activeTab === 'marketing' ? (
                                    <MarketingTab output={strategyOutput} profile={businessProfile} />
                                ) : activeTab === 'growth' ? (
                                    <GrowthTab output={strategyOutput} profile={businessProfile} />
                                ) : activeTab === 'renovation' ? (
                                    <RenovationTab output={strategyOutput} profile={businessProfile} />
                                ) : activeTab === 'supply' ? (
                                    <SupplyTab output={strategyOutput} profile={businessProfile} />
                                ) : activeTab === 'finance' ? (
                                    <FinanceTab output={strategyOutput} profile={businessProfile} />
                                ) : activeTab === 'fundraising' ? (
                                    <FundraisingTab output={strategyOutput} profile={businessProfile} />
                                ) : activeTab === 'launch' ? (
                                    <LaunchTab output={strategyOutput} profile={businessProfile} />
                                ) : activeTab === 'support' ? (
                                    <SupportTab />
                                ) : (
                                    <DepartmentTab department={activeTab} output={strategyOutput} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}

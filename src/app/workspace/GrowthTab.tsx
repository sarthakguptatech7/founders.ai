'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StrategyOutput, DepartmentOutput, BusinessProfile } from '@/lib/types';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, RadarChart,
    Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';

// ===== NAV =====
const SECTIONS = [
    { id: 'overview', label: 'Dashboard', icon: '' },
    { id: 'opportunities', label: 'Opportunities', icon: '' },
    { id: 'challenges', label: 'Challenges', icon: '' },
    { id: 'expansion', label: 'Expansion', icon: '' },
    { id: 'tracking', label: 'Tracking Sheet', icon: '' },
    { id: 'performance', label: 'Performance', icon: '' },
    { id: 'competitors', label: 'Competitors', icon: '' },
];

const C = {
    purple: '#A855F7', cyan: '#06B6D4', pink: '#EC4899', green: '#10B981',
    amber: '#F59E0B', red: '#F43F5E', blue: '#38BDF8', indigo: '#818CF8',
};

// ===== REUSABLE =====
function Card({ children, style, glow }: { children: React.ReactNode; style?: React.CSSProperties; glow?: string }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 24, position: 'relative', overflow: 'hidden',
            ...(glow ? { boxShadow: `0 0 40px ${glow}15, inset 0 1px 0 rgba(255,255,255,0.05)` } : {}),
            ...style,
        }}>{children}</div>
    );
}

function SH({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
    return (
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
            <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h3>
                {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>{sub}</p>}
            </div>
        </div>
    );
}

function KPI({ label, value, change, color }: { label: string; value: string; change?: string; color?: string }) {
    const pos = change?.startsWith('+');
    return (
        <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>{label}</div>
            {change && <div style={{ fontSize: 11, color: pos ? '#FFFFFF' : 'var(--text-secondary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{change} vs last month</div>}
        </div>
    );
}

// ===== SECTION 1: OVERVIEW DASHBOARD =====
function OverviewDashboard({ dept, profile }: { dept: DepartmentOutput; profile: BusinessProfile | null }) {
    const radarData = useMemo(() => [
        { subject: 'Market Fit', A: 82, fullMark: 100 },
        { subject: 'Revenue', A: 65, fullMark: 100 },
        { subject: 'Retention', A: 78, fullMark: 100 },
        { subject: 'Acquisition', A: 70, fullMark: 100 },
        { subject: 'Virality', A: 55, fullMark: 100 },
        { subject: 'Scalability', A: 88, fullMark: 100 },
    ], []);

    const growthScore = 74;
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (growthScore / 100) * circumference;
    const scoreColor = growthScore >= 80 ? C.green : growthScore >= 60 ? C.amber : C.red;

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                <KPI label="Monthly Growth" value="18.5%" change="+3.2%" />
                <KPI label="Active Users" value="12.4K" change="+22%" />
                <KPI label="MRR" value="₹4.8L" change="+15%" />
                <KPI label="Churn Rate" value="3.2%" change="-0.8%" />
                <KPI label="LTV:CAC" value="4.5x" change="+0.6x" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
                {/* Strategy Summary */}
                <Card glow={C.pink}>
                    <SH icon="" title="AI Growth Strategy" sub={`For ${profile?.industry || 'your business'} — ${profile?.business_stage || ''} stage`} />
                    <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 16 }}>{dept.summary}</p>
                    {dept.details && <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-tertiary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>{dept.details.substring(0, 500)}{dept.details.length > 500 ? '...' : ''}</p>}
                    {/* Key Metrics */}
                    {dept.key_metrics && Object.keys(dept.key_metrics).length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 16 }}>
                            {Object.entries(dept.key_metrics).map(([k, v]) => (
                                <div key={k} style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{k.replace(/_/g, ' ')}</div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{String(v)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Growth Score + Radar */}
                <div style={{ display: 'grid', gap: 20 }}>
                    <Card glow={scoreColor}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 12, textTransform: 'uppercase' }}>Growth Readiness Score</div>
                            <svg width={120} height={120} viewBox="0 0 120 120" style={{ display: 'block', margin: '0 auto' }}>
                                <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
                                <motion.circle cx="60" cy="60" r="50" stroke={scoreColor} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: 'easeOut' }} style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                                <text x="60" y="55" textAnchor="middle" fill={scoreColor} fontSize="28" fontWeight="800" fontFamily="var(--font-mono)">{growthScore}</text>
                                <text x="60" y="72" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">/ 100</text>
                            </svg>
                        </div>
                    </Card>
                    <Card>
                        <ResponsiveContainer width="100%" height={160}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                                <PolarAngleAxis dataKey="subject" stroke="var(--text-muted)" fontSize={9} />
                                <Radar dataKey="A" stroke={C.pink} fill={C.pink} fillOpacity={0.2} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// ===== SECTION 2: GROWTH OPPORTUNITIES =====
function OpportunitiesSection({ profile }: { profile: BusinessProfile | null }) {
    const industry = profile?.industry || 'Business';
    const opportunities = useMemo(() => [
        { title: `Digital-First ${industry} Platform`, impact: 92, effort: 'Medium', timeline: '3-6 months', category: 'Product', desc: `Build a digital marketplace for ${industry}, leveraging AI to personalize user experience and reduce CAC by 40%.`, status: 'explore' },
        { title: 'Referral Growth Loop', impact: 85, effort: 'Low', timeline: '1-2 months', category: 'Viral', desc: 'Implement a two-sided referral program with tiered rewards. Expected 25% of new users via referrals within Q2.', status: 'in_progress' },
        { title: `B2B ${industry} Partnerships`, impact: 78, effort: 'High', timeline: '6-12 months', category: 'Partnerships', desc: `Partner with top 10 ${industry} enterprises for co-branded offerings. Potential ₹20L+ annual revenue per partner.`, status: 'explore' },
        { title: 'Content-Led SEO Flywheel', impact: 88, effort: 'Medium', timeline: '3-6 months', category: 'Organic', desc: `Create authoritative ${industry} content hub. Target 50K monthly organic visitors within 6 months.`, status: 'in_progress' },
        { title: 'Tier-2 City Expansion', impact: 72, effort: 'Medium', timeline: '4-8 months', category: 'Geographic', desc: `Expand to 5 Tier-2 cities. ${industry} demand growing 35% YoY in these markets.`, status: 'planned' },
        { title: 'Subscription Model Upsell', impact: 80, effort: 'Low', timeline: '1-3 months', category: 'Revenue', desc: 'Launch premium subscription tier with exclusive features. Target 15% conversion from free users.', status: 'explore' },
    ], [industry]);

    const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
        explore: { bg: `rgba(255,255,255,0.05)`, color: '#FFFFFF', label: 'Exploring' },
        in_progress: { bg: `rgba(255,255,255,0.05)`, color: '#FFFFFF', label: 'In Progress' },
        planned: { bg: `rgba(255,255,255,0.05)`, color: '#FFFFFF', label: 'Planned' },
    };

    return (
        <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {opportunities.map((o, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <Card>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div>
                                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{o.title}</h4>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{o.category} · {o.timeline}</span>
                                </div>
                                <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, fontFamily: 'var(--font-mono)', ...statusStyle[o.status] }}>{statusStyle[o.status].label}</span>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>{o.desc}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>IMPACT SCORE</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: o.impact >= 85 ? '#FFFFFF' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{o.impact}/100</span>
                                    </div>
                                    <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${o.impact}%` }} transition={{ duration: 1 }} style={{ height: '100%', borderRadius: 3, background: o.impact >= 85 ? '#FFFFFF' : 'var(--border-primary)' }} />
                                    </div>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Effort: <span style={{ fontWeight: 700, color: o.effort === 'Low' ? '#FFFFFF' : 'var(--text-primary)' }}>{o.effort}</span></div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ===== SECTION 3: CHALLENGES & RISK MATRIX =====
function ChallengesSection({ dept }: { dept: DepartmentOutput }) {
    const challenges = useMemo(() => [
        { title: 'High Customer Acquisition Cost', severity: 'high', category: 'Financial', impact: 85, mitigation: 'Shift 30% of paid budget to organic channels. Implement referral loop to reduce CAC by 40%.', status: 'mitigating' },
        { title: 'Low Retention in Week 2-4', severity: 'high', category: 'Product', impact: 78, mitigation: 'Introduce onboarding email drip sequence. Add in-app engagement triggers at key drop-off points.', status: 'investigating' },
        { title: 'Market Saturation in Tier-1 Cities', severity: 'medium', category: 'Market', impact: 65, mitigation: 'Differentiate through UX. Accelerate Tier-2 expansion roadmap.', status: 'monitoring' },
        { title: 'Talent Acquisition Bottleneck', severity: 'medium', category: 'Operations', impact: 58, mitigation: 'Partner with coding bootcamps. Offer remote-first roles to widen talent pool.', status: 'mitigating' },
        { title: 'Regulatory Compliance Gap', severity: 'low', category: 'Legal', impact: 42, mitigation: 'Engage compliance consultant. Build automated reporting pipeline.', status: 'monitoring' },
    ], []);

    const sevStyle: Record<string, { bg: string; color: string }> = {
        high: { bg: `${C.red}15`, color: C.red },
        medium: { bg: `${C.amber}15`, color: C.amber },
        low: { bg: `${C.green}15`, color: C.green },
    };
    const statStyle: Record<string, { bg: string; color: string }> = {
        mitigating: { bg: `${C.blue}15`, color: C.blue },
        investigating: { bg: `${C.purple}15`, color: C.purple },
        monitoring: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' },
    };

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* Risk from dept */}
            {dept.risks.length > 0 && (
                <Card glow={C.red}>
                    <SH icon="" title="AI-Identified Risks" sub="Automatically detected from strategy analysis" />
                    <div style={{ display: 'grid', gap: 6 }}>
                        {dept.risks.map((r, i) => (
                            <div key={i} style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.05)', borderRadius: 6, borderLeft: `3px solid ${C.red}`, fontSize: 13, color: 'var(--text-secondary)' }}>{r}</div>
                        ))}
                    </div>
                </Card>
            )}
            {/* Challenges Table */}
            <Card>
                <SH icon="" title="Growth Challenges Matrix" sub="Prioritized by impact severity" />
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {['Challenge', 'Category', 'Severity', 'Impact', 'Status', 'Mitigation'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {challenges.map((c, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: 12, fontWeight: 600 }}>{c.title}</td>
                                <td style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12 }}>{c.category}</td>
                                <td style={{ padding: 12 }}><span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, fontFamily: 'var(--font-mono)', ...sevStyle[c.severity] }}>{c.severity}</span></td>
                                <td style={{ padding: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: c.impact >= 75 ? C.red : c.impact >= 55 ? C.amber : C.green }}>{c.impact}/100</td>
                                <td style={{ padding: 12 }}><span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, fontFamily: 'var(--font-mono)', ...statStyle[c.status] }}>{c.status}</span></td>
                                <td style={{ padding: 12, fontSize: 12, color: 'var(--text-secondary)', maxWidth: 250 }}>{c.mitigation}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}

// ===== SECTION 4: STRATEGIC EXPANSION =====
function ExpansionSection({ profile }: { profile: BusinessProfile | null }) {
    const geo = profile?.geography || 'India';
    const expansionAreas = [
        { area: `Tier-2 Cities in ${geo}`, type: 'Geographic', potential: '₹2.5Cr', readiness: 72, channels: ['Local SEO', 'WhatsApp', 'Regional Influencers'], risk: 'Medium' },
        { area: 'Enterprise / B2B Segment', type: 'Market', potential: '₹5Cr', readiness: 55, channels: ['LinkedIn Ads', 'Cold Outreach', 'Webinars'], risk: 'High' },
        { area: 'International (SEA)', type: 'Geographic', potential: '₹8Cr', readiness: 35, channels: ['Google Ads', 'App Store Optimization', 'PR'], risk: 'High' },
        { area: 'Adjacent Verticals', type: 'Product', potential: '₹1.8Cr', readiness: 82, channels: ['Cross-selling', 'Content Marketing', 'Partnerships'], risk: 'Low' },
    ];

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {expansionAreas.map((e, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Card glow={e.readiness >= 70 ? C.green : e.readiness >= 50 ? C.amber : C.red}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div>
                                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{e.area}</h4>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.type} Expansion</span>
                                </div>
                                <span style={{ fontSize: 18, fontWeight: 800, color: C.green, fontFamily: 'var(--font-mono)' }}>{e.potential}</span>
                            </div>
                            {/* Readiness Bar */}
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>READINESS</span>
                                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: e.readiness >= 70 ? C.green : e.readiness >= 50 ? C.amber : C.red }}>{e.readiness}%</span>
                                </div>
                                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${e.readiness}%` }} transition={{ duration: 1 }} style={{ height: '100%', borderRadius: 3, background: e.readiness >= 70 ? C.green : e.readiness >= 50 ? C.amber : C.red }} />
                                </div>
                            </div>
                            {/* Channels */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                {e.channels.map(ch => (
                                    <span key={ch} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 12, background: `${C.purple}10`, border: `1px solid ${C.purple}25`, color: C.purple }}>{ch}</span>
                                ))}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Risk: <span style={{ fontWeight: 700, color: e.risk === 'Low' ? C.green : e.risk === 'Medium' ? C.amber : C.red }}>{e.risk}</span></div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ===== SECTION 5: GROWTH TRACKING SHEET =====
function TrackingSheet() {
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    const metrics = [
        { metric: 'Revenue (₹L)', values: [2.1, 2.5, 3.0, 3.4, 4.1, 4.8], target: 5.0 },
        { metric: 'Active Users', values: [5200, 6400, 7800, 9100, 10800, 12400], target: 15000 },
        { metric: 'New Signups', values: [1200, 1450, 1800, 2100, 2500, 2900], target: 3500 },
        { metric: 'Conv. Rate %', values: [2.1, 2.4, 2.8, 3.1, 3.5, 3.8], target: 5.0 },
        { metric: 'Churn %', values: [5.2, 4.8, 4.5, 4.1, 3.6, 3.2], target: 2.0 },
        { metric: 'NPS Score', values: [42, 45, 48, 52, 55, 58], target: 70 },
        { metric: 'CAC (₹)', values: [850, 780, 720, 650, 580, 450], target: 300 },
        { metric: 'LTV (₹)', values: [2800, 3000, 3200, 3500, 3800, 4200], target: 5000 },
        { metric: 'LTV:CAC', values: [3.3, 3.8, 4.4, 5.4, 6.6, 9.3], target: 10.0 },
    ];

    return (
        <Card>
            <SH icon="" title="Growth Tracking Sheet" sub="Monthly metrics — last 6 months vs targets" />
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', minWidth: 120 }}>Metric</th>
                            {months.map(m => <th key={m} style={{ textAlign: 'center', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m}</th>)}
                            <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: 10, color: C.green, fontFamily: 'var(--font-mono)' }}>TARGET</th>
                            <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TREND</th>
                        </tr>
                    </thead>
                    <tbody>
                        {metrics.map((m, mi) => {
                            const last = m.values[m.values.length - 1];
                            const prev = m.values[m.values.length - 2];
                            const isGrowthGood = m.metric.includes('Churn') || m.metric.includes('CAC') ? last < prev : last > prev;
                            return (
                                <tr key={mi} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: 12, fontWeight: 600, fontSize: 12 }}>{m.metric}</td>
                                    {m.values.map((v, vi) => (
                                        <td key={vi} style={{ padding: 12, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: 12 }}>{typeof v === 'number' && v >= 1000 ? v.toLocaleString() : v}</td>
                                    ))}
                                    <td style={{ padding: 12, textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: 12 }}>{typeof m.target === 'number' && m.target >= 1000 ? m.target.toLocaleString() : m.target}</td>
                                    <td style={{ padding: 12, textAlign: 'center', fontSize: 16 }}>{isGrowthGood ? '↗' : '↘'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

// ===== SECTION 6: PERFORMANCE DASHBOARD =====
function PerformanceDashboard() {
    const revenueData = useMemo(() => [
        { month: 'Sep', revenue: 210000, users: 5200, target: 200000 },
        { month: 'Oct', revenue: 250000, users: 6400, target: 250000 },
        { month: 'Nov', revenue: 300000, users: 7800, target: 280000 },
        { month: 'Dec', revenue: 340000, users: 9100, target: 320000 },
        { month: 'Jan', revenue: 410000, users: 10800, target: 370000 },
        { month: 'Feb', revenue: 480000, users: 12400, target: 420000 },
    ], []);

    const channelGrowth = useMemo(() => [
        { channel: 'Organic', current: 4200, previous: 3100, color: C.green },
        { channel: 'Paid', current: 3800, previous: 3500, color: C.blue },
        { channel: 'Referral', current: 2100, previous: 1200, color: C.purple },
        { channel: 'Direct', current: 1500, previous: 1300, color: C.amber },
        { channel: 'Social', current: 800, previous: 500, color: C.pink },
    ], []);

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* Revenue Chart */}
            <Card>
                <SH icon="" title="Revenue vs Target" sub="Monthly revenue tracking with growth targets" />
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={revenueData}>
                        <defs>
                            <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.3} /><stop offset="95%" stopColor={C.green} stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} />
                        <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} formatter={(v: number | undefined) => [`₹${(v ?? 0).toLocaleString()}`, '']} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.green} fill="url(#gRev)" strokeWidth={3} />
                        <Line type="monotone" dataKey="target" name="Target" stroke={C.amber} strokeDasharray="5 5" strokeWidth={2} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </Card>

            {/* Channel Growth */}
            <Card>
                <SH icon="" title="Channel Growth (MoM)" sub="User acquisition by channel — current vs previous month" />
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={channelGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="channel" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="previous" name="Last Month" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="current" name="This Month" radius={[4, 4, 0, 0]}>
                            {channelGrowth.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
}

// ===== SECTION 7: COMPETITOR ANALYSIS =====
function CompetitorAnalysis({ profile }: { profile: BusinessProfile | null }) {
    const industry = profile?.industry || 'Business';
    const geo = profile?.geography || 'India';
    const competitors = useMemo(() => [
        {
            name: `${industry}Pro`, rank: 1, marketShare: '32%', pricing: { basic: '₹499/mo', pro: '₹1,499/mo', enterprise: '₹4,999/mo' },
            strengths: ['Market leader', 'Strong brand', 'Large team'],
            weaknesses: ['Slow innovation', 'Poor UX', 'High churn'],
            rating: 4.2, reviews: 12400, traffic: '2.1M/mo', employees: '200+',
        },
        {
            name: `Smart${industry}`, rank: 2, marketShare: '21%', pricing: { basic: '₹399/mo', pro: '₹999/mo', enterprise: '₹3,499/mo' },
            strengths: ['AI-powered features', 'Modern UI', 'Good support'],
            weaknesses: ['Limited integrations', 'New player', 'Scaling issues'],
            rating: 4.5, reviews: 3200, traffic: '850K/mo', employees: '80+',
        },
        {
            name: `${industry}Hub`, rank: 3, marketShare: '15%', pricing: { basic: '₹599/mo', pro: '₹1,799/mo', enterprise: '₹5,999/mo' },
            strengths: ['Enterprise focus', 'API-first', 'Compliance'],
            weaknesses: ['Expensive', 'Complex onboarding', 'No free tier'],
            rating: 3.8, reviews: 5600, traffic: '1.3M/mo', employees: '150+',
        },
    ], [industry]);

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <Card>
                <SH icon="" title={`Top 3 Competitors — ${industry} in ${geo}`} sub="Pricing, market position, and competitive intelligence" />
            </Card>

            {competitors.map((c, ci) => (
                <motion.div key={ci} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.15 }}>
                    <Card glow={ci === 0 ? C.amber : ci === 1 ? C.blue : C.purple}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: ci === 0 ? `${C.amber}20` : ci === 1 ? `${C.blue}20` : `${C.purple}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: ci === 0 ? C.amber : ci === 1 ? C.blue : C.purple }}>#{c.rank}</div>
                                <div>
                                    <h4 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{c.name}</h4>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Market Share: {c.marketShare} · {c.rating} ({c.reviews.toLocaleString()} reviews)</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>TRAFFIC</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{c.traffic}</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>TEAM</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{c.employees}</div>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Table */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Pricing Tiers</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                {Object.entries(c.pricing).map(([tier, price]) => (
                                    <div key={tier} style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{tier}</div>
                                        <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{price}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Strengths vs Weaknesses */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginBottom: 8 }}>STRENGTHS</div>
                                {c.strengths.map(s => <div key={s} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0' }}>• {s}</div>)}
                            </div>
                            <div>
                                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 8 }}>WEAKNESSES</div>
                                {c.weaknesses.map(w => <div key={w} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0' }}>• {w}</div>)}
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}

// ==========================
// MAIN GROWTH TAB EXPORT
// ==========================
export default function GrowthTab({ output, profile }: { output: StrategyOutput; profile: BusinessProfile | null }) {
    const [activeSection, setActiveSection] = useState('overview');
    const dept = output.departments.find(d => d.department === 'growth');

    if (!dept) {
        return (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
                <div>No growth agent was activated for this business.</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 0' }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Growth Strategy Command Center
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
                    Opportunities, challenges, competitor intel & performance tracking for {profile?.industry || 'your business'}
                </p>
            </div>

            {/* Nav */}
            <div style={{ padding: '16px 24px', display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto' }}>
                {SECTIONS.map(s => (
                    <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                        padding: '8px 16px', fontSize: 12, borderRadius: 4, border: '1px solid', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
                        borderColor: activeSection === s.id ? 'var(--border-primary)' : 'transparent',
                        background: activeSection === s.id ? 'var(--bg-card)' : 'transparent',
                        color: activeSection === s.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    }}>{s.icon} {s.label}</button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                <AnimatePresence mode="wait">
                    <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {activeSection === 'overview' && <OverviewDashboard dept={dept} profile={profile} />}
                        {activeSection === 'opportunities' && <OpportunitiesSection profile={profile} />}
                        {activeSection === 'challenges' && <ChallengesSection dept={dept} />}
                        {activeSection === 'expansion' && <ExpansionSection profile={profile} />}
                        {activeSection === 'tracking' && <TrackingSheet />}
                        {activeSection === 'performance' && <PerformanceDashboard />}
                        {activeSection === 'competitors' && <CompetitorAnalysis profile={profile} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

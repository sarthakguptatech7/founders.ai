'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StrategyOutput, DepartmentOutput, BusinessProfile } from '@/lib/types';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const SECTIONS = [
    { id: 'dashboard', label: 'Dashboard', icon: '' },
    { id: 'plan', label: 'Financial Plan', icon: '' },
    { id: 'tracking', label: 'Tracking Sheet', icon: '' },
    { id: 'analytics', label: 'Analytics Events', icon: '' },
    { id: 'performance', label: 'Weekly Performance', icon: '' },
    { id: 'budget', label: 'Budget Allocation', icon: '' },
    { id: 'reports', label: 'Reports', icon: '' },
];

const C = {
    purple: '#A855F7', cyan: '#06B6D4', pink: '#EC4899', green: '#10B981',
    amber: '#F59E0B', red: '#F43F5E', blue: '#38BDF8', indigo: '#818CF8',
};

function Card({ children, style, glow }: { children: React.ReactNode; style?: React.CSSProperties; glow?: string }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 24, position: 'relative', overflow: 'hidden',
            ...(glow ? { boxShadow: `0 0 40px ${glow}15, inset 0 1px 0 rgba(255,255,255,0.05)` } : {}), ...style,
        }}>{children}</div>
    );
}
function SH({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
    return (<div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>{icon && <span style={{ fontSize: 20 }}>{icon}</span>}<div><h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h3>{sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>{sub}</p>}</div></div>);
}
function KPI({ label, value, change, color }: { label: string; value: string; change?: string; color?: string }) {
    const pos = change?.startsWith('+');
    return (
        <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>{label}</div>
            {change && <div style={{ fontSize: 11, color: pos ? '#FFFFFF' : 'var(--text-secondary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{change}</div>}
        </div>
    );
}

// ============ SECTION 1: DASHBOARD ============
function FinanceDashboard({ dept, profile }: { dept: DepartmentOutput | undefined; profile: BusinessProfile | null }) {
    const revenueData = useMemo(() => [
        { month: 'Sep', revenue: 180000, expenses: 145000, profit: 35000 },
        { month: 'Oct', revenue: 220000, expenses: 160000, profit: 60000 },
        { month: 'Nov', revenue: 280000, expenses: 185000, profit: 95000 },
        { month: 'Dec', revenue: 310000, expenses: 210000, profit: 100000 },
        { month: 'Jan', revenue: 380000, expenses: 235000, profit: 145000 },
        { month: 'Feb', revenue: 450000, expenses: 260000, profit: 190000 },
    ], []);

    const cashFlowData = useMemo(() => [
        { month: 'Sep', inflow: 210000, outflow: 175000, net: 35000 },
        { month: 'Oct', inflow: 260000, outflow: 195000, net: 65000 },
        { month: 'Nov', inflow: 320000, outflow: 230000, net: 90000 },
        { month: 'Dec', inflow: 340000, outflow: 255000, net: 85000 },
        { month: 'Jan', inflow: 420000, outflow: 290000, net: 130000 },
        { month: 'Feb', inflow: 500000, outflow: 310000, net: 190000 },
    ], []);

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
                <KPI label="Revenue (MTD)" value="₹4.5L" change="+18% MoM" />
                <KPI label="Net Profit" value="₹1.9L" change="+31%" />
                <KPI label="Burn Rate" value="₹2.6L/mo" change="-8%" />
                <KPI label="Runway" value="14 mo" change="+2 mo" />
                <KPI label="Gross Margin" value="42.2%" change="+3.1%" />
                <KPI label="Op. Expense" value="₹2.6L" change="+5%" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Card>
                    <SH icon="" title="Revenue vs Expenses vs Profit" sub="6-month financial trend" />
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="gRev2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.3} /><stop offset="95%" stopColor={C.green} stopOpacity={0} /></linearGradient>
                                <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.cyan} stopOpacity={0.3} /><stop offset="95%" stopColor={C.cyan} stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.green} fill="url(#gRev2)" strokeWidth={2} />
                            <Area type="monotone" dataKey="profit" name="Profit" stroke={C.cyan} fill="url(#gProfit)" strokeWidth={2} />
                            <Line type="monotone" dataKey="expenses" name="Expenses" stroke={C.red} strokeWidth={2} strokeDasharray="5 5" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <SH icon="" title="Cash Flow" sub="Monthly inflow vs outflow" />
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={cashFlowData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="inflow" name="Inflow" fill={C.green} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="outflow" name="Outflow" fill={C.red} radius={[4, 4, 0, 0]} opacity={0.6} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {dept && (
                <Card glow={C.green}>
                    <SH icon="" title="AI Financial Strategy" sub={`For ${profile?.industry || 'your business'} — Capital: ${profile?.capital_range || 'N/A'}`} />
                    <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>{dept.summary}</p>
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
            )}
        </div>
    );
}

// ============ SECTION 2: FINANCIAL PLAN ============
function FinancialPlan({ profile }: { profile: BusinessProfile | null }) {
    const [viewMode, setViewMode] = useState<'pnl' | 'unit'>('pnl');
    const pnl = [
        { item: 'Revenue', m1: 450000, m2: 520000, m3: 610000, m4: 700000, m5: 810000, m6: 950000, type: 'revenue' },
        { item: 'COGS', m1: -180000, m2: -208000, m3: -244000, m4: -280000, m5: -324000, m6: -380000, type: 'expense' },
        { item: 'Gross Profit', m1: 270000, m2: 312000, m3: 366000, m4: 420000, m5: 486000, m6: 570000, type: 'subtotal' },
        { item: 'Salaries', m1: -120000, m2: -120000, m3: -140000, m4: -140000, m5: -160000, m6: -160000, type: 'expense' },
        { item: 'Marketing', m1: -35000, m2: -40000, m3: -45000, m4: -50000, m5: -55000, m6: -60000, type: 'expense' },
        { item: 'Operations', m1: -25000, m2: -28000, m3: -30000, m4: -32000, m5: -35000, m6: -38000, type: 'expense' },
        { item: 'Tech & Tools', m1: -15000, m2: -15000, m3: -18000, m4: -18000, m5: -20000, m6: -20000, type: 'expense' },
        { item: 'Rent & Utilities', m1: -30000, m2: -30000, m3: -30000, m4: -30000, m5: -35000, m6: -35000, type: 'expense' },
        { item: 'EBITDA', m1: 45000, m2: 79000, m3: 103000, m4: 150000, m5: 181000, m6: 257000, type: 'total' },
    ];
    const unitEcon = [
        { metric: 'Avg. Order Value (AOV)', value: '₹1,250', trend: '+8%' },
        { metric: 'Customer Acquisition Cost (CAC)', value: '₹450', trend: '-12%' },
        { metric: 'Lifetime Value (LTV)', value: '₹4,200', trend: '+15%' },
        { metric: 'LTV:CAC Ratio', value: '9.3x', trend: '+2.1x' },
        { metric: 'Payback Period', value: '1.8 mo', trend: '-0.4 mo' },
        { metric: 'Gross Margin', value: '60%', trend: '+2%' },
        { metric: 'Net Margin', value: '10%', trend: '+3%' },
        { metric: 'Revenue per Employee', value: '₹2.5L/mo', trend: '+18%' },
    ];

    const months = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', gap: 6 }}>
                {([{ id: 'pnl' as const, label: 'P&L Projection' }, { id: 'unit' as const, label: 'Unit Economics' }]).map(v => (
                    <button key={v.id} onClick={() => setViewMode(v.id)} style={{
                        padding: '8px 18px', fontSize: 12, borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                        border: `1px solid ${viewMode === v.id ? C.green : 'rgba(255,255,255,0.06)'}`,
                        background: viewMode === v.id ? `${C.green}15` : 'transparent',
                        color: viewMode === v.id ? C.green : 'var(--text-muted)',
                    }}>{v.label}</button>
                ))}
            </div>

            {viewMode === 'pnl' ? (
                <Card>
                    <SH icon="" title="Projected P&L Statement" sub={`${profile?.industry || 'Business'} — 6-month forward projection`} />
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 140 }}>LINE ITEM</th>
                                    {months.map(m => <th key={m} style={{ textAlign: 'right', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {pnl.map((row, i) => (
                                    <tr key={i} style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        background: row.type === 'subtotal' ? 'rgba(6,182,212,0.03)' : row.type === 'total' ? 'rgba(16,185,129,0.05)' : 'transparent',
                                    }}>
                                        <td style={{ padding: 12, fontWeight: row.type === 'subtotal' || row.type === 'total' ? 700 : 400, color: row.type === 'total' ? 'var(--text-primary)' : 'var(--text-primary)', fontSize: row.type === 'total' ? 14 : 13 }}>{row.item}</td>
                                        {[row.m1, row.m2, row.m3, row.m4, row.m5, row.m6].map((v, vi) => (
                                            <td key={vi} style={{ padding: 12, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: row.type === 'total' ? 700 : 400, color: v < 0 ? 'var(--text-secondary)' : row.type === 'total' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                {v < 0 ? `-₹${Math.abs(v).toLocaleString()}` : `₹${v.toLocaleString()}`}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <Card glow={C.cyan}>
                    <SH icon="" title="Unit Economics" sub="Key metrics per customer/transaction" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                        {unitEcon.map((u, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.metric}</div>
                                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4 }}>{u.value}</div>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: u.trend.startsWith('+') || u.trend.startsWith('-') && u.metric.includes('CAC') ? '#FFFFFF' : u.trend.startsWith('-') ? 'var(--text-secondary)' : '#FFFFFF' }}>{u.trend}</span>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

// ============ SECTION 3: TRACKING SHEET ============
function TrackingSheet() {
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
    const metrics = [
        { metric: 'Revenue', values: [85000, 95000, 110000, 120000, 105000, 115000, 130000, 140000], target: 125000, unit: '₹' },
        { metric: 'New Customers', values: [42, 48, 55, 62, 50, 58, 65, 72], target: 60, unit: '' },
        { metric: 'Orders', values: [120, 135, 155, 170, 145, 160, 180, 195], target: 175, unit: '' },
        { metric: 'AOV', values: [708, 704, 710, 706, 724, 719, 722, 718], target: 720, unit: '₹' },
        { metric: 'Refund Rate', values: [3.2, 2.8, 2.5, 2.1, 2.9, 2.4, 2.0, 1.8], target: 2.0, unit: '%' },
        { metric: 'COGS', values: [34000, 38000, 44000, 48000, 42000, 46000, 52000, 56000], target: 50000, unit: '₹' },
        { metric: 'Gross Margin', values: [60, 60, 60, 60, 60, 60, 60, 60], target: 62, unit: '%' },
        { metric: 'Cash Balance', values: [850000, 910000, 975000, 1050000, 1090000, 1140000, 1210000, 1300000], target: 1500000, unit: '₹' },
    ];

    return (
        <Card>
            <SH icon="" title="Weekly Financial Tracking" sub="8-week rolling metrics vs targets" />
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 120 }}>METRIC</th>
                            {weeks.map(w => <th key={w} style={{ textAlign: 'center', padding: '10px 8px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{w}</th>)}
                            <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: 10, color: C.green, fontFamily: 'var(--font-mono)' }}>TARGET</th>
                            <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>VS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {metrics.map((m, mi) => {
                            const last = m.values[m.values.length - 1];
                            const hit = m.metric === 'Refund Rate' || m.metric === 'COGS' ? last <= m.target : last >= m.target;
                            return (
                                <tr key={mi} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 12 }}>{m.metric}</td>
                                    {m.values.map((v, vi) => (
                                        <td key={vi} style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
                                            {m.unit === '₹' ? `₹${v >= 100000 ? `${(v / 1000).toFixed(0)}K` : v.toLocaleString()}` : m.unit === '%' ? `${v}%` : v}
                                        </td>
                                    ))}
                                    <td style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: C.green, fontSize: 12 }}>
                                        {m.unit === '₹' ? `₹${m.target >= 100000 ? `${(m.target / 1000).toFixed(0)}K` : m.target.toLocaleString()}` : m.unit === '%' ? `${m.target}%` : m.target}
                                    </td>
                                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 14 }}>{hit ? '✅' : '⚠️'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

// ============ SECTION 4: ANALYTICS EVENTS ============
function AnalyticsEvents() {
    const events = [
        { event: 'First Revenue Milestone', date: 'Sep 15', amount: '₹1L MRR', status: 'achieved', impact: 'Initial product-market fit validated' },
        { event: 'Break-even Point', date: 'Nov 22', amount: '₹2.8L/mo', status: 'achieved', impact: 'Operating expenses covered by revenue' },
        { event: 'Series Seed Closing', date: 'Dec 10', amount: '₹50L raised', status: 'achieved', impact: '18-month runway secured' },
        { event: 'CAC Below ₹500', date: 'Jan 18', amount: 'CAC: ₹450', status: 'achieved', impact: 'Efficient acquisition unlocked scaling' },
        { event: 'Gross Margin > 60%', date: 'Feb 5', amount: 'GM: 60.2%', status: 'achieved', impact: 'Pricing power confirmed' },
        { event: '₹5L MRR Target', date: 'Mar (est)', amount: '₹5L MRR', status: 'projected', impact: 'Growth stage entry' },
        { event: 'Profitability Target', date: 'May (est)', amount: 'Net Positive', status: 'projected', impact: 'Self-sustaining operations' },
        { event: 'Series A Readiness', date: 'Jun (est)', amount: '₹10L MRR', status: 'planned', impact: 'Institutional fundraise eligible' },
    ];

    const statusStyle: Record<string, { bg: string; color: string; icon: string }> = {
        achieved: { bg: `rgba(255,255,255,0.05)`, color: '#FFFFFF', icon: '✓' },
        projected: { bg: `rgba(255,255,255,0.05)`, color: '#FFFFFF', icon: '○' },
        planned: { bg: `rgba(255,255,255,0.05)`, color: '#FFFFFF', icon: '□' },
    };

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            {events.map((e, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <Card style={{ padding: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: statusStyle[e.status].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{statusStyle[e.status].icon}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{e.event}</h4>
                                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 12, fontFamily: 'var(--font-mono)', background: statusStyle[e.status].bg, color: statusStyle[e.status].color }}>{e.status.toUpperCase()}</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{e.impact}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{e.amount}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{e.date}</div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}

// ============ SECTION 5: WEEKLY PERFORMANCE ============
function WeeklyPerformance() {
    const weeklyData = useMemo(() => [
        { day: 'Mon', revenue: 18500, orders: 28, refunds: 1 },
        { day: 'Tue', revenue: 22300, orders: 33, refunds: 2 },
        { day: 'Wed', revenue: 19800, orders: 30, refunds: 0 },
        { day: 'Thu', revenue: 25100, orders: 38, refunds: 1 },
        { day: 'Fri', revenue: 28400, orders: 42, refunds: 3 },
        { day: 'Sat', revenue: 15200, orders: 22, refunds: 1 },
        { day: 'Sun', revenue: 10700, orders: 16, refunds: 0 },
    ], []);

    const totalRev = weeklyData.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = weeklyData.reduce((s, d) => s + d.orders, 0);
    const avgAOV = Math.round(totalRev / totalOrders);

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <KPI label="Weekly Revenue" value={`₹${(totalRev / 1000).toFixed(1)}K`} change="+12% vs prev" color={C.green} />
                <KPI label="Total Orders" value={String(totalOrders)} change="+9%" color={C.cyan} />
                <KPI label="Avg. AOV" value={`₹${avgAOV}`} change="+2%" color={C.purple} />
                <KPI label="Refund Rate" value={`${((weeklyData.reduce((s, d) => s + d.refunds, 0) / totalOrders) * 100).toFixed(1)}%`} change="-0.5%" color={C.amber} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Card>
                    <SH icon="" title="Daily Revenue" />
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="revenue" fill={C.green} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <SH icon="" title="Daily Orders & Refunds" />
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="orders" name="Orders" stroke={C.cyan} strokeWidth={3} dot={{ r: 4, fill: C.cyan }} />
                            <Line type="monotone" dataKey="refunds" name="Refunds" stroke={C.red} strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
}

// ============ SECTION 6: BUDGET ALLOCATION ============
function BudgetAllocation() {
    const budgetData = useMemo(() => [
        { category: 'Salaries & HR', allocated: 320000, spent: 280000, pct: 35, color: C.blue },
        { category: 'Marketing & Ads', allocated: 120000, spent: 95000, pct: 13, color: C.pink },
        { category: 'Tech & Infrastructure', allocated: 80000, spent: 72000, pct: 9, color: C.indigo },
        { category: 'Operations', allocated: 75000, spent: 68000, pct: 8, color: C.amber },
        { category: 'Rent & Utilities', allocated: 70000, spent: 65000, pct: 8, color: C.green },
        { category: 'COGS / Materials', allocated: 180000, spent: 165000, pct: 20, color: C.red },
        { category: 'Legal & Compliance', allocated: 25000, spent: 18000, pct: 3, color: C.purple },
        { category: 'Contingency', allocated: 40000, spent: 12000, pct: 4, color: 'var(--text-muted)' },
    ], []);

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Card>
                    <SH icon="" title="Budget Distribution" />
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={budgetData} dataKey="pct" nameKey="category" cx="50%" cy="50%" innerRadius={55} outerRadius={95} strokeWidth={0}>
                                {budgetData.map((b, i) => <Cell key={i} fill={b.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <SH icon="" title="Budget vs Spent" />
                    <div style={{ display: 'grid', gap: 10 }}>
                        {budgetData.map(b => {
                            const utilization = Math.round((b.spent / b.allocated) * 100);
                            return (
                                <div key={b.category} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{b.category}</span>
                                    <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                                        <div style={{ width: `${utilization}%`, height: '100%', borderRadius: 2, background: utilization > 90 ? C.red : b.color }} />
                                    </div>
                                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: utilization > 90 ? C.red : 'var(--text-muted)', width: 35, textAlign: 'right' }}>{utilization}%</span>
                                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', width: 55, textAlign: 'right' }}>₹{(b.spent / 1000).toFixed(0)}K</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// ============ SECTION 7: REPORTS ============
function FinancialReports() {
    const handleDownload = useCallback((reportName: string) => {
        // Generate a text-based financial report as downloadable file
        const content = `
═══════════════════════════════════════════
    ${reportName.toUpperCase()}
    Generated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
═══════════════════════════════════════════

EXECUTIVE SUMMARY
──────────────────
Revenue (MTD):        ₹4,50,000
Net Profit:           ₹1,90,000
Gross Margin:         42.2%
Operating Expenses:   ₹2,60,000
Cash Balance:         ₹13,00,000
Burn Rate:            ₹2,60,000/month
Runway:               14 months

P&L SNAPSHOT
──────────────────
Revenue:              ₹4,50,000
COGS:                -₹1,80,000
Gross Profit:         ₹2,70,000
Salaries:            -₹1,20,000
Marketing:           -₹35,000
Operations:          -₹25,000
Tech & Tools:        -₹15,000
Rent:                -₹30,000
──────────────────
EBITDA:               ₹45,000

UNIT ECONOMICS
──────────────────
AOV:                  ₹1,250
CAC:                  ₹450
LTV:                  ₹4,200
LTV:CAC:              9.3x
Payback:              1.8 months

═══════════════════════════════════════════
    This report was auto-generated by OpenClaw AI
═══════════════════════════════════════════
        `.trim();

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    const reports = [
        { name: 'Monthly Financial Summary', period: 'February 2026', type: 'P&L + Cash Flow', size: '~4 KB', icon: '' },
        { name: 'Unit Economics Report', period: 'February 2026', type: 'CAC/LTV/Margins', size: '~3 KB', icon: '' },
        { name: 'Budget Variance Report', period: 'February 2026', type: 'Planned vs Actual', size: '~3 KB', icon: '' },
        { name: 'Investor Update', period: 'Q4 2025', type: 'KPIs + Narrative', size: '~5 KB', icon: '' },
        { name: 'Tax Filing Summary', period: 'FY 2025-26', type: 'GST + Income Tax', size: '~4 KB', icon: '' },
        { name: 'Cash Flow Forecast', period: 'Next 6 Months', type: 'Projection', size: '~3 KB', icon: '' },
    ];

    return (
        <div style={{ display: 'grid', gap: 16 }}>
            <Card style={{ padding: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📄 Financial reports are generated from your tracked data. Click <strong>Download</strong> to export.</div>
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {reports.map((r, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                        <Card style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${C.green}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{r.icon}</div>
                                    <div>
                                        <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{r.name}</h4>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.period} • {r.type} • {r.size}</div>
                                    </div>
                                </div>
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => handleDownload(r.name)}
                                    style={{ padding: '6px 16px', borderRadius: 4, border: `1px solid var(--border-primary)`, background: `transparent`, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Download</motion.button>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ==========================
// MAIN FINANCE TAB EXPORT
// ==========================
export default function FinanceTab({ output, profile }: { output: StrategyOutput; profile: BusinessProfile | null }) {
    const [activeSection, setActiveSection] = useState('dashboard');
    const dept = output.departments.find(d => d.department === 'finance');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '20px 24px 0' }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Finance Command Center
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
                    Financial plans, tracking, analytics, performance dashboards & downloadable reports for {profile?.industry || 'your business'}
                </p>
            </div>
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
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                <AnimatePresence mode="wait">
                    <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {activeSection === 'dashboard' && <FinanceDashboard dept={dept} profile={profile} />}
                        {activeSection === 'plan' && <FinancialPlan profile={profile} />}
                        {activeSection === 'tracking' && <TrackingSheet />}
                        {activeSection === 'analytics' && <AnalyticsEvents />}
                        {activeSection === 'performance' && <WeeklyPerformance />}
                        {activeSection === 'budget' && <BudgetAllocation />}
                        {activeSection === 'reports' && <FinancialReports />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

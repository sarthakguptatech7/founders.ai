'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StrategyOutput, BusinessProfile } from '@/lib/types';

const C = {
    purple: '#A855F7', cyan: '#06B6D4', pink: '#EC4899', green: '#10B981',
    amber: '#F59E0B', red: '#F43F5E', blue: '#38BDF8', indigo: '#818CF8',
};

const SECTIONS = [
    { id: 'radar', label: 'Investor Radar', icon: '' },
    { id: 'pitch', label: 'Pitch Deck', icon: '' },
    { id: 'outreach', label: 'Outreach', icon: '' },
    { id: 'negotiate', label: 'Negotiate', icon: '' },
    { id: 'deal_room', label: 'Deal Room', icon: '' },
];

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

// ===== TYPES =====
interface Investor { id: string; name: string; firm: string; type: string; stage_focus: string[]; sector_focus: string[]; check_size: string; portfolio_companies: string[]; location: string; match_score: number; status: string; contact_method: string; notes: string; }
interface Slide { title: string; content: string; type: string; }
interface Outreach { id: string; investor_id: string; investor_name: string; type: string; subject: string; status: string; sent_at: string; response?: string; }
interface NegTerm { term: string; proposed_value: string; market_benchmark: string; ai_recommendation: string; favorability: string; }

// ===== INVESTOR RADAR =====
function InvestorRadar({ investors }: { investors: Investor[] }) {
    const typeColor: Record<string, string> = { angel: C.amber, vc: C.blue, pe: C.purple, corporate: C.indigo, family_office: C.green };
    const statusLabel: Record<string, { bg: string; color: string }> = {
        identified: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' },
        researched: { bg: 'rgba(255,255,255,0.05)', color: '#FFFFFF' },
        outreach_sent: { bg: 'rgba(255,255,255,0.05)', color: '#A1A1AA' },
        meeting_scheduled: { bg: 'rgba(255,255,255,0.05)', color: '#FFFFFF' },
        in_negotiation: { bg: 'rgba(255,255,255,0.05)', color: '#FFFFFF' },
        term_sheet: { bg: 'rgba(255,255,255,0.05)', color: '#FFFFFF' },
        passed: { bg: 'rgba(255,255,255,0.05)', color: '#FFFFFF' },
    };

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            {investors.map((inv, i) => (
                <motion.div key={inv.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${typeColor[inv.type] || C.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>

                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{inv.name}</h4>
                                        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 12, fontFamily: 'var(--font-mono)', ...(statusLabel[inv.status] || statusLabel.identified) }}>{(inv.status || 'identified').replace(/_/g, ' ').toUpperCase()}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{inv.firm} · {inv.location}</div>
                                    <div style={{ display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Check:</span> <span style={{ fontWeight: 600, color: C.green }}>{inv.check_size}</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Focus:</span> <span style={{ fontWeight: 600 }}>{(inv.sector_focus || []).join(', ')}</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Via:</span> <span style={{ fontWeight: 600, color: C.cyan }}>{inv.contact_method}</span></div>
                                    </div>
                                    {inv.notes && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{inv.notes}</div>}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color: inv.match_score >= 0.85 ? C.green : inv.match_score >= 0.7 ? C.amber : C.red }}>{Math.round((inv.match_score || 0) * 100)}%</div>
                                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>MATCH</div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}

// ===== PITCH DECK =====
function PitchDeck({ slides }: { slides: Slide[] }) {
    const [active, setActive] = useState(0);
    const typeColor: Record<string, string> = { cover: C.purple, problem: C.red, solution: C.green, market: C.blue, traction: C.cyan, business_model: C.amber, team: C.pink, financials: C.green, ask: C.indigo, closing: C.purple };
    if (!slides.length) return null;
    const s = slides[active] || slides[0];

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {slides.map((sl, i) => (
                    <button key={i} onClick={() => setActive(i)} style={{
                        padding: '6px 14px', fontSize: 11, borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                        border: `1px solid ${active === i ? (typeColor[sl.type] || C.blue) : 'rgba(255,255,255,0.06)'}`,
                        background: active === i ? `${typeColor[sl.type] || C.blue}15` : 'transparent',
                        color: active === i ? (typeColor[sl.type] || C.blue) : 'var(--text-muted)',
                    }}>{i + 1}. {sl.type?.replace(/_/g, ' ').toUpperCase()}</button>
                ))}
            </div>
            <Card glow={typeColor[s.type] || C.blue}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${typeColor[s.type] || C.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: typeColor[s.type] || C.blue }}>{active + 1}</div>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{s.title}</h3>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: typeColor[s.type] || C.blue }}>{(s.type || '').replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{s.content}</div>
            </Card>
        </div>
    );
}

// ===== OUTREACH PIPELINE =====
function OutreachPipeline({ outreach }: { outreach: Outreach[] }) {
    const statusColor: Record<string, string> = { drafted: 'var(--text-muted)', sent: '#FFFFFF', opened: '#A1A1AA', replied: '#FFFFFF', meeting_set: '#FFFFFF' };
    const typeIcon: Record<string, string> = { email: '', linkedin: '', warm_intro: '', meeting_scheduled: '', followup: '' };

    return (
        <div style={{ display: 'grid', gap: 10 }}>
            {outreach.map((o, i) => (
                <motion.div key={o.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 22, flexShrink: 0 }}>{typeIcon[o.type] || ''}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700 }}>{o.investor_name}</span>
                                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 12, fontFamily: 'var(--font-mono)', background: `${statusColor[o.status] || C.blue}15`, color: statusColor[o.status] || C.blue }}>{(o.status || '').replace(/_/g, ' ').toUpperCase()}</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.subject}</div>
                                {o.response && <div style={{ fontSize: 11, color: C.green, marginTop: 4, paddingLeft: 12, borderLeft: `2px solid ${C.green}40` }}>{o.response}</div>}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{o.type?.replace(/_/g, ' ').toUpperCase()}</div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}

// ===== NEGOTIATION SIMULATOR =====
function NegotiationSimulator({ terms }: { terms: NegTerm[] }) {
    const favColor: Record<string, string> = { favorable: C.green, neutral: C.amber, unfavorable: C.red };

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            <Card glow={C.purple}>
                <SH icon="" title="AI Negotiation Simulator" sub="Term sheet analysis with market benchmarks and AI recommendations" />
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {['Term', 'Proposed', 'Market Benchmark', 'AI Recommendation', 'Rating'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {terms.map((t, i) => (
                            <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: 12, fontWeight: 600 }}>{t.term}</td>
                                <td style={{ padding: 12, fontFamily: 'var(--font-mono)', color: C.cyan }}>{t.proposed_value}</td>
                                <td style={{ padding: 12, fontSize: 12, color: 'var(--text-secondary)' }}>{t.market_benchmark}</td>
                                <td style={{ padding: 12, fontSize: 12, color: 'var(--text-secondary)' }}>{t.ai_recommendation}</td>
                                <td style={{ padding: 12 }}>
                                    <span style={{ fontSize: 9, padding: '3px 10px', borderRadius: 12, fontFamily: 'var(--font-mono)', background: `${favColor[t.favorability] || C.amber}15`, color: favColor[t.favorability] || C.amber }}>
                                        {(t.favorability || 'neutral').toUpperCase()}
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}

// ===== DEAL ROOM DASHBOARD =====
function DealRoom({ investors, outreach, meetings }: { investors: Investor[]; outreach: Outreach[]; meetings: number }) {
    const stages = [
        { label: 'Identified', count: investors.filter(i => i.status === 'identified').length, color: 'var(--text-muted)' },
        { label: 'Researched', count: investors.filter(i => i.status === 'researched').length, color: C.blue },
        { label: 'Outreach Sent', count: investors.filter(i => i.status === 'outreach_sent').length, color: C.amber },
        { label: 'Meeting Set', count: investors.filter(i => i.status === 'meeting_scheduled').length, color: C.green },
        { label: 'Negotiating', count: investors.filter(i => i.status === 'in_negotiation').length, color: C.purple },
        { label: 'Term Sheet', count: investors.filter(i => i.status === 'term_sheet').length, color: C.pink },
    ];
    const total = investors.length || 1;

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <Card glow={C.indigo}>
                <SH icon="" title="Fundraising Pipeline" sub="Investor journey from identification to term sheet" />
                <div style={{ display: 'flex', gap: 4, height: 32, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                    {stages.map((s, i) => (
                        <motion.div key={i} initial={{ width: 0 }} animate={{ width: `${(s.count / total) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                            style={{ background: s.color, minWidth: s.count > 0 ? 20 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {s.count > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#000' }}>{s.count}</span>}
                        </motion.div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {stages.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                            <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.color }}>{s.count}</span>
                        </div>
                    ))}
                </div>
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <Card>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Total Investors</div>
                    <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.blue }}>{investors.length}</div>
                </Card>
                <Card>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Outreach Sent</div>
                    <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.amber }}>{outreach.length}</div>
                </Card>
                <Card>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Meetings Set</div>
                    <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.green }}>{meetings}</div>
                </Card>
            </div>
        </div>
    );
}

// ==========================
// MAIN FUNDRAISING TAB
// ==========================
export default function FundraisingTab({ output, profile }: { output: StrategyOutput; profile: BusinessProfile | null }) {
    const [activeSection, setActiveSection] = useState('deal_room');
    const [loading, setLoading] = useState(false);
    const [activated, setActivated] = useState(false);
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [slides, setSlides] = useState<Slide[]>([]);
    const [outreach, setOutreach] = useState<Outreach[]>([]);
    const [negotiations, setNegotiations] = useState<NegTerm[]>([]);
    const [roundTarget, setRoundTarget] = useState('');
    const [valuation, setValuation] = useState('');
    const [pipeline, setPipeline] = useState('');
    const [meetings, setMeetings] = useState(0);

    const runAgent = useCallback(async () => {
        setLoading(true);
        try {
            const ctx = `Industry: ${profile?.industry || 'Technology'}. Stage: ${profile?.business_stage || 'early'}. Geography: ${profile?.geography || 'India'}. Capital range: ${profile?.capital_range || '$100K-$500K'}. Scale: ${profile?.scale || 0.5}. Growth intent: ${profile?.growth_intent || 0.8}. Summary: ${profile?.summary || output.executive_summary || 'AI-powered business automation platform'}`;
            const res = await fetch('/api/fundraising', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ business_context: ctx }) });
            const data = await res.json();
            if (data.investors) setInvestors(data.investors);
            if (data.pitch_deck) setSlides(data.pitch_deck);
            if (data.outreach) setOutreach(data.outreach);
            if (data.negotiations) setNegotiations(data.negotiations);
            if (data.round_target) setRoundTarget(data.round_target);
            if (data.valuation_estimate) setValuation(data.valuation_estimate);
            if (data.pipeline_value) setPipeline(data.pipeline_value);
            if (data.meetings_scheduled) setMeetings(data.meetings_scheduled);
            setActivated(true);
        } catch (e) { console.error('Fundraising agent failed:', e); }
        setLoading(false);
    }, [profile, output]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '20px 24px 0' }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Fundraising & Investor Relations
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
                    Autonomous investor identification, pitch deck generation, outreach & negotiation for {profile?.industry || 'your business'}
                </p>
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto', alignItems: 'center' }}>
                {SECTIONS.map(s => (
                    <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                        padding: '8px 16px', fontSize: 12, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
                        background: activeSection === s.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                        color: activeSection === s.id ? C.purple : 'var(--text-tertiary)',
                    }}>{s.icon} {s.label}</button>
                ))}
                <div style={{ flex: 1 }} />
                <motion.button
                    onClick={runAgent} disabled={loading}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#fff', color: '#000', fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'var(--font-mono)' }}
                >
                    {loading ? 'Running Agent...' : activated ? 'Re-Run Agent' : 'Activate Fundraising Agent'}
                </motion.button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                <AnimatePresence mode="wait">
                    <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {!activated && !loading ? (
                            <Card glow={C.purple}>
                                <div style={{ textAlign: 'center', padding: 48 }}>
                                    <div style={{ fontSize: 56, marginBottom: 16 }}></div>
                                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Autonomous Fundraising Agent</h3>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 24px' }}>
                                        Activate the agent to autonomously identify investors, generate a customized pitch deck, draft outreach emails, and simulate term sheet negotiations — all tailored to your business profile.
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 600, margin: '0 auto' }}>
                                        {[
                                            { icon: '', label: 'Identify Investors' },
                                            { icon: '', label: 'Generate Deck' },
                                            { icon: '', label: 'Draft Outreach' },
                                            { icon: '', label: 'Simulate Terms' },
                                        ].map((f, i) => (
                                            <div key={i} style={{ padding: '16px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
                                                <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{f.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        ) : loading ? (
                            <Card>
                                <div style={{ textAlign: 'center', padding: 48 }}>
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ width: 48, height: 48, border: '3px solid rgba(255,255,255,0.08)', borderTopColor: C.purple, borderRadius: '50%', margin: '0 auto 16px' }} />
                                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Agent scanning investor networks, building deck, drafting outreach...</div>
                                </div>
                            </Card>
                        ) : (
                            <>
                                {activeSection === 'deal_room' && (
                                    <div style={{ display: 'grid', gap: 20 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                            <Card glow={C.green}>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Round Target</div>
                                                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.green }}>{roundTarget || 'N/A'}</div>
                                            </Card>
                                            <Card glow={C.blue}>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Valuation Estimate</div>
                                                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.blue }}>{valuation || 'N/A'}</div>
                                            </Card>
                                            <Card glow={C.purple}>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Pipeline Value</div>
                                                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.purple }}>{pipeline || 'N/A'}</div>
                                            </Card>
                                        </div>
                                        <DealRoom investors={investors} outreach={outreach} meetings={meetings} />
                                    </div>
                                )}
                                {activeSection === 'radar' && <InvestorRadar investors={investors} />}
                                {activeSection === 'pitch' && <PitchDeck slides={slides} />}
                                {activeSection === 'outreach' && <OutreachPipeline outreach={outreach} />}
                                {activeSection === 'negotiate' && <NegotiationSimulator terms={negotiations} />}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StrategyOutput, DepartmentOutput, BusinessProfile } from '@/lib/types';

interface BrandIdea {
    name: string;
    rationale: string;
    logoPrompt: string;
}

const SECTIONS = [
    { id: 'brand', label: 'Brand Studio', icon: '' },
    { id: 'timeline', label: 'Launch Timeline', icon: '' },
    { id: 'checklist', label: 'Go-To-Market', icon: '' },
];

const C = {
    purple: '#A855F7', cyan: '#06B6D4', pink: '#EC4899', green: '#10B981',
    amber: '#F59E0B', red: '#F43F5E', blue: '#38BDF8', indigo: '#818CF8',
};

function Card({ children, style, glow }: { children: React.ReactNode; style?: React.CSSProperties; glow?: string }) {
    return (
        <div style={{
            background: 'var(--bg-glass)', border: '1px solid var(--border-primary)',
            borderRadius: 12, padding: 24, position: 'relative', overflow: 'hidden',
            ...(glow ? { boxShadow: `0 0 40px ${glow}15, inset 0 1px 0 rgba(255,255,255,0.05)` } : {}), ...style,
        }}>{children}</div>
    );
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
    return (
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
            <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{title}</h3>
                {subtitle && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 4 }}>{subtitle}</p>}
            </div>
        </div>
    );
}

// ============ SECTION 1: BRAND STUDIO ============
function BrandStudio({ profile }: { profile: BusinessProfile | null }) {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [brands, setBrands] = useState<BrandIdea[]>([]);
    const [error, setError] = useState<string | null>(null);

    const generateBrands = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const res = await fetch('/api/brand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile, prompt }),
            });

            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
            if (data.brands && Array.isArray(data.brands)) {
                setBrands(data.brands);
            } else {
                throw new Error('Invalid response format from AI');
            }
        } catch (err: any) {
            console.error('Brand Gen Error:', err);
            setError(err.message || 'Failed to generate brands. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <Card glow={C.cyan}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>AI Brand Identity Generator</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Need a name and logo for {profile?.industry || 'your new business'}? Let Gemini 2.5 Pro brainstorm stunning options.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <input
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Optional: Enter a specific vibe, keyword, or color scheme (e.g. 'Cyberpunk neon colors, minimalist vibe')"
                        style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 14, outline: 'none' }}
                        onKeyDown={e => e.key === 'Enter' && generateBrands()}
                    />
                    <button
                        onClick={generateBrands}
                        disabled={isGenerating}
                        style={{ padding: '0 24px', borderRadius: 4, border: '1px solid var(--border-primary)', background: '#fff', color: '#000', fontSize: 14, fontWeight: 600, cursor: isGenerating ? 'wait' : 'pointer', opacity: isGenerating ? 0.7 : 1 }}
                    >
                        {isGenerating ? 'Brainstorming...' : 'Generate Brands'}
                    </button>
                </div>
                {error && <div style={{ color: C.red, fontSize: 13, marginTop: 12 }}>{error}</div>}
            </Card>

            {brands.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    {brands.map((b, i) => {
                        const encodedPrompt = encodeURIComponent(b.logoPrompt + ', no typography, completely textless design');
                        const imgUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

                        return (
                            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                                <Card style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    {/* Logo Image */}
                                    <div style={{ width: '100%', aspectRatio: '1/1', background: '#0a0a0a', position: 'relative' }}>
                                        <img src={imgUrl} alt={`${b.name} Logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: 20, backdropFilter: 'blur(10px)', fontSize: 11, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>OPTION {i + 1}</div>
                                    </div>
                                    {/* Brand Details */}
                                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <h4 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px', color: '#fff', letterSpacing: -0.5 }}>{b.name}</h4>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, flex: 1 }}>{b.rationale}</p>

                                        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                                            <button style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Select Name</button>
                                            <a href={imgUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 16, textDecoration: 'none' }}>⬇</a>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ============ SECTION 2: LAUNCH TIMELINE ============
function LaunchTimeline() {
    const phases = [
        { phase: '01: Foundation', duration: 'Weeks 1-2', tasks: ['Company Registration & Legal Setup', 'Bank Account & Financial Infrastructure', 'Core Team Assembly', 'Initial Brand Identity Finalization'], status: 'completed' },
        { phase: '02: Tech & Platform', duration: 'Weeks 3-5', tasks: ['DevOps & Hosting Provisioning', 'Core Application Development (v1.0)', 'Payment Gateway Integration', 'Security Audits & Compliance Checks'], status: 'active' },
        { phase: '03: Pre-Launch Prep', duration: 'Weeks 6-7', tasks: ['Beta Testing with Exclusive Cohort', 'Marketing Assets Generation', 'Social Media Channels Setup', 'Press Release Drafting'], status: 'pending' },
        { phase: '04: Go-To-Market', duration: 'Week 8', tasks: ['Product Hunt / HackerNews Launch', 'Email Campaign Rollout', 'Ad Spend Activation (Google/Meta)', 'Day 1 Support Team Readiness'], status: 'pending' },
    ];

    const getStatusGlow = (s: string) => s === 'completed' ? '#FFFFFF' : s === 'active' ? '#FFFFFF' : 'transparent';
    const getStatusIcon = (s: string) => s === 'completed' ? '✓' : s === 'active' ? '●' : '○';

    return (
        <Card>
            <SectionHeader icon="" title="GTM Timeline & Milestones" subtitle="Your step-by-step roadmap to a successful public launch" />
            <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
                {phases.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 20 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `var(--bg-glass)`, border: `2px solid ${getStatusGlow(p.status) === 'transparent' ? 'var(--border-primary)' : getStatusGlow(p.status)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{getStatusIcon(p.status)}</div>
                            {i < phases.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border-primary)', margin: '8px 0' }} />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: i < phases.length - 1 ? 24 : 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: p.status === 'active' ? 'var(--text-primary)' : 'var(--text-primary)' }}>{p.phase}</h4>
                                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 12 }}>{p.duration}</span>
                            </div>
                            <div style={{ display: 'grid', gap: 8 }}>
                                {p.tasks.map((t, ti) => (
                                    <div key={ti} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                                        <div style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${p.status === 'completed' ? '#FFFFFF' : 'rgba(255,255,255,0.2)'}`, background: p.status === 'completed' ? '#FFFFFF' : 'transparent', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {p.status === 'completed' && <span style={{ color: '#000', fontSize: 10 }}>✓</span>}
                                        </div>
                                        <span style={{ fontSize: 13, color: p.status === 'completed' ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: p.status === 'completed' ? 'line-through' : 'none', lineHeight: 1.4 }}>{t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ============ SECTION 3: CHECKLIST ============
function LaunchChecklist() {
    const checklist = [
        { area: 'Legal & IP', items: [{ task: 'File Trademark Application', done: false }, { task: 'Terms of Service & Privacy Policy Live', done: true }] },
        { area: 'Infrastructure', items: [{ task: 'Production Database Optimized', done: true }, { task: 'CDN and Caching Configured', done: true }, { task: 'SSL Certificates Verified', done: true }] },
        { area: 'Marketing', items: [{ task: 'Launch Waitlist Email Sent', done: false }, { task: 'Social Handles Claimed', done: true }, { task: 'Promo Video Rendered', done: false }] },
    ];

    return (
        <Card glow={C.purple}>
            <SectionHeader icon="" title="Pre-Flight Checklist" subtitle="Critical day-0 execution items" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {checklist.map((c, i) => {
                    const progress = Math.round((c.items.filter(item => item.done).length / c.items.length) * 100);
                    return (
                        <div key={i} style={{ padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{c.area}</h4>
                                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: progress === 100 ? C.green : C.amber }}>{progress}%</span>
                            </div>
                            <div style={{ display: 'grid', gap: 10 }}>
                                {c.items.map((item, ii) => (
                                    <div key={ii} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                        <div style={{ fontSize: 14, color: item.done ? '#FFFFFF' : 'var(--border-primary)' }}>{item.done ? '▣' : '□'}</div>
                                        <div style={{ fontSize: 13, color: item.done ? 'var(--text-muted)' : 'var(--text-secondary)' }}>{item.task}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}


// ==========================
// MAIN LAUNCH TAB EXPORT
// ==========================
export default function LaunchTab({ output, profile }: { output: StrategyOutput; profile: BusinessProfile | null }) {
    const [activeSection, setActiveSection] = useState('brand');
    // If it's an established business, they probably have a brand already, but they can still use it for new product lines.

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '20px 24px 0' }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Launch Command Center
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
                    Brand identity generation, Go-to-Market timelines, and pre-flight checklists.
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
                        {activeSection === 'brand' && <BrandStudio profile={profile} />}
                        {activeSection === 'timeline' && <LaunchTimeline />}
                        {activeSection === 'checklist' && <LaunchChecklist />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

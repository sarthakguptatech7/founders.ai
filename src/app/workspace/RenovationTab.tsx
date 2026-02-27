'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StrategyOutput, BusinessProfile } from '@/lib/types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// ===== NAV =====
const SECTIONS = [
    { id: 'assessment', label: 'Site Assessment', icon: '' },
    { id: 'concepts', label: 'Renovation Concepts', icon: '' },
    { id: 'cost', label: 'Cost Estimator', icon: '' },
    { id: 'contractors', label: 'Contractors', icon: '' },
    { id: 'timeline', label: 'Timeline', icon: '' },
    { id: 'progress', label: 'Progress', icon: '' },
    { id: 'feasibility', label: 'Feasibility', icon: '' },
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

// ===== SECTION 1: SITE ASSESSMENT =====
function SiteAssessment({ profile }: { profile: BusinessProfile | null }) {
    const [uploadedPhotos, setUploadedPhotos] = useState<{ name: string; preview: string }[]>([]);
    const [assessed, setAssessed] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newPhotos = Array.from(files).map(f => ({
            name: f.name,
            preview: URL.createObjectURL(f),
        }));
        setUploadedPhotos(prev => [...prev, ...newPhotos]);
    }, []);

    const handleAssess = () => { setAssessed(true); };

    const conditions = [
        { area: 'Flooring', score: 72, status: 'Fair', note: 'Minor cracks, resurfacing recommended' },
        { area: 'Walls & Paint', score: 45, status: 'Poor', note: 'Significant peeling, full repaint needed' },
        { area: 'Electrical', score: 85, status: 'Good', note: 'Minor upgrades for compliance' },
        { area: 'Plumbing', score: 60, status: 'Fair', note: 'Aging pipes, partial replacement' },
        { area: 'HVAC', score: 90, status: 'Good', note: 'Recently serviced, minor duct cleaning' },
        { area: 'Structural', score: 95, status: 'Excellent', note: 'No concerns' },
        { area: 'Exterior/Facade', score: 55, status: 'Fair', note: 'Signage area needs work' },
        { area: 'Safety/Fire', score: 78, status: 'Good', note: 'Extinguishers need replacement' },
    ];

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* Upload Area */}
            <Card glow={C.cyan}>
                <SH icon="" title="Site Photo Upload" sub={`Upload photos of your ${profile?.industry || 'business'} location for AI condition analysis`} />
                <input ref={fileRef} type="file" multiple accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                <div onClick={() => fileRef.current?.click()} style={{
                    border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 12, padding: 40, textAlign: 'center',
                    cursor: 'pointer', transition: 'border-color 0.3s', background: 'rgba(255,255,255,0.01)',
                }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}></div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>Click to upload site photos</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Supports JPG, PNG, HEIC • Multiple files allowed</div>
                </div>
                {uploadedPhotos.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                        {uploadedPhotos.map((p, i) => (
                            <div key={i} style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <img src={p.preview} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        ))}
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAssess}
                            style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #FFFFFF', background: '#FFFFFF', color: '#000000', fontSize: 12, fontWeight: 600, cursor: 'pointer', alignSelf: 'center' }}>
                            Analyze Site
                        </motion.button>
                    </div>
                )}
            </Card>

            {/* Condition Report */}
            {(assessed || uploadedPhotos.length === 0) && (
                <Card>
                    <SH icon="" title="Condition Assessment Report" sub="AI-generated analysis of site conditions" />
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Area', 'Score', 'Status', 'Notes', 'Priority'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {conditions.map((c, i) => (
                                    <motion.tr key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: 12, fontWeight: 600 }}>{c.area}</td>
                                        <td style={{ padding: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 60, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                                                    <div style={{ width: `${c.score}%`, height: '100%', borderRadius: 3, background: c.score >= 80 ? C.green : c.score >= 60 ? C.amber : C.red }} />
                                                </div>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: c.score >= 80 ? C.green : c.score >= 60 ? C.amber : C.red }}>{c.score}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: 12 }}>
                                            <span style={{
                                                fontSize: 10, padding: '3px 10px', borderRadius: 12, fontFamily: 'var(--font-mono)',
                                                background: c.score >= 80 ? `${C.green}15` : c.score >= 60 ? `${C.amber}15` : `${C.red}15`,
                                                color: c.score >= 80 ? C.green : c.score >= 60 ? C.amber : C.red
                                            }}>{c.status}</span>
                                        </td>
                                        <td style={{ padding: 12, color: 'var(--text-secondary)', fontSize: 12 }}>{c.note}</td>
                                        <td style={{ padding: 12, fontSize: 14 }}>{c.score < 60 ? 'Low' : c.score < 80 ? 'Med' : 'High'}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

// ===== SECTION 2: RENOVATION CONCEPTS =====
function RenovationConcepts({ profile }: { profile: BusinessProfile | null }) {
    const industry = profile?.industry || 'Business';
    const [selectedConcept, setSelectedConcept] = useState(0);
    const concepts = [
        {
            name: 'Modern Minimal', style: 'Clean lines, neutral tones, open layout', cost: '₹8-12L', timeline: '6-8 weeks', suitability: 92,
            features: ['Open floor plan', 'LED ambient lighting', 'Polished concrete floors', 'Glass partition walls', 'Modular furniture'],
            colors: ['#f5f5f5', '#2d2d2d', '#c9a84c', '#5a8a7e']
        },
        {
            name: 'Industrial Chic', style: 'Exposed elements, raw textures, warm lighting', cost: '₹6-9L', timeline: '4-6 weeks', suitability: 78,
            features: ['Exposed brick walls', 'Metal ductwork visible', 'Edison bulb fixtures', 'Reclaimed wood accents', 'Concrete counters'],
            colors: ['#3d3027', '#8b7355', '#d4a853', '#1a1a1a']
        },
        {
            name: `Premium ${industry} Space`, style: 'High-end finishes, brand-specific design', cost: '₹15-25L', timeline: '10-14 weeks', suitability: 85,
            features: ['Custom brand wall', 'Premium stone counters', 'Smart lighting system', 'Acoustic treatment', 'Digital signage integration'],
            colors: ['#1a1a2e', '#7C3AED', '#06B6D4', '#f0f0f0']
        },
        {
            name: 'Eco-Friendly', style: 'Sustainable materials, natural light, green elements', cost: '₹10-15L', timeline: '8-10 weeks', suitability: 70,
            features: ['Living green wall', 'Bamboo flooring', 'Solar-powered lighting', 'Recycled material furniture', 'Rainwater harvesting'],
            colors: ['#2d2d2d', '#8b8b8b', '#e8e8e8', '#797979']
        },
    ];

    const sel = concepts[selectedConcept];

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* Concept Selector */}
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                {concepts.map((c, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedConcept(i)}
                        style={{
                            padding: '12px 20px', borderRadius: 10, border: `1px solid ${selectedConcept === i ? C.purple : 'rgba(255,255,255,0.06)'}`,
                            background: selectedConcept === i ? `${C.purple}15` : 'rgba(255,255,255,0.02)', cursor: 'pointer',
                            color: selectedConcept === i ? C.purple : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                        }}>{c.name} <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>{c.suitability}%</span></motion.button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                {/* Concept Details */}
                <Card glow={C.purple}>
                    <SH icon="" title={sel.name} sub={sel.style} />
                    {/* Color Palette */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        {sel.colors.map((c, i) => (
                            <div key={i} style={{ width: 40, height: 40, borderRadius: 8, background: c, border: '2px solid rgba(255,255,255,0.1)' }} title={c} />
                        ))}
                    </div>
                    {/* Features */}
                    <div style={{ display: 'grid', gap: 6 }}>
                        {sel.features.map((f, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                                <span style={{ color: C.green }}>✓</span> {f}
                            </motion.div>
                        ))}
                    </div>
                </Card>

                {/* Quick Stats */}
                <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                    <Card>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>EST. COST</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: C.green, fontFamily: 'var(--font-mono)' }}>{sel.cost}</div>
                    </Card>
                    <Card>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>TIMELINE</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: C.cyan, fontFamily: 'var(--font-mono)' }}>{sel.timeline}</div>
                    </Card>
                    <Card>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>SUITABILITY</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: sel.suitability >= 85 ? C.green : C.amber, fontFamily: 'var(--font-mono)' }}>{sel.suitability}%</div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginTop: 8 }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${sel.suitability}%` }} style={{ height: '100%', borderRadius: 3, background: sel.suitability >= 85 ? C.green : C.amber }} />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// ===== SECTION 3: COST ESTIMATOR =====
function CostEstimator() {
    const [area, setArea] = useState(1000);
    const [scope, setScope] = useState<'basic' | 'standard' | 'premium'>('standard');
    const rates: Record<string, number> = { basic: 800, standard: 1400, premium: 2500 };
    const totalCost = area * rates[scope];

    const breakdown = useMemo(() => [
        { category: 'Materials', pct: 40, amount: totalCost * 0.4, color: C.blue },
        { category: 'Labour', pct: 30, amount: totalCost * 0.3, color: C.green },
        { category: 'Fixtures', pct: 15, amount: totalCost * 0.15, color: C.amber },
        { category: 'Permits & Design', pct: 8, amount: totalCost * 0.08, color: C.purple },
        { category: 'Contingency', pct: 7, amount: totalCost * 0.07, color: C.red },
    ], [totalCost]);

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* Controls */}
            <Card glow={C.amber}>
                <SH icon="" title="Interactive Cost Estimator" sub="Adjust area and scope to get real-time estimates" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>AREA (sq ft)</label>
                        <input type="range" min={200} max={5000} step={50} value={area} onChange={e => setArea(Number(e.target.value))}
                            style={{ width: '100%', accentColor: C.amber }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                            <span>200</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: C.amber, fontFamily: 'var(--font-mono)' }}>{area.toLocaleString()} sq ft</span>
                            <span>5,000</span>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>SCOPE</label>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {(['basic', 'standard', 'premium'] as const).map(s => (
                                <button key={s} onClick={() => setScope(s)} style={{
                                    flex: 1, padding: '10px', fontSize: 12, borderRadius: 8, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                                    border: `1px solid ${scope === s ? C.amber : 'rgba(255,255,255,0.06)'}`,
                                    background: scope === s ? `${C.amber}15` : 'transparent',
                                    color: scope === s ? C.amber : 'var(--text-muted)',
                                }}>{s}<div style={{ fontSize: 10, marginTop: 2 }}>₹{rates[s]}/sqft</div></button>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Total */}
                <div style={{ marginTop: 20, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>ESTIMATED TOTAL COST</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: C.green, fontFamily: 'var(--font-mono)' }}>₹{totalCost.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{area.toLocaleString()} sq ft × ₹{rates[scope]}/sqft ({scope})</div>
                </div>
            </Card>

            {/* Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Card>
                    <SH icon="" title="Cost Breakdown" />
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={breakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={0}>
                                {breakdown.map((b, i) => <Cell key={i} fill={b.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} formatter={(v: number | undefined) => [`₹${(v ?? 0).toLocaleString()}`, '']} />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <SH icon="" title="Line Items" />
                    <div style={{ display: 'grid', gap: 8 }}>
                        {breakdown.map(b => (
                            <div key={b.category} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{b.category}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{b.pct}%</span>
                                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>₹{Math.round(b.amount).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// ===== SECTION 4: CONTRACTOR DIRECTORY =====
function ContractorDirectory({ profile }: { profile: BusinessProfile | null }) {
    const geo = profile?.geography || 'your area';
    const contractors = [
        { name: 'BuildRight Interiors', specialty: 'Commercial Fit-outs', rating: 4.8, reviews: 234, experience: '12 yrs', rate: '₹1,200-1,800/sqft', verified: true, completedProjects: 85, responseTime: '< 2 hrs' },
        { name: 'Urban Renovators', specialty: 'Retail & Restaurant', rating: 4.6, reviews: 178, experience: '8 yrs', rate: '₹900-1,500/sqft', verified: true, completedProjects: 62, responseTime: '< 4 hrs' },
        { name: 'GreenBuild Studios', specialty: 'Eco-Friendly Design', rating: 4.5, reviews: 96, experience: '5 yrs', rate: '₹1,400-2,200/sqft', verified: true, completedProjects: 34, responseTime: '< 6 hrs' },
        { name: 'QuickFix Contractors', specialty: 'Budget Renovations', rating: 4.2, reviews: 312, experience: '15 yrs', rate: '₹600-1,000/sqft', verified: false, completedProjects: 210, responseTime: '< 1 hr' },
        { name: 'Elite Spaces Co.', specialty: 'Premium Commercial', rating: 4.9, reviews: 89, experience: '10 yrs', rate: '₹2,000-3,500/sqft', verified: true, completedProjects: 44, responseTime: '< 3 hrs' },
    ];

    return (
        <div style={{ display: 'grid', gap: 16 }}>
            <Card style={{ padding: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Showing contractors near <strong style={{ color: C.cyan }}>{geo}</strong> • Sorted by rating</div>
            </Card>
            {contractors.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: 14 }}>
                                <div style={{ width: 52, height: 52, borderRadius: 12, background: `${C.purple}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}></div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{c.name}</h4>
                                        {c.verified && <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 12, background: `${C.green}15`, color: C.green, fontFamily: 'var(--font-mono)' }}>✓ VERIFIED</span>}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.specialty} • {c.experience} experience</div>
                                    <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Star {c.rating} ({c.reviews} reviews)</span>
                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.completedProjects} projects</span>
                                        <span style={{ fontSize: 12, color: C.green }}>{c.responseTime}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: C.green, fontFamily: 'var(--font-mono)' }}>{c.rate}</div>
                                <button style={{ marginTop: 8, padding: '6px 16px', borderRadius: 6, border: `1px solid ${C.purple}`, background: 'transparent', color: C.purple, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Request Quote</button>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}

// ===== SECTION 5: PHASED TIMELINE =====
function PhasedTimeline() {
    const phases = [
        { name: 'Planning & Design', duration: '2 weeks', start: 'Week 1', end: 'Week 2', pct: 100, status: 'complete', color: C.green, tasks: ['Site survey', 'Design approval', 'Permit applications', 'Material selection'] },
        { name: 'Demolition & Prep', duration: '1 week', start: 'Week 3', end: 'Week 3', pct: 100, status: 'complete', color: C.green, tasks: ['Strip old fixtures', 'Debris removal', 'Surface prep', 'Safety barriers'] },
        { name: 'Structural Work', duration: '2 weeks', start: 'Week 4', end: 'Week 5', pct: 65, status: 'in_progress', color: C.blue, tasks: ['Wall modifications', 'Partition install', 'Ceiling framework', 'Floor leveling'] },
        { name: 'M&E Installation', duration: '2 weeks', start: 'Week 6', end: 'Week 7', pct: 0, status: 'upcoming', color: 'var(--text-muted)', tasks: ['Electrical rewiring', 'Plumbing rough-in', 'HVAC ductwork', 'Data cabling'] },
        { name: 'Finishing', duration: '2 weeks', start: 'Week 8', end: 'Week 9', pct: 0, status: 'upcoming', color: 'var(--text-muted)', tasks: ['Painting', 'Flooring install', 'Fixture mounting', 'Custom millwork'] },
        { name: 'Final Inspection', duration: '1 week', start: 'Week 10', end: 'Week 10', pct: 0, status: 'upcoming', color: 'var(--text-muted)', tasks: ['Quality check', 'Punch list', 'Compliance sign-off', 'Handover'] },
    ];

    const statusBadge: Record<string, { bg: string; color: string }> = {
        complete: { bg: `${C.green}15`, color: C.green },
        in_progress: { bg: `${C.blue}15`, color: C.blue },
        upcoming: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' },
    };

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            {phases.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <Card style={{ padding: 20 }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                            {/* Phase Indicator */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: p.status === 'complete' ? C.green : p.status === 'in_progress' ? C.blue : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                                    {p.status === 'complete' ? '✓' : i + 1}
                                </div>
                                {i < phases.length - 1 && <div style={{ width: 2, flex: 1, background: p.status === 'complete' ? C.green : 'rgba(255,255,255,0.06)', marginTop: 4 }} />}
                            </div>
                            {/* Content */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: p.status === 'upcoming' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>{p.name}</h4>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.start} — {p.end} ({p.duration})</span>
                                        <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, fontFamily: 'var(--font-mono)', ...statusBadge[p.status] }}>{p.status.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 10 }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${p.pct}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                                        style={{ height: '100%', borderRadius: 3, background: p.status === 'complete' ? C.green : C.blue }} />
                                </div>
                                {/* Tasks */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {p.tasks.map(t => (
                                        <span key={t} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}>{t}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}

// ===== SECTION 6: PROGRESS TRACKER =====
function ProgressTracker() {
    const overallProgress = 42;
    const milestones = [
        { name: 'Site Survey Complete', date: 'Jan 15', done: true },
        { name: 'Design Approved', date: 'Jan 22', done: true },
        { name: 'Permits Obtained', date: 'Jan 29', done: true },
        { name: 'Demolition Complete', date: 'Feb 5', done: true },
        { name: 'Structural 50%', date: 'Feb 12', done: true },
        { name: 'Structural Complete', date: 'Feb 22', done: false },
        { name: 'M&E Installation', date: 'Mar 8', done: false },
        { name: 'Finishing Complete', date: 'Mar 22', done: false },
        { name: 'Final Handover', date: 'Mar 29', done: false },
    ];

    const weeklySpend = [
        { week: 'W1', planned: 80000, actual: 75000 }, { week: 'W2', planned: 120000, actual: 130000 },
        { week: 'W3', planned: 200000, actual: 185000 }, { week: 'W4', planned: 250000, actual: 260000 },
        { week: 'W5', planned: 180000, actual: 170000 }, { week: 'W6', planned: 150000, actual: 0 },
    ];

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* Overall Progress */}
            <Card glow={C.blue}>
                <SH icon="" title="Overall Project Progress" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                    <div style={{ position: 'relative', width: 100, height: 100 }}>
                        <svg width={100} height={100} viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="none" />
                            <motion.circle cx="50" cy="50" r="42" stroke={C.blue} strokeWidth="8" fill="none" strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 42} initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - overallProgress / 100) }}
                                transition={{ duration: 1.5 }} style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                            <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fill={C.blue} fontSize="20" fontWeight="800" fontFamily="var(--font-mono)">{overallProgress}%</text>
                        </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>5 of 9 milestones completed</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>On track — Expected completion: Mar 29</div>
                    </div>
                </div>
                {/* Milestones */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {milestones.map((m, i) => (
                        <div key={i} style={{ padding: '8px 12px', borderRadius: 6, background: m.done ? `${C.green}08` : 'rgba(255,255,255,0.01)', border: `1px solid ${m.done ? C.green + '20' : 'rgba(255,255,255,0.04)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12 }}>{m.done ? '' : ''}</span>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: m.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>{m.name}</div>
                                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.date}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Weekly Spend */}
            <Card>
                <SH icon="" title="Weekly Expenditure — Planned vs Actual" />
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={weeklySpend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                        <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="planned" name="Planned" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual" name="Actual" fill={C.blue} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
}

// ===== SECTION 7: FEASIBILITY REPORT =====
function FeasibilityReport({ profile }: { profile: BusinessProfile | null }) {
    const infraScore = profile?.physical_infrastructure_score ?? 0.5;
    const readinessScore = Math.round(infraScore * 100);
    const factors = [
        { factor: 'Structural Integrity', score: 95, weight: '25%' },
        { factor: 'Location Accessibility', score: 82, weight: '20%' },
        { factor: 'Zoning Compliance', score: 78, weight: '15%' },
        { factor: 'Utility Availability', score: 88, weight: '15%' },
        { factor: 'Parking & Traffic', score: 65, weight: '10%' },
        { factor: 'Neighborhood Fit', score: 72, weight: '10%' },
        { factor: 'Environmental Clearance', score: 90, weight: '5%' },
    ];

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* Overall Readiness */}
            <Card glow={readinessScore >= 70 ? C.green : C.amber}>
                <SH icon="" title="Location Readiness Assessment" sub={`For ${profile?.industry || 'your business'} in ${profile?.geography || 'your area'}`} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
                    <div style={{ position: 'relative' }}>
                        <svg width={140} height={140} viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r="58" stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />
                            <motion.circle cx="70" cy="70" r="58" stroke={readinessScore >= 70 ? C.green : readinessScore >= 50 ? C.amber : C.red}
                                strokeWidth="10" fill="none" strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 58} initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - readinessScore / 100) }}
                                transition={{ duration: 1.5 }} style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                            <text x="70" y="65" textAnchor="middle" fill={readinessScore >= 70 ? C.green : C.amber} fontSize="32" fontWeight="800" fontFamily="var(--font-mono)">{readinessScore}</text>
                            <text x="70" y="85" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">READINESS</text>
                        </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: readinessScore >= 70 ? C.green : C.amber }}>
                            {readinessScore >= 80 ? 'Highly Ready' : readinessScore >= 60 ? 'Moderately Ready' : 'Needs Significant Work'}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {readinessScore >= 70 ? 'This location shows strong potential. Minor renovations and compliance updates will prepare it for operations.' : 'This location requires moderate renovation work before it can support full operations. Budget for structural and compliance upgrades.'}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Factor Breakdown */}
            <Card>
                <SH icon="" title="Feasibility Factor Breakdown" />
                <div style={{ display: 'grid', gap: 10 }}>
                    {factors.map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                            <span style={{ width: 140, fontSize: 13, fontWeight: 600 }}>{f.factor}</span>
                            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${f.score}%` }} transition={{ duration: 1, delay: i * 0.08 }}
                                    style={{ height: '100%', borderRadius: 3, background: f.score >= 80 ? C.green : f.score >= 65 ? C.amber : C.red }} />
                            </div>
                            <span style={{ width: 40, textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: f.score >= 80 ? C.green : f.score >= 65 ? C.amber : C.red }}>{f.score}</span>
                            <span style={{ width: 40, textAlign: 'right', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{f.weight}</span>
                        </motion.div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// ==========================
// MAIN RENOVATION TAB EXPORT
// ==========================
export default function RenovationTab({ output, profile }: { output: StrategyOutput; profile: BusinessProfile | null }) {
    const [activeSection, setActiveSection] = useState('assessment');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 0' }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Renovation & Location Planner
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
                    Site assessment, renovation concepts, cost estimation, and project tracking for {profile?.industry || 'your business'}
                </p>
            </div>

            {/* Nav */}
            <div style={{ padding: '16px 24px', display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto' }}>
                {SECTIONS.map(s => (
                    <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                        padding: '8px 16px', fontSize: 12, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
                        background: activeSection === s.id ? 'rgba(245,158,11,0.15)' : 'transparent',
                        color: activeSection === s.id ? C.amber : 'var(--text-tertiary)',
                    }}>{s.icon} {s.label}</button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                <AnimatePresence mode="wait">
                    <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {activeSection === 'assessment' && <SiteAssessment profile={profile} />}
                        {activeSection === 'concepts' && <RenovationConcepts profile={profile} />}
                        {activeSection === 'cost' && <CostEstimator />}
                        {activeSection === 'contractors' && <ContractorDirectory profile={profile} />}
                        {activeSection === 'timeline' && <PhasedTimeline />}
                        {activeSection === 'progress' && <ProgressTracker />}
                        {activeSection === 'feasibility' && <FeasibilityReport profile={profile} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

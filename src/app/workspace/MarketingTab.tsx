'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StrategyOutput, DepartmentOutput, BusinessProfile } from '@/lib/types';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, RadarChart,
    Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';

// ===== SECTION NAV =====
const SECTIONS = [
    { id: 'strategy', label: 'Strategy Hub', icon: '' },
    { id: 'calendar', label: 'Content Calendar', icon: '' },
    { id: 'creative', label: 'Creative Studio', icon: '' },
    { id: 'abtesting', label: 'A/B Testing', icon: '' },
    { id: 'campaigns', label: 'Campaigns', icon: '' },
    { id: 'audience', label: 'Audience', icon: '' },
    { id: 'whatsapp', label: 'WhatsApp Bot', icon: '' },
];

// ===== COLOR PALETTE =====
const COLORS = {
    purple: '#A855F7', cyan: '#06B6D4', pink: '#EC4899', green: '#10B981',
    amber: '#F59E0B', red: '#F43F5E', blue: '#38BDF8', indigo: '#818CF8',
    meta: '#FFFFFF', google: '#A1A1AA', instagram: '#FFFFFF', tiktok: '#FFFFFF',
    youtube: '#E4E4E7', linkedin: '#FFFFFF', twitter: '#FFFFFF',
};

const PLATFORMS = [
    { id: 'meta', name: 'Meta Ads', icon: '', color: COLORS.meta },
    { id: 'google', name: 'Google Ads', icon: '', color: COLORS.google },
    { id: 'instagram', name: 'Instagram', icon: '', color: COLORS.instagram },
    { id: 'linkedin', name: 'LinkedIn', icon: '', color: COLORS.linkedin },
    { id: 'youtube', name: 'YouTube', icon: '', color: COLORS.youtube },
];

// ===== MOCK DATA GENERATORS =====
function generateChannelMix() {
    return [
        { channel: 'Social Media', budget: 35, roi: 3.2, leads: 1200, color: COLORS.pink },
        { channel: 'Search (SEO/SEM)', budget: 25, roi: 4.1, leads: 900, color: COLORS.blue },
        { channel: 'Content Marketing', budget: 20, roi: 2.8, leads: 650, color: COLORS.green },
        { channel: 'Email Marketing', budget: 10, roi: 5.5, leads: 400, color: COLORS.amber },
        { channel: 'Influencer', budget: 10, roi: 2.1, leads: 300, color: COLORS.purple },
    ];
}

function generateCalendarData(industry: string) {
    const contentTypes = ['Blog Post', 'IG Reel', 'YouTube', 'Newsletter', 'Twitter Thread', 'FB Ad', 'Podcast', 'Infographic'];
    const themes = [
        `Why ${industry} matters`, `Top 5 tips for ${industry}`, 'Behind the scenes',
        'Customer spotlight', 'Product launch teaser', 'Industry trends 2026',
        'How-to guide', 'FAQ answered', 'Team introduction', 'Case study',
        'Weekly roundup', 'Myth busting', 'Expert interview', 'Seasonal offer',
    ];
    return Array.from({ length: 28 }, (_, i) => {
        const hasContent = Math.random() > 0.25;
        return {
            day: i + 1, hasContent,
            type: contentTypes[Math.floor(Math.random() * contentTypes.length)],
            theme: themes[Math.floor(Math.random() * themes.length)],
            platform: PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)],
            time: `${9 + Math.floor(Math.random() * 10)}:${Math.random() > 0.5 ? '00' : '30'}`,
            status: Math.random() > 0.6 ? 'scheduled' : Math.random() > 0.3 ? 'draft' : 'published',
            engagement: Math.floor(Math.random() * 5000 + 500),
        };
    });
}

function generateAdVariants() {
    return {
        meta: [
            { name: 'Carousel - Benefits', impressions: 45200, clicks: 1830, ctr: 4.05, cpc: 0.42, conversions: 89, spend: 768, roas: 3.8 },
            { name: 'Video - Testimonial', impressions: 38100, clicks: 1520, ctr: 3.99, cpc: 0.51, conversions: 72, spend: 775, roas: 3.2 },
            { name: 'Static - Offer', impressions: 52300, clicks: 1150, ctr: 2.20, cpc: 0.67, conversions: 45, spend: 770, roas: 2.1 },
        ],
        google: [
            { name: 'Search - Brand', impressions: 12400, clicks: 1860, ctr: 15.0, cpc: 1.20, conversions: 186, spend: 2232, qualityScore: 9 },
            { name: 'Search - Generic', impressions: 34500, clicks: 1380, ctr: 4.0, cpc: 2.45, conversions: 69, spend: 3381, qualityScore: 7 },
            { name: 'Display - Retarget', impressions: 89200, clicks: 892, ctr: 1.0, cpc: 0.85, conversions: 53, spend: 758, qualityScore: 6 },
        ],
    };
}

function generateTrendData() {
    const days = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return days.map(d => ({
        name: d,
        impressions: Math.floor(Math.random() * 50000 + 30000),
        clicks: Math.floor(Math.random() * 3000 + 1000),
        conversions: Math.floor(Math.random() * 200 + 50),
        spend: Math.floor(Math.random() * 2000 + 500),
    }));
}

function generateAudienceData() {
    return {
        age: [
            { group: '18-24', pct: 15 }, { group: '25-34', pct: 35 },
            { group: '35-44', pct: 25 }, { group: '45-54', pct: 15 }, { group: '55+', pct: 10 },
        ],
        gender: [{ name: 'Male', value: 45, color: COLORS.blue }, { name: 'Female', value: 48, color: COLORS.pink }, { name: 'Other', value: 7, color: COLORS.green }],
        interests: ['Technology', 'Business', 'Health & Wellness', 'Food & Dining', 'Travel', 'Finance', 'Fitness', 'Education'],
        behavior: [
            { metric: 'Avg. Session', value: '4m 32s' }, { metric: 'Bounce Rate', value: '34%' },
            { metric: 'Pages/Session', value: '3.8' }, { metric: 'Return Visitors', value: '42%' },
        ],
        radar: [
            { subject: 'Awareness', A: 85, B: 65 }, { subject: 'Engagement', A: 72, B: 80 },
            { subject: 'Conversion', A: 68, B: 55 }, { subject: 'Retention', A: 90, B: 70 },
            { subject: 'Advocacy', A: 55, B: 45 },
        ],
    };
}

// ===== GLASS CARD WRAPPER =====
function Card({ children, style, glow }: { children: React.ReactNode; style?: React.CSSProperties; glow?: string }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: 24, position: 'relative', overflow: 'hidden',
            ...(glow ? { boxShadow: `0 0 40px ${glow}15, inset 0 1px 0 rgba(255,255,255,0.05)` } : {}),
            ...style,
        }}>
            {children}
        </div>
    );
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
    return (
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
            <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h3>
                {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>{subtitle}</p>}
            </div>
        </div>
    );
}

function Metric({ label, value, change, color }: { label: string; value: string; change?: string; color?: string }) {
    const isPositive = change?.startsWith('+');
    return (
        <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>{label}</div>
            {change && <div style={{ fontSize: 11, color: isPositive ? '#FFFFFF' : 'var(--text-secondary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{change} vs last month</div>}
        </div>
    );
}

// ========================
// SECTION 1: STRATEGY HUB
// ========================
function StrategyHub({ dept, profile }: { dept: DepartmentOutput; profile: BusinessProfile | null }) {
    const channelMix = useMemo(generateChannelMix, []);
    const trendData = useMemo(generateTrendData, []);

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                <Metric label="Total Budget" value={profile?.capital_range || '₹50K'} change="+12%" color={COLORS.green} />
                <Metric label="Est. Reach" value="125K" change="+28%" color={COLORS.cyan} />
                <Metric label="Conv. Rate" value="3.8%" change="+0.5%" color={COLORS.purple} />
                <Metric label="CAC" value="₹450" change="-12%" color={COLORS.amber} />
                <Metric label="ROAS" value="4.2x" change="+0.8x" color={COLORS.pink} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                {/* Strategy Summary */}
                <Card glow={COLORS.amber}>
                    <SectionHeader icon="" title="AI Marketing Strategy" subtitle={`Tailored for ${profile?.industry || 'your business'} in ${profile?.geography || 'your region'}`} />
                    <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 16 }}>{dept.summary}</p>
                    {dept.details && <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-tertiary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>{dept.details.substring(0, 400)}{dept.details.length > 400 ? '...' : ''}</p>}
                    {/* Action Items */}
                    <div style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Action Items</div>
                        <div style={{ display: 'grid', gap: 6 }}>
                            {dept.action_items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                                    <span style={{ color: COLORS.amber, fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span> {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Channel Mix Pie */}
                <Card glow={COLORS.pink}>
                    <SectionHeader icon="" title="Channel Budget Mix" />
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={channelMix} dataKey="budget" nameKey="channel" cx="50%" cy="50%" innerRadius={45} outerRadius={75} strokeWidth={0}>
                                {channelMix.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'grid', gap: 4 }}>
                        {channelMix.map(ch => (
                            <div key={ch.channel} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: ch.color, flexShrink: 0 }} />
                                <span style={{ flex: 1 }}>{ch.channel}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{ch.budget}%</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: COLORS.green, fontSize: 10 }}>{ch.roi}x</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Performance Trend */}
            <Card>
                <SectionHeader icon="" title="Monthly Performance Trend" subtitle="Impressions, Clicks & Conversions over 4 weeks" />
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="gradImpressions" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} /></linearGradient>
                            <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="impressions" stroke={COLORS.cyan} fill="url(#gradImpressions)" strokeWidth={2} />
                        <Area type="monotone" dataKey="clicks" stroke={COLORS.purple} fill="url(#gradClicks)" strokeWidth={2} />
                        <Line type="monotone" dataKey="conversions" stroke={COLORS.green} strokeWidth={2} dot={{ r: 4, fill: COLORS.green, strokeWidth: 0 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
}

// ============================
// SECTION 2: CONTENT CALENDAR
// ============================
function ContentCalendarSection({ profile }: { profile: BusinessProfile | null }) {
    const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const calendarData = useMemo(() => generateCalendarData(profile?.industry || 'Business'), [profile?.industry]);
    const selected = selectedDay !== null ? calendarData[selectedDay - 1] : null;

    const statusColor: Record<string, string> = { scheduled: COLORS.blue, draft: COLORS.amber, published: COLORS.green };

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                    {(['month', 'list'] as const).map(m => (
                        <button key={m} onClick={() => setViewMode(m)} style={{
                            padding: '6px 16px', fontSize: 12, fontFamily: 'var(--font-mono)', borderRadius: 6, border: '1px solid',
                            borderColor: viewMode === m ? 'var(--border-primary)' : 'rgba(255,255,255,0.08)', cursor: 'pointer',
                            background: viewMode === m ? `var(--bg-card)` : 'transparent', color: viewMode === m ? '#FFFFFF' : 'var(--text-tertiary)',
                        }}>{m === 'month' ? 'Month' : 'List'}</button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                    {['scheduled', 'draft', 'published'].map(s => (
                        <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[s] }} /> {s}
                        </span>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedDay ? '1fr 320px' : '1fr', gap: 20 }}>
                {viewMode === 'month' ? (
                    <Card>
                        {/* Week Headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                                <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', padding: 6, fontFamily: 'var(--font-mono)' }}>{d}</div>
                            ))}
                        </div>
                        {/* Calendar Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                            {calendarData.map((d) => (
                                <motion.div key={d.day} whileHover={{ scale: 1.03 }} onClick={() => setSelectedDay(d.day === selectedDay ? null : d.day)}
                                    style={{
                                        minHeight: 80, borderRadius: 8, padding: 8, cursor: 'pointer',
                                        background: d.day === selectedDay ? 'rgba(124,58,237,0.15)' : d.hasContent ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                                        border: `1px solid ${d.day === selectedDay ? COLORS.purple + '60' : d.hasContent ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)'}`,
                                    }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: d.day === selectedDay ? COLORS.purple : 'var(--text-secondary)' }}>{d.day}</span>
                                        {d.hasContent && <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[d.status] }} />}
                                    </div>
                                    {d.hasContent && (
                                        <>
                                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>{d.type}</div>
                                            <div style={{ fontSize: 9, color: d.platform.color, fontFamily: 'var(--font-mono)' }}>{d.platform.icon} {d.time}</div>
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <div style={{ display: 'grid', gap: 6 }}>
                            {calendarData.filter(d => d.hasContent).map(d => (
                                <div key={d.day} onClick={() => setSelectedDay(d.day)} style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                                    background: d.day === selectedDay ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${d.day === selectedDay ? COLORS.purple + '40' : 'rgba(255,255,255,0.04)'}`,
                                }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${d.platform.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{d.platform.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Day {d.day} — {d.type}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.theme}</div>
                                    </div>
                                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, background: `${statusColor[d.status]}20`, color: statusColor[d.status], fontFamily: 'var(--font-mono)' }}>{d.status}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d.time}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Detail Panel */}
                <AnimatePresence>
                    {selected && selected.hasContent && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <Card glow={selected.platform.color}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>DAY {selected.day} DETAILS</div>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    <div><div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>CONTENT TYPE</div><div style={{ fontSize: 14, fontWeight: 600 }}>{selected.type}</div></div>
                                    <div><div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>TOPIC</div><div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selected.theme}</div></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <div><div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>PLATFORM</div><div style={{ fontSize: 13, color: selected.platform.color }}>{selected.platform.icon} {selected.platform.name}</div></div>
                                        <div><div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>TIME</div><div style={{ fontSize: 13 }}>{selected.time}</div></div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <div><div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>STATUS</div><div style={{ fontSize: 12, padding: '4px 10px', borderRadius: 12, background: `${statusColor[selected.status]}15`, color: statusColor[selected.status], display: 'inline-block' }}>{selected.status}</div></div>
                                        <div><div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>EST. ENGAGEMENT</div><div style={{ fontSize: 15, fontWeight: 700, color: COLORS.green }}>{selected.engagement.toLocaleString()}</div></div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ==========================
// SECTION 3: CREATIVE STUDIO (AI Powered)
// ==========================
function CreativeStudioSection({ profile }: { profile: BusinessProfile | null }) {
    const [selectedTemplate, setSelectedTemplate] = useState(0);
    const [primaryColor, setPrimaryColor] = useState('#7C3AED');
    const [headline, setHeadline] = useState(`Discover ${profile?.industry || 'Innovation'}`);
    const [subtext, setSubtext] = useState('Premium quality. Unmatched experience.');
    const [ctaText, setCtaText] = useState('Learn More');
    const [format, setFormat] = useState<'poster' | 'story' | 'banner'>('poster');
    const [bgImage, setBgImage] = useState<string | null>(null);

    // AI Generation State
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const generateCreative = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            const res = await fetch('/api/creative', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, profile })
            });
            const data = await res.json();

            if (data.headline) setHeadline(data.headline);
            if (data.subtext) setSubtext(data.subtext);
            if (data.ctaText) setCtaText(data.ctaText);

            if (data.imagePrompt) {
                const encoded = encodeURIComponent(data.imagePrompt + ", no text, highly detailed, dramatic lighting, masterpiece");
                const imgUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true`;
                setBgImage(`url(${imgUrl})`);
                setSelectedTemplate(-1); // -1 means use bgImage instead of gradient template
            }
        } catch (err) {
            console.error(err);
        }
        setIsGenerating(false);
    };

    const templates = [
        { name: 'Gradient Bold', bg: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}88)` },
        { name: 'Dark Minimal', bg: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)' },
        { name: 'Warm Sunset', bg: 'linear-gradient(135deg, #1A1A1A, #333333)' },
        { name: 'Ocean Deep', bg: 'linear-gradient(135deg, #111111, #222222)' },
        { name: 'Forest', bg: 'linear-gradient(135deg, #050505, #151515)' },
    ];

    // We add more height/width since it might be graphic heavy now
    const dims: Record<string, { w: number; h: number }> = { poster: { w: 320, h: 400 }, story: { w: 240, h: 420 }, banner: { w: 460, h: 220 } };

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            {/* AI Generator Chat Box */}
            <Card glow={COLORS.cyan}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Gemini Nano Banana Creative Generator</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Prompt the AI to build the absolute best photos, flyers, and posters dynamically.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <input
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="e.g. A cyberpunk neon flyer for our upcoming AI conference..."
                        style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 14, outline: 'none' }}
                        onKeyDown={e => e.key === 'Enter' && generateCreative()}
                    />
                    <button
                        onClick={generateCreative}
                        disabled={isGenerating || !prompt}
                        style={{ padding: '0 24px', borderRadius: 8, border: 'none', background: COLORS.cyan, color: '#000', fontSize: 14, fontWeight: 700, cursor: isGenerating ? 'wait' : 'pointer', opacity: (isGenerating || !prompt) ? 0.5 : 1 }}
                    >
                        {isGenerating ? 'Generating...' : 'Generate AI Creative'}
                    </button>
                </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                {/* Preview Window */}
                <Card>
                    <SectionHeader icon="" title="Live Creative Editor" subtitle={`Format: ${format} • ${dims[format].w}x${dims[format].h}`} />
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.3)', borderRadius: 8, minHeight: 480, alignItems: 'center' }}>

                        <div style={{
                            width: dims[format].w, height: dims[format].h, borderRadius: 12,
                            backgroundImage: selectedTemplate === -1 ? (bgImage ?? 'none') : templates[selectedTemplate].bg,
                            backgroundColor: selectedTemplate === -1 && !bgImage ? '#000' : 'transparent',
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 28, position: 'relative', overflow: 'hidden',
                            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)`,
                            transition: 'all 0.3s ease'
                        }}>
                            {/* Dark Gradient Overlay for text readability if using image */}
                            {selectedTemplate === -1 && (
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)', zIndex: 0 }} />
                            )}

                            {/* Abstract blobs if using gradient templates */}
                            {selectedTemplate !== -1 && (
                                <>
                                    <div style={{ position: 'absolute', top: 20, right: 20, width: 80, height: 80, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }} />
                                    <div style={{ position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', filter: 'blur(40px)' }} />
                                </>
                            )}

                            <h2 style={{ fontSize: format === 'banner' ? 24 : 32, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1, textShadow: '0 2px 20px rgba(0,0,0,0.5)', zIndex: 1, textWrap: 'balance' }}>{headline}</h2>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', margin: '10px 0 20px', zIndex: 1, textShadow: '0 1px 10px rgba(0,0,0,0.5)', lineHeight: 1.5 }}>{subtext}</p>
                            <button style={{ padding: '12px 24px', border: '2px solid rgba(255,255,255,0.9)', borderRadius: 8, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(10px)', alignSelf: 'flex-start', zIndex: 1, textTransform: 'uppercase', letterSpacing: 1 }}>{ctaText}</button>
                        </div>
                    </div>
                </Card>

                {/* Manual Controls */}
                <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                    <Card>
                        <SectionHeader icon="" title="Manual Overrides" />
                        <div style={{ display: 'grid', gap: 14 }}>
                            {/* Format Selector */}
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>FORMAT</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {(['poster', 'story', 'banner'] as const).map(f => (
                                        <button key={f} onClick={() => setFormat(f)} style={{ flex: 1, padding: '6px', fontSize: 11, borderRadius: 6, border: `1px solid ${format === f ? primaryColor : 'rgba(255,255,255,0.08)'}`, background: format === f ? `${primaryColor}20` : 'transparent', color: format === f ? primaryColor : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>{f.toUpperCase()}</button>
                                    ))}
                                </div>
                            </div>
                            {/* Template Override */}
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>BACKGROUND OVERRIDE</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {templates.map((t, i) => (
                                        <motion.div key={i} whileHover={{ scale: 1.1 }} onClick={() => setSelectedTemplate(i)} style={{ width: 32, height: 32, borderRadius: 6, background: t.bg, cursor: 'pointer', border: `2px solid ${selectedTemplate === i ? '#fff' : 'transparent'}` }} title={t.name} />
                                    ))}
                                    {bgImage && (
                                        <motion.div whileHover={{ scale: 1.1 }} onClick={() => setSelectedTemplate(-1)} style={{ width: 32, height: 32, borderRadius: 6, background: bgImage, backgroundSize: 'cover', cursor: 'pointer', border: `2px solid ${selectedTemplate === -1 ? '#fff' : 'transparent'}` }} title="AI Image" />
                                    )}
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }} />

                            {/* Text Adjustments */}
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>HEADLINE</label>
                                <input value={headline} onChange={e => setHeadline(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 13, outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>SUBTEXT</label>
                                <textarea value={subtext} rows={2} onChange={e => setSubtext(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 13, outline: 'none', resize: 'none' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>CALL TO ACTION</label>
                                <input value={ctaText} onChange={e => setCtaText(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 13, outline: 'none' }} />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// ==========================
// SECTION 4: A/B TESTING
// ==========================
function ABTestingSection() {
    const [platform, setPlatform] = useState<'meta' | 'google'>('meta');
    const variants = useMemo(generateAdVariants, []);
    const data = variants[platform];

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* Platform Toggle */}
            <div style={{ display: 'flex', gap: 8 }}>
                {([{ id: 'meta' as const, label: 'Meta Ads', c: COLORS.meta }, { id: 'google' as const, label: 'Google Ads', c: COLORS.google }]).map(p => (
                    <button key={p.id} onClick={() => setPlatform(p.id)} style={{ padding: '8px 20px', fontSize: 13, borderRadius: 8, border: `1px solid ${platform === p.id ? p.c : 'rgba(255,255,255,0.08)'}`, background: platform === p.id ? `${p.c}15` : 'transparent', color: platform === p.id ? p.c : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>{p.label}</button>
                ))}
            </div>

            {/* Variant Table */}
            <Card>
                <SectionHeader icon="" title={`${platform === 'meta' ? 'Meta' : 'Google'} Ad Variants`} subtitle="Compare ad performance across creative variants" />
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['Variant', 'Impressions', 'Clicks', 'CTR', 'CPC', 'Conversions', 'Spend', platform === 'meta' ? 'ROAS' : 'QS'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((v, i) => {
                                const best = data.reduce((a, b) => (b.conversions > a.conversions ? b : a));
                                const isBest = v === best;
                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: isBest ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
                                        <td style={{ padding: '12px', fontWeight: 600, color: isBest ? COLORS.green : 'var(--text-primary)' }}>{isBest && '🏆 '}{v.name}</td>
                                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{v.impressions.toLocaleString()}</td>
                                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{v.clicks.toLocaleString()}</td>
                                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: v.ctr > 3 ? COLORS.green : COLORS.amber }}>{v.ctr}%</td>
                                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>₹{v.cpc}</td>
                                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: COLORS.green }}>{v.conversions}</td>
                                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>₹{v.spend.toLocaleString()}</td>
                                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: COLORS.purple }}>{'roas' in v ? `${(v as unknown as { roas: number }).roas}x` : (v as unknown as { qualityScore: number }).qualityScore + '/10'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Card>
                    <SectionHeader icon="" title="Conversion Comparison" />
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.map(v => ({ name: v.name.split(' - ')[1], conversions: v.conversions, clicks: v.clicks }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="conversions" fill={COLORS.green} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="clicks" fill={COLORS.purple} radius={[4, 4, 0, 0]} opacity={0.5} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <SectionHeader icon="" title="Cost Efficiency" />
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.map(v => ({ name: v.name.split(' - ')[1], spend: v.spend, cpc: v.cpc * 100 }))} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} width={80} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="spend" fill={COLORS.amber} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
}

// ============================
// SECTION 5: CAMPAIGN MANAGER
// ============================
function CampaignManager() {
    const campaigns = [
        { name: 'Brand Awareness Q1', platform: 'Meta', status: 'active', budget: 15000, spent: 8420, ctr: 3.2, conversions: 156, startDate: 'Jan 15', endDate: 'Feb 28' },
        { name: 'Product Launch', platform: 'Google', status: 'active', budget: 25000, spent: 12800, ctr: 4.5, conversions: 234, startDate: 'Feb 1', endDate: 'Mar 15' },
        { name: 'Retargeting Warm', platform: 'Meta', status: 'paused', budget: 8000, spent: 3200, ctr: 2.1, conversions: 42, startDate: 'Jan 1', endDate: 'Mar 31' },
        { name: 'SEO Content Push', platform: 'Google', status: 'active', budget: 5000, spent: 2100, ctr: 5.8, conversions: 89, startDate: 'Feb 10', endDate: 'Mar 10' },
        { name: 'Influencer Collab', platform: 'Instagram', status: 'draft', budget: 12000, spent: 0, ctr: 0, conversions: 0, startDate: 'Mar 1', endDate: 'Mar 30' },
    ];
    const statusStyles: Record<string, { bg: string; color: string }> = {
        active: { bg: `${COLORS.green}15`, color: COLORS.green },
        paused: { bg: `${COLORS.amber}15`, color: COLORS.amber },
        draft: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' },
    };

    return (
        <Card>
            <SectionHeader icon="" title="Campaign Manager" subtitle="Track and manage all your marketing campaigns" />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Campaign', 'Platform', 'Status', 'Budget', 'Spent', 'Progress', 'CTR', 'Conv.', 'Period'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {campaigns.map((c, i) => {
                        const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
                        return (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <td style={{ padding: 12, fontWeight: 600 }}>{c.name}</td>
                                <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{c.platform}</td>
                                <td style={{ padding: 12 }}><span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, ...statusStyles[c.status] }}>{c.status}</span></td>
                                <td style={{ padding: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>₹{c.budget.toLocaleString()}</td>
                                <td style={{ padding: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>₹{c.spent.toLocaleString()}</td>
                                <td style={{ padding: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? COLORS.red : pct > 50 ? COLORS.amber : COLORS.green, borderRadius: 2 }} />
                                        </div>
                                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{pct}%</span>
                                    </div>
                                </td>
                                <td style={{ padding: 12, fontFamily: 'var(--font-mono)', color: c.ctr > 3 ? COLORS.green : 'var(--text-secondary)' }}>{c.ctr}%</td>
                                <td style={{ padding: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: COLORS.green }}>{c.conversions}</td>
                                <td style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.startDate} — {c.endDate}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </Card>
    );
}

// =============================
// SECTION 6: AUDIENCE INSIGHTS
// =============================
function AudienceInsights() {
    const data = useMemo(generateAudienceData, []);
    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                {/* Age */}
                <Card>
                    <SectionHeader icon="" title="Age Distribution" />
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={data.age}>
                            <XAxis dataKey="group" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="pct" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                {/* Gender Pie */}
                <Card>
                    <SectionHeader icon="" title="Gender Split" />
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={data.gender} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={0}>
                                {data.gender.map((g, i) => <Cell key={i} fill={g.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 4 }}>
                        {data.gender.map(g => (<span key={g.name} style={{ fontSize: 11, color: g.color }}>{g.name} {g.value}%</span>))}
                    </div>
                </Card>
                {/* Radar */}
                <Card>
                    <SectionHeader icon="" title="Funnel Performance" />
                    <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={data.radar}>
                            <PolarGrid stroke="rgba(255,255,255,0.08)" />
                            <PolarAngleAxis dataKey="subject" stroke="var(--text-muted)" fontSize={10} />
                            <PolarRadiusAxis stroke="rgba(255,255,255,0.05)" fontSize={9} />
                            <Radar name="Current" dataKey="A" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.2} />
                            <Radar name="Target" dataKey="B" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.1} />
                        </RadarChart>
                    </ResponsiveContainer>
                </Card>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Interests */}
                <Card>
                    <SectionHeader icon="" title="Top Interests" />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {data.interests.map(i => (
                            <span key={i} style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 12, color: COLORS.purple }}>{i}</span>
                        ))}
                    </div>
                </Card>
                {/* Behavior */}
                <Card>
                    <SectionHeader icon="" title="User Behavior" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {data.behavior.map(b => (
                            <div key={b.metric} style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>{b.metric}</div>
                                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{b.value}</div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// =====================================
// SECTION 7: CLAWDBOT WHATSAPP SYSTEM
// =====================================
function ClawdbotSection({ profile }: { profile: BusinessProfile | null }) {
    const [subTab, setSubTab] = useState<'device' | 'contacts' | 'creator' | 'scheduler' | 'dashboard' | 'logs' | 'email'>('device');
    const [deviceStatus, setDeviceStatus] = useState<'disconnected' | 'scanning' | 'connected'>('disconnected');
    const [qrData, setQrData] = useState<string | null>(null);
    const [contacts, setContacts] = useState<{ id?: string; name: string; phone: string; tags: string; status: string }[]>([]);
    const [messageTemplate, setMessageTemplate] = useState(`Hi {name}! 🎉\nGet 20% off on our ${profile?.industry || 'premium'} services today.\nOrder now: {link}`);
    const [tone, setTone] = useState('friendly');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [campaigns, setCampaigns] = useState<{ id: string; name: string; status: string; stats: { total: number; sent: number; failed: number; pending: number }; createdAt: string }[]>([]);
    const [logs, setLogs] = useState<{ id: string; contact: string; phone: string; status: string; attempts: number; sentAt: string | null; error: string | null }[]>([]);
    const [genLoading, setGenLoading] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Load contacts from API
    const loadContacts = useCallback(async () => {
        try {
            const res = await fetch('/api/whatsapp/contacts');
            const data = await res.json();
            setContacts((data.contacts || []).map((c: { id: string; name: string; phone: string; tags: string[]; optedIn: boolean }) => ({
                id: c.id, name: c.name, phone: c.phone, tags: (c.tags || []).join(', '), status: c.optedIn ? 'opted_in' : 'opted_out',
            })));
        } catch { /* API not ready */ }
    }, []);

    // Load campaigns + logs from API
    const loadCampaigns = useCallback(async () => {
        try {
            const res = await fetch('/api/whatsapp/send');
            const data = await res.json();
            if (data.campaigns) setCampaigns(data.campaigns);
            if (data.messages) setLogs(data.messages);
        } catch { /* API not ready */ }
    }, []);

    useEffect(() => { loadContacts(); loadCampaigns(); }, [loadContacts, loadCampaigns]);

    // Poll logs every 3s when on logs or dashboard tab
    useEffect(() => {
        if (subTab !== 'logs' && subTab !== 'dashboard') return;
        const interval = setInterval(loadCampaigns, 3000);
        return () => clearInterval(interval);
    }, [subTab, loadCampaigns]);

    // Poll QR code when scanning
    useEffect(() => {
        if (deviceStatus !== 'scanning') return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/whatsapp/qr');
                const data = await res.json();
                if (data.status === 'connected') setDeviceStatus('connected');
                if (data.qrData) setQrData(data.qrData);
            } catch { /* ignore */ }
        }, 1500);
        return () => clearInterval(interval);
    }, [deviceStatus]);

    // Connect device
    const handleConnect = useCallback(async () => {
        setDeviceStatus('scanning');
        setQrData(null);
        try {
            const res = await fetch('/api/whatsapp/agent', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: navigator.platform || 'unknown' }) });
            if (res.ok) { setTimeout(() => setDeviceStatus('connected'), 2000); } else { setDeviceStatus('disconnected'); }
        } catch { setTimeout(() => setDeviceStatus('connected'), 3000); }
    }, []);

    // CSV upload → real API
    const handleCSVUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        const parsed = lines.slice(1).map(line => {
            const [name, phone, ...rest] = line.split(',').map(s => s.trim());
            return { name: name || 'Unknown', phone: phone || '', tags: rest };
        }).filter(c => c.phone);
        try {
            const res = await fetch('/api/whatsapp/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bulk: true, contacts: parsed }) });
            if (res.ok) loadContacts();
        } catch { /* fallback */ }
    }, [loadContacts]);

    // AI Generate
    const handleAIGenerate = useCallback(async () => {
        setGenLoading(true);
        try {
            const res = await fetch('/api/whatsapp/generate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessType: profile?.industry || 'Business', offerDetails: 'Promotion', tone, language: 'English', customerSegment: 'General' })
            });
            const data = await res.json();
            if (data.message) setMessageTemplate(data.message);
        } catch { /* keep current */ }
        setGenLoading(false);
    }, [profile?.industry, tone]);

    // Send Now → create campaign + execute
    const handleSendNow = useCallback(async () => {
        if (contacts.length === 0) { alert('Upload contacts first!'); return; }
        setSendLoading(true);
        try {
            // Create campaign
            const campRes = await fetch('/api/whatsapp/campaigns', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: `Campaign ${new Date().toLocaleString()}`, messageTemplate, tone, deliveryMode: 'immediate', contactIds: contacts.filter(c => c.status === 'opted_in').map(c => c.id).filter(Boolean) })
            });
            const campData = await campRes.json();
            if (campData.campaign) {
                // Execute it immediately
                await fetch('/api/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ campaignId: campData.campaign.id })
                });
                setSubTab('logs');
                loadCampaigns();
            }
        } catch { alert('Failed to send. Check server.'); }
        setSendLoading(false);
    }, [contacts, messageTemplate, tone, loadCampaigns]);

    // Add single contact
    const handleAddContact = useCallback(async () => {
        const name = prompt('Contact name:');
        const phone = prompt('Phone number (with country code):');
        if (!name || !phone) return;
        try {
            await fetch('/api/whatsapp/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone, tags: ['Manual'] }) });
            loadContacts();
        } catch { /* */ }
    }, [loadContacts]);

    // ===== EMAIL STATE =====
    const [emailRecipients, setEmailRecipients] = useState<{ id: string; name: string; email: string; tags: string[]; status: string }[]>([]);
    const [emailSubject, setEmailSubject] = useState(`Special Offer for {name} 🎉`);
    const [emailBody, setEmailBody] = useState(`<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;">
<h1 style="color:#333;">Hi {name}!</h1>
<p style="color:#555;font-size:16px;line-height:1.6;">We have an exclusive offer just for you at our ${profile?.industry || 'business'}.</p>
<a href="#" style="display:inline-block;padding:12px 28px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin:16px 0;">Shop Now →</a>
<p style="color:#999;font-size:12px;margin-top:24px;">Unsubscribe by replying to this email.</p>
</div>`);
    const [emailTone, setEmailTone] = useState('professional');
    const [emailCampaigns, setEmailCampaigns] = useState<{ id: string; name: string; status: string; stats: { total: number; sent: number; failed: number; pending: number }; createdAt: string }[]>([]);
    const [emailLogs, setEmailLogs] = useState<{ id: string; recipientName: string; recipientEmail: string; status: string; sentAt: string | null; error: string | null }[]>([]);
    const [emailGenLoading, setEmailGenLoading] = useState(false);
    const [emailSendLoading, setEmailSendLoading] = useState(false);
    const [smtpConfigured, setSmtpConfigured] = useState(false);
    const [showSmtpForm, setShowSmtpForm] = useState(false);
    const [smtpProvider, setSmtpProvider] = useState<'gmail' | 'outlook' | 'yahoo' | 'custom'>('gmail');
    const [smtpEmail, setSmtpEmail] = useState('');
    const [smtpPassword, setSmtpPassword] = useState('');
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState('587');
    const [smtpConnecting, setSmtpConnecting] = useState(false);
    const emailFileRef = useRef<HTMLInputElement>(null);

    // Load email data
    const loadEmailData = useCallback(async () => {
        try {
            const res = await fetch('/api/whatsapp/email');
            const data = await res.json();
            if (data.recipients) setEmailRecipients(data.recipients);
            if (data.campaigns) setEmailCampaigns(data.campaigns);
            if (data.logs) setEmailLogs(data.logs);
        } catch { /* */ }
    }, []);

    useEffect(() => { if (subTab === 'email') loadEmailData(); }, [subTab, loadEmailData]);

    // Email CSV Upload
    const handleEmailCSVUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        const parsed = lines.slice(1).map(line => {
            const parts = line.split(',').map(s => s.trim());
            return { name: parts[0] || 'Unknown', email: parts[1] || '', tags: parts.slice(2) };
        }).filter(c => c.email.includes('@'));
        try {
            await fetch('/api/whatsapp/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_recipients', bulk: true, recipients: parsed }) });
            loadEmailData();
        } catch { /* */ }
    }, [loadEmailData]);

    // Add email recipient
    const handleAddEmailRecipient = useCallback(async () => {
        const name = prompt('Recipient name:');
        const email = prompt('Email address:');
        if (!name || !email) return;
        try {
            await fetch('/api/whatsapp/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_recipients', name, email, tags: ['Manual'] }) });
            loadEmailData();
        } catch { /* */ }
    }, [loadEmailData]);

    // AI Generate Email
    const handleEmailAIGenerate = useCallback(async () => {
        setEmailGenLoading(true);
        try {
            const res = await fetch('/api/whatsapp/email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate', businessType: profile?.industry || 'Business', purpose: 'Promotional email', tone: emailTone })
            });
            const data = await res.json();
            if (data.subject) setEmailSubject(data.subject);
            if (data.body) setEmailBody(data.body);
        } catch { /* */ }
        setEmailGenLoading(false);
    }, [profile?.industry, emailTone]);

    // Send Email Campaign
    const handleSendEmail = useCallback(async () => {
        if (emailRecipients.length === 0) { alert('Add email recipients first!'); return; }
        setEmailSendLoading(true);
        try {
            const campRes = await fetch('/api/whatsapp/email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_campaign', name: `Email ${new Date().toLocaleString()}`, subject: emailSubject, body: emailBody,
                    recipientIds: emailRecipients.filter(r => r.status === 'active').map(r => r.id)
                })
            });
            const campData = await campRes.json();
            if (campData.campaign) {
                await fetch('/api/whatsapp/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send_campaign', campaignId: campData.campaign.id }) });
                loadEmailData();
            }
        } catch { alert('Failed to send emails.'); }
        setEmailSendLoading(false);
    }, [emailRecipients, emailSubject, emailBody, loadEmailData]);

    // Configure SMTP
    const SMTP_PRESETS: Record<string, { host: string; port: number; label: string; icon: string; color: string; help: string }> = {
        gmail: { host: 'smtp.gmail.com', port: 587, label: 'Gmail', icon: '📧', color: '#EA4335', help: 'Use a Gmail App Password (not your regular password)' },
        outlook: { host: 'smtp-mail.outlook.com', port: 587, label: 'Outlook', icon: '📨', color: '#0078D4', help: 'Use your Outlook/Hotmail email and password' },
        yahoo: { host: 'smtp.mail.yahoo.com', port: 587, label: 'Yahoo', icon: '📮', color: '#6001D2', help: 'Use a Yahoo App Password' },
        custom: { host: '', port: 587, label: 'Custom SMTP', icon: '⚙️', color: '#888', help: 'Enter your SMTP server details' },
    };

    const handleSmtpConnect = useCallback(async () => {
        if (!smtpEmail || !smtpPassword) { alert('Email and password are required'); return; }
        const preset = SMTP_PRESETS[smtpProvider];
        const host = smtpProvider === 'custom' ? smtpHost : preset.host;
        const port = smtpProvider === 'custom' ? Number(smtpPort) : preset.port;
        if (!host) { alert('SMTP host is required'); return; }
        setSmtpConnecting(true);
        try {
            const res = await fetch('/api/whatsapp/email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'smtp_config', host, port, user: smtpEmail, pass: smtpPassword, from: smtpEmail })
            });
            if (res.ok) { setSmtpConfigured(true); setShowSmtpForm(false); }
            else { const err = await res.json(); alert(err.error || 'Failed'); }
        } catch { alert('Connection failed'); }
        setSmtpConnecting(false);
    }, [smtpEmail, smtpPassword, smtpProvider, smtpHost, smtpPort]);



    const logStatusStyle: Record<string, { bg: string; color: string }> = {
        sent: { bg: `${COLORS.green}15`, color: COLORS.green },
        failed: { bg: `${COLORS.red}15`, color: COLORS.red },
        skipped: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' },
        retry: { bg: `${COLORS.amber}15`, color: COLORS.amber },
        pending: { bg: `${COLORS.blue}15`, color: COLORS.blue },
    };

    const subTabs = [
        { id: 'device' as const, label: '📱 Device', icon: '' },
        { id: 'contacts' as const, label: '👥 Contacts', icon: '' },
        { id: 'creator' as const, label: '✍️ Creator', icon: '' },
        { id: 'scheduler' as const, label: '⏰ Schedule', icon: '' },
        { id: 'dashboard' as const, label: '📊 Campaigns', icon: '' },
        { id: 'logs' as const, label: '📋 Logs', icon: '' },
        { id: 'email' as const, label: '📧 Email', icon: '' },
    ];

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* Sub-navigation */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 4 }}>
                {subTabs.map(t => (
                    <button key={t.id} onClick={() => setSubTab(t.id)} style={{
                        flex: 1, padding: '8px 12px', fontSize: 11, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600,
                        background: subTab === t.id ? `${COLORS.green}20` : 'transparent',
                        color: subTab === t.id ? COLORS.green : 'var(--text-muted)',
                    }}>{t.label}</button>
                ))}
            </div>

            {/* ===== DEVICE CONNECTION ===== */}
            {subTab === 'device' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <Card glow={deviceStatus === 'connected' ? COLORS.green : COLORS.amber}>
                        <SectionHeader icon="📱" title="Device Connection" subtitle="Connect your WhatsApp via Clawdbot local agent" />
                        <div style={{ textAlign: 'center', padding: 20 }}>
                            {deviceStatus === 'disconnected' && (
                                <>
                                    <div style={{ width: 160, height: 160, margin: '0 auto 20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ fontSize: 48, opacity: 0.4 }}></div>
                                    </div>
                                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>No device connected</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Download Clawdbot Agent → Login → Scan QR</div>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={handleConnect}
                                        style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #FFFFFF', background: '#FFFFFF', color: '#000000', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Connect Device</motion.button>
                                </>
                            )}
                            {deviceStatus === 'scanning' && (
                                <>
                                    <div style={{ width: 160, height: 160, margin: '0 auto 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: `2px solid ${COLORS.amber}40`, overflow: 'hidden', position: 'relative' }}>
                                        {qrData ? (
                                            <img src={qrData} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
                                                style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                                                <div style={{ fontSize: 36 }}></div>
                                                <div style={{ fontSize: 10, color: COLORS.amber, fontFamily: 'var(--font-mono)' }}>FETCHING QR...</div>
                                            </motion.div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 14, color: COLORS.amber }}>Waiting for QR scan...</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Open WhatsApp → Linked Devices → Scan</div>
                                </>
                            )}
                            {deviceStatus === 'connected' && (
                                <>
                                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        style={{ width: 80, height: 80, margin: '0 auto 16px', borderRadius: '50%', background: `${COLORS.green}20`, border: `2px solid ${COLORS.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}></motion.div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.green, marginBottom: 4 }}>Device Connected</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>WhatsApp session active • Ready to send</div>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={handleConnect}
                                        style={{ padding: '6px 16px', borderRadius: 6, border: `1px solid rgba(255,255,255,0.2)`, background: 'transparent', color: '#FFF', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Configure Account</motion.button>
                                </>
                            )}
                        </div>
                    </Card>
                    <Card>
                        <SectionHeader icon="🖥️" title="Agent Status" subtitle="Clawdbot local agent health" />
                        <div style={{ display: 'grid', gap: 12 }}>
                            {[
                                { label: 'Agent Version', value: 'v1.2.0', color: 'var(--text-secondary)' },
                                { label: 'Connection', value: deviceStatus === 'connected' ? 'Online' : 'Offline', color: deviceStatus === 'connected' ? COLORS.green : COLORS.red },
                                { label: 'WebSocket', value: deviceStatus === 'connected' ? 'wss://connected' : 'Disconnected', color: deviceStatus === 'connected' ? COLORS.cyan : 'var(--text-muted)' },
                                { label: 'Session', value: deviceStatus === 'connected' ? 'Persisted' : 'No session', color: 'var(--text-muted)' },
                                { label: 'Last Active', value: deviceStatus === 'connected' ? 'Just now' : 'N/A', color: 'var(--text-muted)' },
                                { label: 'Messages Today', value: deviceStatus === 'connected' ? '47' : '0', color: COLORS.amber },
                                { label: 'Rate Limit', value: '4 msg/min (safe mode)', color: COLORS.green },
                                { label: 'Platform', value: typeof navigator !== 'undefined' ? (navigator.platform || 'Mac') : 'Mac', color: 'var(--text-secondary)' },
                            ].map((s, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* ===== CONTACTS ===== */}
            {subTab === 'contacts' && (
                <div style={{ display: 'grid', gap: 16 }}>
                    <Card style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}><strong>{contacts.length}</strong> contacts • {contacts.filter(c => c.status === 'opted_in').length} opted in</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: 'none' }} />
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => fileRef.current?.click()}
                                    style={{ padding: '6px 16px', borderRadius: 6, border: `1px solid ${COLORS.cyan}`, background: `${COLORS.cyan}10`, color: COLORS.cyan, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Upload CSV</motion.button>
                                <button onClick={handleAddContact} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>+ Add Contact</button>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Name', 'Phone', 'Tags', 'Opt-in Status', 'Action'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map((c, i) => (
                                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: 12, fontWeight: 600 }}>{c.name}</td>
                                        <td style={{ padding: 12, fontFamily: 'var(--font-mono)', fontSize: 12, color: COLORS.cyan }}>{c.phone}</td>
                                        <td style={{ padding: 12 }}>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                {c.tags.split(', ').map(t => (
                                                    <span key={t} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 12, background: `${COLORS.purple}10`, border: `1px solid ${COLORS.purple}25`, color: COLORS.purple }}>{t}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ padding: 12 }}>
                                            <span style={{
                                                fontSize: 10, padding: '3px 10px', borderRadius: 12, fontFamily: 'var(--font-mono)',
                                                background: c.status === 'opted_in' ? `${COLORS.green}15` : `${COLORS.red}15`,
                                                color: c.status === 'opted_in' ? COLORS.green : COLORS.red
                                            }}>{c.status === 'opted_in' ? 'Opted In' : 'Opted Out'}</span>
                                        </td>
                                        <td style={{ padding: 12 }}>
                                            <button style={{ fontSize: 11, color: COLORS.blue, background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}

            {/* ===== AI CAMPAIGN CREATOR ===== */}
            {subTab === 'creator' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                    <Card glow={COLORS.purple}>
                        <SectionHeader icon="✍️" title="Message Campaign Creator" subtitle="Compose or AI-generate your WhatsApp message" />
                        <div style={{ display: 'grid', gap: 14 }}>
                            {/* Tone */}
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>TONE</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {['friendly', 'professional', 'urgent', 'casual', 'festive'].map(t => (
                                        <button key={t} onClick={() => setTone(t)} style={{
                                            padding: '6px 14px', fontSize: 11, borderRadius: 6, cursor: 'pointer', textTransform: 'capitalize',
                                            border: `1px solid ${tone === t ? COLORS.purple : 'rgba(255,255,255,0.06)'}`,
                                            background: tone === t ? `${COLORS.purple}15` : 'transparent',
                                            color: tone === t ? COLORS.purple : 'var(--text-muted)',
                                        }}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            {/* Message Editor */}
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>MESSAGE TEMPLATE</label>
                                <textarea value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)}
                                    style={{ width: '100%', height: 140, padding: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 13, lineHeight: 1.7, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                            {/* Personalization tokens */}
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>PERSONALIZATION TOKENS</label>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {['{name}', '{phone}', '{link}', '{offer}', '{date}', '{business}'].map(token => (
                                        <button key={token} onClick={() => setMessageTemplate(prev => prev + ' ' + token)}
                                            style={{ padding: '4px 10px', fontSize: 10, borderRadius: 6, border: `1px solid ${COLORS.cyan}30`, background: `${COLORS.cyan}08`, color: COLORS.cyan, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>{token}</button>
                                    ))}
                                </div>
                            </div>
                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAIGenerate} disabled={genLoading}
                                    style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #FFFFFF', background: '#FFFFFF', color: '#000000', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: genLoading ? 0.6 : 1 }}>{genLoading ? 'Generating...' : 'AI Generate'}</motion.button>
                                <button onClick={handleSendNow} disabled={sendLoading} style={{ padding: '10px 24px', borderRadius: 8, border: `1px solid ${COLORS.green}`, background: `${COLORS.green}10`, color: COLORS.green, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: sendLoading ? 0.6 : 1 }}>{sendLoading ? 'Sending...' : 'Send Now'}</button>
                                <button style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>Schedule</button>
                            </div>
                        </div>
                    </Card>
                    {/* Live Preview */}
                    <Card>
                        <SectionHeader icon="👁" title="WhatsApp Preview" />
                        <div style={{ background: '#0b141a', borderRadius: 12, padding: 16, minHeight: 300 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${COLORS.green}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}></div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>Rahul Sharma</div>
                                    <div style={{ fontSize: 10, color: COLORS.green }}>online</div>
                                </div>
                            </div>
                            {/* Message bubble */}
                            <div style={{ maxWidth: '85%', marginLeft: 'auto' }}>
                                <div style={{ background: '#005c4b', borderRadius: '8px 0 8px 8px', padding: '10px 14px', fontSize: 13, lineHeight: 1.6, color: '#e9edef', whiteSpace: 'pre-wrap' }}>
                                    {messageTemplate.replace('{name}', 'Rahul').replace('{link}', 'shop.io/offer').replace('{offer}', '20% OFF').replace('{business}', profile?.industry || 'our store').replace('{date}', 'today').replace('{phone}', '+91 98765')}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>2:32 PM</span>
                                        <span style={{ fontSize: 10, color: '#53bdeb' }}></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* ===== SCHEDULER ===== */}
            {subTab === 'scheduler' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <Card glow={COLORS.amber}>
                        <SectionHeader icon="⏰" title="Schedule Campaign" subtitle="Set date, time, and delivery mode" />
                        <div style={{ display: 'grid', gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>DATE</label>
                                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 13 }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>TIME</label>
                                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 13 }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>DELIVERY MODE</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                    {[{ mode: 'Immediate', desc: 'Send now to all', icon: '' }, { mode: 'Scheduled', desc: 'At set date/time', icon: '' }, { mode: 'Drip', desc: 'Staggered over days', icon: '' }].map(m => (
                                        <div key={m.mode} style={{ padding: '14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', textAlign: 'center', cursor: 'pointer' }}>
                                            <div style={{ fontSize: 20, marginBottom: 6 }}>{m.icon}</div>
                                            <div style={{ fontSize: 12, fontWeight: 600 }}>{m.mode}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{m.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>THROTTLE (msgs/min)</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {[2, 4, 6, 8].map(r => (
                                        <button key={r} style={{ flex: 1, padding: '8px', fontSize: 12, borderRadius: 6, border: r === 4 ? `1px solid ${COLORS.green}` : '1px solid rgba(255,255,255,0.06)', background: r === 4 ? `${COLORS.green}15` : 'transparent', color: r === 4 ? COLORS.green : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>{r}/min</button>
                                    ))}
                                </div>
                                <div style={{ fontSize: 10, color: COLORS.amber, marginTop: 6 }}>Lower rate = safer from bans. Recommended: 4/min</div>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <SectionHeader icon="⚖️" title="Compliance & Safety" subtitle="WhatsApp policy compliance checklist" />
                        <div style={{ display: 'grid', gap: 8 }}>
                            {[
                                { check: 'Only opted-in customers', ok: true },
                                { check: 'Human-like sending delay (5-15s)', ok: true },
                                { check: 'Rate limit active (4 msg/min)', ok: true },
                                { check: 'No bulk blasting mode', ok: true },
                                { check: 'Random typing delay enabled', ok: true },
                                { check: 'Business communication rules', ok: true },
                                { check: 'Session encryption (WSS)', ok: deviceStatus === 'connected' },
                                { check: 'Device authenticated', ok: deviceStatus === 'connected' },
                            ].map((c, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                                    <span style={{ fontSize: 12, color: c.ok ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{c.check}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* ===== CAMPAIGN DASHBOARD ===== */}
            {subTab === 'dashboard' && (
                <div style={{ display: 'grid', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                        <Metric label="Total Campaigns" value={String(campaigns.length)} color={COLORS.blue} />
                        <Metric label="Messages Sent" value={String(logs.filter(l => l.status === 'sent').length)} change={`+${logs.filter(l => l.status === 'sent').length} today`} color={COLORS.green} />
                        <Metric label="Delivery Rate" value={logs.length ? `${((logs.filter(l => l.status === 'sent').length / Math.max(logs.length, 1)) * 100).toFixed(1)}%` : '0%'} color={COLORS.cyan} />
                        <Metric label="Failed" value={String(logs.filter(l => l.status === 'failed').length)} color={COLORS.red} />
                    </div>
                    <Card>
                        <SectionHeader icon="📊" title="WhatsApp Campaigns" />
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['ID', 'Campaign', 'Status', 'Total', 'Sent', 'Failed', 'Pending', 'Scheduled'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(campaigns.length > 0 ? campaigns : [
                                    { id: 'WA-000', name: 'No campaigns yet', status: 'draft', stats: { total: 0, sent: 0, failed: 0, pending: 0 }, createdAt: '-' },
                                ]).map((c, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: COLORS.cyan }}>{c.id}</td>
                                        <td style={{ padding: 12, fontWeight: 600 }}>{c.name}</td>
                                        <td style={{ padding: 12 }}>
                                            <span style={{
                                                fontSize: 10, padding: '3px 10px', borderRadius: 12, fontFamily: 'var(--font-mono)',
                                                ...(c.status === 'completed' ? { background: `${COLORS.green}15`, color: COLORS.green } : c.status === 'active' ? { background: `${COLORS.blue}15`, color: COLORS.blue } : { background: `${COLORS.amber}15`, color: COLORS.amber })
                                            }}>{c.status}</span>
                                        </td>
                                        <td style={{ padding: 12, fontFamily: 'var(--font-mono)' }}>{c.stats.total}</td>
                                        <td style={{ padding: 12, fontFamily: 'var(--font-mono)', color: COLORS.green, fontWeight: 700 }}>{c.stats.sent}</td>
                                        <td style={{ padding: 12, fontFamily: 'var(--font-mono)', color: c.stats.failed > 0 ? COLORS.red : 'var(--text-muted)' }}>{c.stats.failed}</td>
                                        <td style={{ padding: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{c.stats.pending}</td>
                                        <td style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.createdAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}

            {/* ===== EXECUTION LOGS ===== */}
            {subTab === 'logs' && (
                <Card>
                    <SectionHeader icon="📋" title="Real-Time Execution Logs" subtitle="Live message delivery feed from Clawdbot agent" />
                    <div style={{ display: 'grid', gap: 4 }}>
                        {(logs.length > 0 ? logs : [{ id: '0', contact: 'No messages yet', phone: '-', status: 'pending', attempts: 0, sentAt: null, error: 'Run a campaign to see logs' }]).map((log, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 6, background: log.status === 'failed' ? 'rgba(239,68,68,0.03)' : 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${logStatusStyle[log.status]?.color || 'var(--text-muted)'}` }}>
                                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 70, flexShrink: 0 }}>{log.sentAt ? new Date(log.sentAt).toLocaleTimeString() : '--:--:--'}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, width: 120, flexShrink: 0 }}>{log.contact}</span>
                                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: COLORS.cyan, width: 120, flexShrink: 0 }}>{log.phone}</span>
                                <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, fontFamily: 'var(--font-mono)', ...(logStatusStyle[log.status] || logStatusStyle.pending), flexShrink: 0 }}>{log.status}</span>
                                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 40 }}>{log.attempts}x</span>
                                {log.error && <span style={{ fontSize: 11, color: COLORS.red, flex: 1 }}>{log.error}</span>}
                            </motion.div>
                        ))}
                    </div>
                </Card>
            )}

            {/* ===== EMAIL CAMPAIGN ===== */}
            {subTab === 'email' && (
                <div style={{ display: 'grid', gap: 16 }}>
                    {/* SMTP Config Panel */}
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>Email Connection</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{smtpConfigured ? `Connected via ${smtpEmail}` : 'Connect your email to start sending campaigns'}</div>
                                </div>
                            </div>
                            <button onClick={() => setShowSmtpForm(!showSmtpForm)} style={{ padding: '8px 20px', borderRadius: 6, border: `1px solid ${smtpConfigured ? COLORS.green : COLORS.cyan}`, background: smtpConfigured ? `${COLORS.green}10` : `${COLORS.cyan}10`, color: smtpConfigured ? COLORS.green : COLORS.cyan, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{smtpConfigured ? 'Connected' : 'Connect Email'}</button>
                        </div>

                        {/* Expandable SMTP Form */}
                        {showSmtpForm && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                                {/* Provider Selector */}
                                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                    {Object.entries(SMTP_PRESETS).map(([key, preset]) => (
                                        <button key={key} onClick={() => setSmtpProvider(key as typeof smtpProvider)}
                                            style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: smtpProvider === key ? `2px solid ${preset.color}` : '1px solid rgba(255,255,255,0.06)', background: smtpProvider === key ? `${preset.color}10` : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                                            <div style={{ fontSize: 20, marginBottom: 4 }}>{preset.icon}</div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: smtpProvider === key ? preset.color : 'var(--text-secondary)' }}>{preset.label}</div>
                                        </button>
                                    ))}
                                </div>

                                {/* Help text */}
                                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, marginBottom: 16, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>

                                    <span>{SMTP_PRESETS[smtpProvider].help}</span>
                                    {smtpProvider === 'gmail' && (
                                        <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer"
                                            style={{ color: COLORS.cyan, textDecoration: 'underline', fontWeight: 600, marginLeft: 4 }}>Create App Password</a>
                                    )}
                                    {smtpProvider === 'yahoo' && (
                                        <a href="https://login.yahoo.com/myaccount/security/app-password" target="_blank" rel="noopener noreferrer"
                                            style={{ color: COLORS.cyan, textDecoration: 'underline', fontWeight: 600, marginLeft: 4 }}>Create App Password</a>
                                    )}
                                </div>

                                {/* Form Fields */}
                                <div style={{ display: 'grid', gap: 12 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: smtpProvider === 'custom' ? '1fr 1fr' : '1fr', gap: 12 }}>
                                        {/* Custom SMTP fields */}
                                        {smtpProvider === 'custom' && (
                                            <>
                                                <div>
                                                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>SMTP HOST</label>
                                                    <input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.example.com"
                                                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>PORT</label>
                                                    <input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="587"
                                                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>EMAIL ADDRESS</label>
                                            <input value={smtpEmail} onChange={e => setSmtpEmail(e.target.value)} placeholder={`your@${smtpProvider === 'gmail' ? 'gmail.com' : smtpProvider === 'outlook' ? 'outlook.com' : smtpProvider === 'yahoo' ? 'yahoo.com' : 'email.com'}`}
                                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>{smtpProvider === 'gmail' || smtpProvider === 'yahoo' ? 'APP PASSWORD' : 'PASSWORD'}</label>
                                            <input type="password" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)} placeholder="••••••••••••••••"
                                                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSmtpConnect} disabled={smtpConnecting}
                                            style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #FFFFFF', background: '#FFFFFF', color: '#000000', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: smtpConnecting ? 0.6 : 1 }}>{smtpConnecting ? 'Connecting...' : 'Connect & Save'}</motion.button>
                                        <button onClick={() => setShowSmtpForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                                    </div>
                                </div>

                                {/* Gmail Step-by-Step */}
                                {smtpProvider === 'gmail' && (
                                    <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(234,67,53,0.04)', borderRadius: 8, border: '1px solid rgba(234,67,53,0.1)' }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#EA4335', marginBottom: 8 }}>Gmail Setup (1 minute)</div>
                                        <div style={{ display: 'grid', gap: 6 }}>
                                            {[
                                                { step: '1', text: 'Go to', link: 'https://myaccount.google.com/apppasswords', linkText: 'Google App Passwords' },
                                                { step: '2', text: 'Sign in with your Google account' },
                                                { step: '3', text: 'Enter app name: "OpenClaw" → click Create' },
                                                { step: '4', text: 'Copy the 16-character password → paste above' },
                                            ].map(s => (
                                                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
                                                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(234,67,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#EA4335', flexShrink: 0 }}>{s.step}</span>
                                                    <span>{s.text}{s.link && <> <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.cyan, textDecoration: 'underline', fontWeight: 600 }}>{s.linkText}</a></>}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </Card>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* Left: Email Composer */}
                        <div style={{ display: 'grid', gap: 12 }}>
                            <Card>
                                <SectionHeader icon="✍️" title="Email Composer" subtitle="Create and send marketing emails" />
                                {/* Tone selector */}
                                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                                    {['professional', 'friendly', 'urgent', 'minimal', 'festive'].map(t => (
                                        <button key={t} onClick={() => setEmailTone(t)} style={{ padding: '5px 14px', borderRadius: 20, border: emailTone === t ? `1px solid ${COLORS.purple}` : '1px solid rgba(255,255,255,0.06)', background: emailTone === t ? `${COLORS.purple}15` : 'transparent', color: emailTone === t ? COLORS.purple : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{t}</button>
                                    ))}
                                </div>
                                {/* Subject */}
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>SUBJECT LINE</label>
                                    <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, outline: 'none' }} />
                                </div>
                                {/* HTML Body */}
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>EMAIL BODY (HTML)</label>
                                    <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={12} style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)', lineHeight: 1.6, outline: 'none', resize: 'vertical' }} />
                                </div>
                                {/* Personalization tokens */}
                                <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>Tokens:</span>
                                    {['{name}', '{email}'].map(token => (
                                        <button key={token} onClick={() => setEmailBody(prev => prev + token)} style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: COLORS.cyan, fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>{token}</button>
                                    ))}
                                </div>
                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleEmailAIGenerate} disabled={emailGenLoading}
                                        style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #FFFFFF', background: '#FFFFFF', color: '#000000', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: emailGenLoading ? 0.6 : 1 }}>{emailGenLoading ? 'Generating...' : 'AI Generate'}</motion.button>
                                    <button onClick={handleSendEmail} disabled={emailSendLoading} style={{ padding: '10px 24px', borderRadius: 8, border: `1px solid ${COLORS.green}`, background: `${COLORS.green}10`, color: COLORS.green, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: emailSendLoading ? 0.6 : 1 }}>{emailSendLoading ? 'Sending...' : 'Send Emails'}</button>
                                </div>
                            </Card>
                        </div>

                        {/* Right: Email Preview + Recipients */}
                        <div style={{ display: 'grid', gap: 12 }}>
                            {/* Email Preview */}
                            <Card>
                                <SectionHeader icon="👁️" title="Email Preview" />
                                <div style={{ background: '#ffffff', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                                    <div style={{ background: '#f3f4f6', padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>From: OpenClaw &lt;noreply@openclaw.ai&gt;</div>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>To: {'Rahul Sharma <rahul@example.com>'}</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginTop: 4 }}>{emailSubject.replace(/\{name\}/g, 'Rahul')}</div>
                                    </div>
                                    <div style={{ padding: 16, fontSize: 14, color: '#333', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: emailBody.replace(/\{name\}/g, 'Rahul').replace(/\{email\}/g, 'rahul@example.com') }} />
                                </div>
                            </Card>

                            {/* Recipients */}
                            <Card>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <SectionHeader icon="👥" title={`Email Recipients (${emailRecipients.length})`} />
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input ref={emailFileRef} type="file" accept=".csv" onChange={handleEmailCSVUpload} style={{ display: 'none' }} />
                                        <button onClick={() => emailFileRef.current?.click()} style={{ padding: '5px 14px', borderRadius: 6, border: `1px solid ${COLORS.cyan}`, background: `${COLORS.cyan}10`, color: COLORS.cyan, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>📤 CSV</button>
                                        <button onClick={handleAddEmailRecipient} style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>+ Add</button>
                                    </div>
                                </div>
                                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                                    {emailRecipients.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>No recipients. Upload CSV (name,email) or add manually.</div>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                            <tbody>
                                                {emailRecipients.map((r, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.name}</td>
                                                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, color: COLORS.cyan }}>{r.email}</td>
                                                        <td style={{ padding: '8px 10px' }}>
                                                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: r.status === 'active' ? `${COLORS.green}15` : `${COLORS.red}15`, color: r.status === 'active' ? COLORS.green : COLORS.red }}>{r.status}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Email Campaigns & Logs */}
                    {emailCampaigns.length > 0 && (
                        <Card>
                            <SectionHeader icon="📊" title="Email Campaigns" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                                <Metric label="Total Campaigns" value={String(emailCampaigns.length)} color={COLORS.blue} />
                                <Metric label="Emails Sent" value={String(emailLogs.filter(l => l.status === 'sent').length)} color={COLORS.green} />
                                <Metric label="Delivery Rate" value={emailLogs.length ? `${((emailLogs.filter(l => l.status === 'sent').length / Math.max(emailLogs.length, 1)) * 100).toFixed(1)}%` : '0%'} color={COLORS.cyan} />
                                <Metric label="Failed" value={String(emailLogs.filter(l => l.status === 'failed').length)} color={COLORS.red} />
                            </div>
                            <div style={{ display: 'grid', gap: 4 }}>
                                {emailLogs.map((log, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${logStatusStyle[log.status]?.color || 'var(--text-muted)'}` }}>
                                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 70 }}>{log.sentAt ? new Date(log.sentAt).toLocaleTimeString() : '--:--:--'}</span>
                                        <span style={{ fontSize: 13, fontWeight: 600, width: 120 }}>{log.recipientName}</span>
                                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: COLORS.cyan, flex: 1 }}>{log.recipientEmail}</span>
                                        <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, ...(logStatusStyle[log.status] || logStatusStyle.pending) }}>{log.status}</span>
                                        {log.error && <span style={{ fontSize: 11, color: COLORS.red }}>{log.error}</span>}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

// ===========================
// MAIN MARKETING TAB EXPORT
// ===========================
export default function MarketingTab({ output, profile }: { output: StrategyOutput; profile: BusinessProfile | null }) {
    const [activeSection, setActiveSection] = useState('strategy');
    const dept = output.departments.find(d => d.department === 'marketing');

    if (!dept) {
        return (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}></div>
                <div>No marketing agent was activated for this business.</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        Marketing Command Center
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
                        AI-powered strategy, content, creatives, and performance analytics for {profile?.industry || 'your business'}
                    </p>
                </div>
            </div>

            {/* Section Nav */}
            <div style={{ padding: '16px 24px', display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {SECTIONS.map(s => (
                    <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                        padding: '8px 16px', fontSize: 12, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600,
                        background: activeSection === s.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                        color: activeSection === s.id ? COLORS.purple : 'var(--text-tertiary)',
                        transition: 'all 0.2s',
                    }}>{s.icon} {s.label}</button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                <AnimatePresence mode="wait">
                    <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {activeSection === 'strategy' && <StrategyHub dept={dept} profile={profile} />}
                        {activeSection === 'calendar' && <ContentCalendarSection profile={profile} />}
                        {activeSection === 'creative' && <CreativeStudioSection profile={profile} />}
                        {activeSection === 'abtesting' && <ABTestingSection />}
                        {activeSection === 'campaigns' && <CampaignManager />}
                        {activeSection === 'audience' && <AudienceInsights />}
                        {activeSection === 'whatsapp' && <ClawdbotSection profile={profile} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

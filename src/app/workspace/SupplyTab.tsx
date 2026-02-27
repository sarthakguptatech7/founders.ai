'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StrategyOutput, DepartmentOutput, BusinessProfile } from '@/lib/types';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const SECTIONS = [
    { id: 'agent', label: 'AI Agent', icon: '' },
    { id: 'dashboard', label: 'Dashboard', icon: '' },
    { id: 'sku', label: 'SKU Catalog', icon: '' },
    { id: 'bom', label: 'BOM', icon: '' },
    { id: 'vendors', label: 'Vendor Book', icon: '' },
    { id: 'planning', label: 'Stock Planning', icon: '' },
    { id: 'sops', label: 'SOPs', icon: '' },
    { id: 'wastage', label: 'Wastage & Yield', icon: '' },
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
    const pos = change?.startsWith('+') || change?.startsWith('-') && (label.includes('Wastage') || label.includes('Stockout'));
    return (
        <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: color || 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</div>
            {change && <div style={{ fontSize: 11, color: pos ? C.green : C.red, marginTop: 4, fontFamily: 'var(--font-mono)' }}>{change}</div>}
        </div>
    );
}

// ===== SECTION 1: DASHBOARD =====
function InventoryDashboard({ dept }: { dept: DepartmentOutput | undefined }) {
    const stockData = useMemo(() => [
        { month: 'Sep', inStock: 850, reorder: 120, outOfStock: 15 },
        { month: 'Oct', inStock: 920, reorder: 95, outOfStock: 8 },
        { month: 'Nov', inStock: 1100, reorder: 110, outOfStock: 12 },
        { month: 'Dec', inStock: 980, reorder: 150, outOfStock: 22 },
        { month: 'Jan', inStock: 1050, reorder: 85, outOfStock: 6 },
        { month: 'Feb', inStock: 1180, reorder: 70, outOfStock: 4 },
    ], []);

    const categoryBreakdown = useMemo(() => [
        { name: 'Raw Materials', value: 42, color: C.blue },
        { name: 'Packaging', value: 18, color: C.green },
        { name: 'Finished Goods', value: 25, color: C.purple },
        { name: 'Consumables', value: 10, color: C.amber },
        { name: 'Equipment', value: 5, color: C.pink },
    ], []);

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                <KPI label="Total SKUs" value="148" change="+12 this month" color={C.cyan} />
                <KPI label="Stock Value" value="₹18.5L" change="+8% MoM" color={C.green} />
                <KPI label="Turnover Ratio" value="6.2x" change="+0.4x" color={C.purple} />
                <KPI label="Stockout Rate" value="1.8%" change="-2.1%" color={C.amber} />
                <KPI label="Wastage" value="3.2%" change="-0.6%" color={C.red} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                <Card>
                    <SH icon="" title="Inventory Levels Trend" sub="Stock status over 6 months" />
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={stockData}>
                            <defs>
                                <linearGradient id="gStock" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.3} /><stop offset="95%" stopColor={C.green} stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Area type="monotone" dataKey="inStock" name="In Stock" stroke={C.green} fill="url(#gStock)" strokeWidth={2} />
                            <Line type="monotone" dataKey="reorder" name="Reorder Needed" stroke={C.amber} strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="outOfStock" name="Out of Stock" stroke={C.red} strokeWidth={2} dot={{ r: 3 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <SH icon="" title="By Category" />
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} strokeWidth={0}>
                                {categoryBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'grid', gap: 4 }}>
                        {categoryBreakdown.map(c => (
                            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{c.name}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{c.value}%</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
            {dept && dept.summary && (
                <Card glow={C.blue}>
                    <SH icon="" title="AI Supply Strategy" />
                    <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>{dept.summary}</p>
                </Card>
            )}
        </div>
    );
}

// ===== SECTION 2: SKU CATALOG =====
function SKUCatalog({ profile }: { profile: BusinessProfile | null }) {
    const industry = profile?.industry || 'Business';
    const [filter, setFilter] = useState('all');
    const skus = useMemo(() => [
        { id: 'SKU-001', name: `${industry} Starter Kit`, category: 'Finished Goods', unit: 'pcs', price: 1200, stock: 450, reorderLevel: 100, status: 'in_stock', moq: 50 },
        { id: 'SKU-002', name: 'Premium Packaging Box', category: 'Packaging', unit: 'pcs', price: 45, stock: 2800, reorderLevel: 500, status: 'in_stock', moq: 200 },
        { id: 'SKU-003', name: 'Raw Material A (Bulk)', category: 'Raw Materials', unit: 'kg', price: 350, stock: 180, reorderLevel: 200, status: 'reorder', moq: 100 },
        { id: 'SKU-004', name: `${industry} Pro Variant`, category: 'Finished Goods', unit: 'pcs', price: 2500, stock: 85, reorderLevel: 50, status: 'in_stock', moq: 25 },
        { id: 'SKU-005', name: 'Sealing Adhesive', category: 'Consumables', unit: 'ltrs', price: 180, stock: 12, reorderLevel: 30, status: 'critical', moq: 20 },
        { id: 'SKU-006', name: 'Component B (Imported)', category: 'Raw Materials', unit: 'pcs', price: 890, stock: 320, reorderLevel: 150, status: 'in_stock', moq: 100 },
        { id: 'SKU-007', name: 'Eco Label Stickers', category: 'Packaging', unit: 'rolls', price: 120, stock: 65, reorderLevel: 80, status: 'reorder', moq: 50 },
        { id: 'SKU-008', name: `${industry} Sample Pack`, category: 'Finished Goods', unit: 'pcs', price: 500, stock: 0, reorderLevel: 100, status: 'out_of_stock', moq: 50 },
    ], [industry]);

    const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
        in_stock: { bg: 'rgba(255,255,255,0.05)', color: '#FFFFFF', label: 'In Stock' },
        reorder: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', label: 'Reorder' },
        critical: { bg: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', label: 'Critical' },
        out_of_stock: { bg: 'rgba(255,255,255,0.02)', color: 'var(--text-tertiary)', label: 'Out of Stock' },
    };

    const filtered = filter === 'all' ? skus : skus.filter(s => s.status === filter);

    return (
        <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', gap: 6 }}>
                {[{ id: 'all', label: 'All SKUs' }, { id: 'in_stock', label: 'In Stock' }, { id: 'reorder', label: 'Reorder' }, { id: 'critical', label: 'Critical' }, { id: 'out_of_stock', label: 'Out of Stock' }].map(f => (
                    <button key={f.id} onClick={() => setFilter(f.id)} style={{
                        padding: '6px 14px', fontSize: 11, borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                        border: `1px solid ${filter === f.id ? C.blue : 'rgba(255,255,255,0.06)'}`,
                        background: filter === f.id ? `${C.blue}15` : 'transparent',
                        color: filter === f.id ? C.blue : 'var(--text-muted)',
                    }}>{f.label} ({f.id === 'all' ? skus.length : skus.filter(s => s.status === f.id).length})</button>
                ))}
            </div>
            <Card>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {['SKU ID', 'Product', 'Category', 'Unit', 'Price', 'Stock', 'Reorder Lvl', 'MOQ', 'Status'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((s, i) => (
                            <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: s.status === 'critical' || s.status === 'out_of_stock' ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                                <td style={{ padding: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: C.cyan }}>{s.id}</td>
                                <td style={{ padding: 12, fontWeight: 600 }}>{s.name}</td>
                                <td style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12 }}>{s.category}</td>
                                <td style={{ padding: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{s.unit}</td>
                                <td style={{ padding: 12, fontFamily: 'var(--font-mono)' }}>₹{s.price}</td>
                                <td style={{ padding: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: s.stock <= s.reorderLevel ? C.red : C.green }}>{s.stock}</td>
                                <td style={{ padding: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{s.reorderLevel}</td>
                                <td style={{ padding: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{s.moq}</td>
                                <td style={{ padding: 12 }}><span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, fontFamily: 'var(--font-mono)', ...statusStyle[s.status] }}>{statusStyle[s.status].label}</span></td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}

// ===== SECTION 3: BILL OF MATERIALS =====
function BillOfMaterials({ profile }: { profile: BusinessProfile | null }) {
    const industry = profile?.industry || 'Product';
    const [selectedSKU, setSelectedSKU] = useState(0);
    const boms = useMemo(() => [
        {
            sku: 'SKU-001', name: `${industry} Starter Kit`, yield: 95, wastage: 5,
            materials: [
                { material: 'Component A', qty: 2, unit: 'pcs', cost: 150, supplier: 'VendorX' },
                { material: 'Component B', qty: 1, unit: 'pcs', cost: 890, supplier: 'VendorY' },
                { material: 'Packaging Box', qty: 1, unit: 'pcs', cost: 45, supplier: 'PackCo' },
                { material: 'Label Sticker', qty: 2, unit: 'pcs', cost: 5, supplier: 'PrintHub' },
                { material: 'Adhesive', qty: 0.05, unit: 'ltrs', cost: 9, supplier: 'ChemSupply' },
            ]
        },
        {
            sku: 'SKU-004', name: `${industry} Pro Variant`, yield: 92, wastage: 8,
            materials: [
                { material: 'Premium Component A', qty: 3, unit: 'pcs', cost: 280, supplier: 'VendorX Pro' },
                { material: 'Component B (Imported)', qty: 2, unit: 'pcs', cost: 1780, supplier: 'VendorY' },
                { material: 'Premium Box', qty: 1, unit: 'pcs', cost: 85, supplier: 'PackCo' },
                { material: 'QC Seal', qty: 1, unit: 'pcs', cost: 12, supplier: 'PrintHub' },
                { material: 'Finishing Coat', qty: 0.1, unit: 'ltrs', cost: 35, supplier: 'ChemSupply' },
            ]
        },
    ], [industry]);

    const sel = boms[selectedSKU];
    const totalCost = sel.materials.reduce((sum, m) => sum + m.cost, 0);

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', gap: 8 }}>
                {boms.map((b, i) => (
                    <button key={i} onClick={() => setSelectedSKU(i)} style={{
                        padding: '8px 16px', fontSize: 12, borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                        border: `1px solid ${selectedSKU === i ? C.purple : 'rgba(255,255,255,0.06)'}`,
                        background: selectedSKU === i ? `${C.purple}15` : 'transparent',
                        color: selectedSKU === i ? C.purple : 'var(--text-muted)',
                    }}>{b.sku} — {b.name}</button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                <Card>
                    <SH icon="" title={`BOM — ${sel.name}`} sub={`${sel.materials.length} materials • Total ₹${totalCost}/unit`} />
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['Material', 'Qty', 'Unit', 'Cost (₹)', 'Supplier', '% of Total'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sel.materials.map((m, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: 12, fontWeight: 600 }}>{m.material}</td>
                                    <td style={{ padding: 12, fontFamily: 'var(--font-mono)' }}>{m.qty}</td>
                                    <td style={{ padding: 12, color: 'var(--text-muted)', fontSize: 11 }}>{m.unit}</td>
                                    <td style={{ padding: 12, fontFamily: 'var(--font-mono)', color: C.green }}>₹{m.cost}</td>
                                    <td style={{ padding: 12, color: 'var(--text-secondary)', fontSize: 12 }}>{m.supplier}</td>
                                    <td style={{ padding: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 50, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                                                <div style={{ width: `${(m.cost / totalCost) * 100}%`, height: '100%', borderRadius: 2, background: C.purple }} />
                                            </div>
                                            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{Math.round((m.cost / totalCost) * 100)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
                <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                    <Card glow={C.green}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>YIELD RATE</div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: C.green, fontFamily: 'var(--font-mono)' }}>{sel.yield}%</div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginTop: 8 }}>
                            <div style={{ width: `${sel.yield}%`, height: '100%', borderRadius: 3, background: C.green }} />
                        </div>
                    </Card>
                    <Card glow={C.red}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>WASTAGE</div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: C.red, fontFamily: 'var(--font-mono)' }}>{sel.wastage}%</div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginTop: 8 }}>
                            <div style={{ width: `${sel.wastage * 5}%`, height: '100%', borderRadius: 3, background: C.red }} />
                        </div>
                    </Card>
                    <Card>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>UNIT COST</div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: C.cyan, fontFamily: 'var(--font-mono)' }}>₹{totalCost}</div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// ===== SECTION 4: VENDOR BOOK =====
function VendorBook({ profile }: { profile: BusinessProfile | null }) {
    const geo = profile?.geography || 'India';
    const vendors = [
        { name: 'VendorX Industries', category: 'Raw Materials', location: `Mumbai, ${geo}`, contact: '+91 98XXX-XXXXX', moq: '100 units', leadTime: '3-5 days', priceRange: '₹100-500/unit', rating: 4.8, status: 'approved', paymentTerms: 'Net 30' },
        { name: 'PackCo Solutions', category: 'Packaging', location: `Delhi, ${geo}`, contact: '+91 97XXX-XXXXX', moq: '200 pcs', leadTime: '5-7 days', priceRange: '₹30-120/pc', rating: 4.5, status: 'approved', paymentTerms: 'Net 15' },
        { name: 'VendorY Global', category: 'Components', location: `Shenzhen, China`, contact: 'vendor-y@trade.com', moq: '500 units', leadTime: '15-21 days', priceRange: '₹800-2000/unit', rating: 4.6, status: 'approved', paymentTerms: 'LC 60' },
        { name: 'ChemSupply Corp', category: 'Consumables', location: `Ahmedabad, ${geo}`, contact: '+91 96XXX-XXXXX', moq: '20 ltrs', leadTime: '2-3 days', priceRange: '₹150-400/ltr', rating: 4.3, status: 'under_review', paymentTerms: 'COD' },
        { name: 'PrintHub Media', category: 'Labels & Print', location: `Bangalore, ${geo}`, contact: '+91 95XXX-XXXXX', moq: '50 rolls', leadTime: '4-6 days', priceRange: '₹80-200/roll', rating: 4.7, status: 'approved', paymentTerms: 'Net 15' },
        { name: 'EcoWrap Packaging', category: 'Packaging', location: `Pune, ${geo}`, contact: '+91 94XXX-XXXXX', moq: '300 pcs', leadTime: '6-8 days', priceRange: '₹50-150/pc', rating: 4.1, status: 'backup', paymentTerms: 'Net 30' },
    ];

    const statusStyle: Record<string, { bg: string; color: string }> = {
        approved: { bg: `${C.green}15`, color: C.green },
        under_review: { bg: `${C.amber}15`, color: C.amber },
        backup: { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' },
    };

    return (
        <div style={{ display: 'grid', gap: 16 }}>
            {vendors.map((v, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: 14 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${C.indigo}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}></div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{v.name}</h4>
                                        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 12, fontFamily: 'var(--font-mono)', ...statusStyle[v.status] }}>{v.status.replace('_', ' ').toUpperCase()}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.category} • 📍 {v.location}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 16, marginTop: 10, fontSize: 12 }}>
                                        <div><span style={{ color: 'var(--text-muted)' }}>MOQ:</span> <span style={{ fontWeight: 600 }}>{v.moq}</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Lead:</span> <span style={{ fontWeight: 600, color: C.amber }}>{v.leadTime}</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Price:</span> <span style={{ fontWeight: 600, color: C.green }}>{v.priceRange}</span></div>
                                        <div><span style={{ color: 'var(--text-muted)' }}>Terms:</span> <span style={{ fontWeight: 600 }}>{v.paymentTerms}</span></div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 13 }}>Star {v.rating}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{v.contact}</div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}

// ===== SECTION 5: STOCK PLANNING =====
function StockPlanning() {
    const predictions = useMemo(() => [
        { sku: 'SKU-001', name: 'Starter Kit', currentStock: 450, demandForecast: 180, daysOfStock: 15, reorderDate: 'Feb 28', suggestedQty: 400, confidence: 92 },
        { sku: 'SKU-003', name: 'Raw Material A', currentStock: 180, demandForecast: 220, daysOfStock: 5, reorderDate: 'Feb 24', suggestedQty: 600, confidence: 88 },
        { sku: 'SKU-005', name: 'Sealing Adhesive', currentStock: 12, demandForecast: 35, daysOfStock: 2, reorderDate: 'TODAY', suggestedQty: 100, confidence: 95 },
        { sku: 'SKU-007', name: 'Eco Label Stickers', currentStock: 65, demandForecast: 90, daysOfStock: 5, reorderDate: 'Feb 25', suggestedQty: 200, confidence: 85 },
    ], []);

    const demandForecast = useMemo(() => [
        { week: 'W9', demand: 320, supply: 350 }, { week: 'W10', demand: 380, supply: 360 },
        { week: 'W11', demand: 420, supply: 400 }, { week: 'W12', demand: 350, supply: 380 },
        { week: 'W13', demand: 480, supply: 450 }, { week: 'W14', demand: 410, supply: 420 },
    ], []);

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <Card glow={C.red}>
                <SH icon="" title="Reorder Alerts" sub="AI-predicted stock shortages requiring immediate action" />
                <div style={{ display: 'grid', gap: 10 }}>
                    {predictions.map((p, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 8, background: p.daysOfStock <= 2 ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${p.daysOfStock <= 2 ? C.red + '20' : 'rgba(255,255,255,0.04)'}` }}>
                            <span style={{ fontSize: 18 }}>{p.daysOfStock <= 2 ? '' : p.daysOfStock <= 7 ? '' : ''}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.sku} — {p.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stock: {p.currentStock} • Forecast demand: {p.demandForecast}/mo</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: p.daysOfStock <= 2 ? C.red : p.daysOfStock <= 7 ? C.amber : C.green }}>{p.daysOfStock} days</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>until stockout</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '8px 14px', background: `${C.blue}10`, borderRadius: 8, border: `1px solid ${C.blue}20` }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>ORDER</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: C.blue, fontFamily: 'var(--font-mono)' }}>{p.suggestedQty}</div>
                                <div style={{ fontSize: 9, color: C.green }}>{p.confidence}% conf.</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{p.suggestedQty}</div>
                                <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{p.confidence}% conf.</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Card>

            <Card>
                <SH icon="" title="Demand vs Supply Forecast" sub="AI-predicted demand against planned supply — next 6 weeks" />
                <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={demandForecast}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="demand" name="Forecasted Demand" stroke={C.pink} strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="supply" name="Planned Supply" stroke={C.green} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
}

// ===== SECTION 6: SOPs =====
function InventorySOPs() {
    const sops = [
        { title: 'Goods Receiving SOP', code: 'SOP-INV-001', lastUpdated: 'Feb 15, 2026', status: 'active', steps: ['Verify purchase order against delivery challan', 'Inspect goods for damage/defects (random 10% sampling)', 'Update inventory system within 2 hours of receipt', 'File GRN with signatures from warehouse manager', 'Quarantine rejected items in designated zone'] },
        { title: 'Stock Counting SOP', code: 'SOP-INV-002', lastUpdated: 'Feb 10, 2026', status: 'active', steps: ['Conduct cycle counts weekly (Category A items daily)', 'Use barcode scanner for accuracy', 'Document variance > 2% for investigation', 'Reconcile physical vs system count monthly', 'Report discrepancies to finance within 24 hours'] },
        { title: 'Reorder Process SOP', code: 'SOP-INV-003', lastUpdated: 'Jan 28, 2026', status: 'active', steps: ['System auto-generates PO when stock hits reorder level', 'Procurement reviews within 4 hours', 'Minimum 3 vendor quotes for orders > ₹50K', 'Approval chain: Manager → Finance → Director (>₹2L)', 'Track delivery status daily until receipt'] },
        { title: 'Wastage Management SOP', code: 'SOP-INV-004', lastUpdated: 'Feb 1, 2026', status: 'review', steps: ['Log all wastage events with reason codes', 'Photo documentation for wastage > ₹5K', 'Weekly wastage review meeting with operations', 'Root cause analysis for recurring patterns', 'Monthly report to management with improvement plan'] },
    ];

    return (
        <div style={{ display: 'grid', gap: 16 }}>
            {sops.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{s.title}</h4>
                                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 12, fontFamily: 'var(--font-mono)', background: s.status === 'active' ? `${C.green}15` : `${C.amber}15`, color: s.status === 'active' ? C.green : C.amber }}>{s.status.toUpperCase()}</span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.code} • Last updated: {s.lastUpdated}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gap: 6 }}>
                            {s.steps.map((step, si) => (
                                <div key={si} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                                    <span style={{ color: C.blue, fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>{si + 1}.</span> {step}
                                </div>
                            ))}
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}

// ===== SECTION 7: WASTAGE & YIELD =====
function WastageYield() {
    const wastageData = useMemo(() => [
        { month: 'Sep', wastage: 6.2, yield: 93.8, benchmark: 4.0 },
        { month: 'Oct', wastage: 5.5, yield: 94.5, benchmark: 4.0 },
        { month: 'Nov', wastage: 4.8, yield: 95.2, benchmark: 4.0 },
        { month: 'Dec', wastage: 5.1, yield: 94.9, benchmark: 4.0 },
        { month: 'Jan', wastage: 3.8, yield: 96.2, benchmark: 4.0 },
        { month: 'Feb', wastage: 3.2, yield: 96.8, benchmark: 4.0 },
    ], []);

    const wastageByType = useMemo(() => [
        { type: 'Expired Stock', pct: 35, color: C.red }, { type: 'Damaged in Transit', pct: 25, color: C.amber },
        { type: 'Production Defects', pct: 20, color: C.pink }, { type: 'Spillage/Breakage', pct: 12, color: C.blue },
        { type: 'Other', pct: 8, color: 'var(--text-muted)' },
    ], []);

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Card>
                    <SH icon="" title="Wastage Trend" sub="Monthly wastage % vs industry benchmark" />
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={wastageData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="wastage" name="Wastage %" stroke={C.red} strokeWidth={3} dot={{ r: 4, fill: C.red }} />
                            <Line type="monotone" dataKey="benchmark" name="Benchmark" stroke={C.amber} strokeDasharray="5 5" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <SH icon="" title="Yield Improvement" sub="Production yield rate trending upward" />
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={wastageData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} domain={[90, 100]} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="yield" name="Yield %" fill={C.green} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            <Card>
                <SH icon="" title="Wastage Breakdown by Type" />
                <div style={{ display: 'grid', gap: 10 }}>
                    {wastageByType.map((w, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                            <span style={{ width: 130, fontSize: 13, fontWeight: 600 }}>{w.type}</span>
                            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${w.pct}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                                    style={{ height: '100%', borderRadius: 3, background: w.color }} />
                            </div>
                            <span style={{ width: 40, textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: w.color }}>{w.pct}%</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// ===== SECTION 8: SELF-LEARNING SUPPLY AGENT =====
interface DisruptionData {
    id: string; type: string; severity: string; sku: string; supplier: string;
    description: string; detected_at: string; predicted_impact: string; status: string;
}
interface ActionData {
    id: string; disruption_id: string; type: string; description: string;
    executed_at: string; status: string; result?: string; cost_impact?: string;
}
interface ForecastData {
    sku: string; name: string; current_stock: number; predicted_demand_30d: number;
    predicted_demand_60d: number; shortage_probability: number;
    recommended_action: string; confidence: number; risk_factors: string[];
}

function SupplyAgent({ profile }: { profile: BusinessProfile | null }) {
    const [loading, setLoading] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [disruptions, setDisruptions] = useState<DisruptionData[]>([]);
    const [actions, setActions] = useState<ActionData[]>([]);
    const [forecasts, setForecasts] = useState<ForecastData[]>([]);
    const [healthScore, setHealthScore] = useState(94);
    const [learningCycles, setLearningCycles] = useState(0);

    const runScan = useCallback(async () => {
        setLoading(true);
        try {
            const ctx = `Industry: ${profile?.industry || 'General'}. Geography: ${profile?.geography || 'India'}. Scale: ${profile?.scale || 0.5}. Business stage: ${profile?.business_stage || 'early'}. Current inventory includes SKU-001 to SKU-008 across raw materials, packaging, finished goods, and consumables. Vendors include VendorX (raw materials), PackCo (packaging), VendorY Global (imported components), ChemSupply (consumables).`;
            const res = await fetch('/api/supply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ business_context: ctx }) });
            const data = await res.json();
            if (data.disruptions) setDisruptions(data.disruptions);
            if (data.actions) setActions(data.actions);
            if (data.forecasts) setForecasts(data.forecasts);
            if (data.health_score) setHealthScore(data.health_score);
            setLearningCycles(prev => prev + 1);
            setScanned(true);
        } catch (e) { console.error('Supply scan failed:', e); }
        setLoading(false);
    }, [profile]);

    const severityColor: Record<string, string> = { low: C.blue, medium: C.amber, high: '#F97316', critical: C.red };
    const typeIcon: Record<string, string> = { shortage: '📉', price_spike: '💰', supplier_delay: '🕐', quality_issue: '⚠️', market_shift: '🌐' };
    const actionIcon: Record<string, string> = { reroute_order: '🔀', switch_supplier: '🔄', negotiate_contract: '📝', adjust_procurement: '📊', sync_marketing: '📢', alert_team: '🔔' };

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            {/* HEADER: Health + Scan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'center' }}>
                <Card glow={healthScore >= 90 ? C.green : healthScore >= 70 ? C.amber : C.red}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Supply Health</div>
                    <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', color: healthScore >= 90 ? C.green : healthScore >= 70 ? C.amber : C.red }}>{healthScore}%</div>
                </Card>
                <Card>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Learning Cycles</div>
                    <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.cyan }}>{learningCycles}</div>
                </Card>
                <Card>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 4 }}>Auto-Actions</div>
                    <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-mono)', color: C.purple }}>{actions.length}</div>
                </Card>
                <motion.button
                    onClick={runScan} disabled={loading}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{ padding: '14px 28px', borderRadius: 10, border: 'none', background: '#fff', color: '#000', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'var(--font-mono)', height: 'fit-content' }}
                >
                    {loading ? 'Scanning...' : scanned ? 'Re-Scan Network' : 'Run Intelligence Scan'}
                </motion.button>
            </div>

            {!scanned && !loading && (
                <Card glow={C.cyan}>
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}></div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Self-Learning Supply Chain Agent</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
                            Click "Run Intelligence Scan" to activate the autonomous supply agent. It will analyze your vendor network, predict disruptions, auto-reroute procurement, and continuously learn from outcomes.
                        </p>
                    </div>
                </Card>
            )}

            {loading && (
                <Card>
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ width: 48, height: 48, border: '3px solid var(--border-primary)', borderTopColor: C.cyan, borderRadius: '50%', margin: '0 auto 16px' }} />
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Agent scanning supplier network, market feeds, and historical patterns...</div>
                    </div>
                </Card>
            )}

            {scanned && !loading && (
                <>
                    {/* DISRUPTION FEED */}
                    <Card glow={C.red}>
                        <SH icon="" title="Live Disruption Feed" sub={`${disruptions.length} disruptions detected by autonomous monitoring`} />
                        <div style={{ display: 'grid', gap: 10 }}>
                            {disruptions.map((d, i) => (
                                <motion.div key={d.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 8, background: `${severityColor[d.severity] || C.amber}08`, border: `1px solid ${severityColor[d.severity] || C.amber}20` }}>
                                    <span style={{ fontSize: 20, flexShrink: 0 }}>{typeIcon[d.type] || '⚠️'}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700 }}>{d.description}</span>
                                            <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 12, fontFamily: 'var(--font-mono)', background: `${severityColor[d.severity] || C.amber}20`, color: severityColor[d.severity] || C.amber }}>{(d.severity || 'medium').toUpperCase()}</span>
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SKU: {d.sku} | Supplier: {d.supplier} | Impact: {d.predicted_impact}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </Card>

                    {/* AUTONOMOUS ACTIONS */}
                    <Card glow={C.green}>
                        <SH icon="" title="Autonomous Actions Taken" sub="Actions executed without human intervention" />
                        <div style={{ display: 'grid', gap: 8 }}>
                            {actions.map((a, i) => (
                                <motion.div key={a.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <span style={{ fontSize: 18, flexShrink: 0 }}></span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.description}</div>
                                        {a.result && <div style={{ fontSize: 11, color: C.green, marginTop: 2 }}>{a.result}</div>}
                                    </div>
                                    {a.cost_impact && <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: C.amber, flexShrink: 0 }}>{a.cost_impact}</div>}
                                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 12, fontFamily: 'var(--font-mono)', background: a.status === 'completed' ? `${C.green}15` : `${C.amber}15`, color: a.status === 'completed' ? C.green : C.amber }}>{(a.status || 'completed').toUpperCase()}</span>
                                </motion.div>
                            ))}
                        </div>
                    </Card>

                    {/* PREDICTIVE FORECASTS */}
                    <Card glow={C.blue}>
                        <SH icon="" title="Predictive Shortage Forecasts" sub="AI-predicted material shortages before they happen" />
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['SKU', 'Item', 'Stock', '30d Demand', '60d Demand', 'Shortage Risk', 'Conf.', 'Recommended Action'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '10px 10px', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {forecasts.map((f, i) => (
                                    <motion.tr key={f.sku || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: f.shortage_probability > 0.7 ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                                        <td style={{ padding: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: C.cyan }}>{f.sku}</td>
                                        <td style={{ padding: 10, fontWeight: 600 }}>{f.name}</td>
                                        <td style={{ padding: 10, fontFamily: 'var(--font-mono)' }}>{f.current_stock}</td>
                                        <td style={{ padding: 10, fontFamily: 'var(--font-mono)', color: C.amber }}>{f.predicted_demand_30d}</td>
                                        <td style={{ padding: 10, fontFamily: 'var(--font-mono)', color: C.pink }}>{f.predicted_demand_60d}</td>
                                        <td style={{ padding: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ width: 50, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                                                    <div style={{ width: `${Math.round((f.shortage_probability || 0) * 100)}%`, height: '100%', borderRadius: 2, background: f.shortage_probability > 0.7 ? C.red : f.shortage_probability > 0.4 ? C.amber : C.green }} />
                                                </div>
                                                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: f.shortage_probability > 0.7 ? C.red : C.amber }}>{Math.round((f.shortage_probability || 0) * 100)}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: C.green }}>{Math.round((f.confidence || 0) * 100)}%</td>
                                        <td style={{ padding: 10, fontSize: 12, color: 'var(--text-secondary)' }}>{f.recommended_action}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    {/* CROSS-AGENT SYNC + FEEDBACK LOOP */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <Card glow={C.purple}>
                            <SH icon="" title="Cross-Agent Sync" sub="Supply agent coordinating with other departments" />
                            <div style={{ display: 'grid', gap: 8 }}>
                                {[
                                    { agent: 'Marketing Agent', action: 'Inventory levels synced with upcoming promo calendar. Flagged 2 SKUs at risk of stockout during planned campaign.', status: 'synced' },
                                    { agent: 'Finance Agent', action: 'Procurement budget reallocation approved. Emergency supplier switching costs within ₹25K tolerance.', status: 'approved' },
                                    { agent: 'Operations Agent', action: 'Production schedule adjusted to prioritize high-demand SKUs. Shift allocation updated.', status: 'pending' },
                                ].map((s, i) => (
                                    <div key={i} style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: C.purple }}>{s.agent}</span>
                                            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 8, fontFamily: 'var(--font-mono)', background: s.status === 'synced' ? `${C.green}15` : s.status === 'approved' ? `${C.blue}15` : `${C.amber}15`, color: s.status === 'synced' ? C.green : s.status === 'approved' ? C.blue : C.amber }}>{s.status.toUpperCase()}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.action}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                        <Card glow={C.indigo}>
                            <SH icon="" title="Continuous Feedback Loop" sub="Self-learning performance over time" />
                            <div style={{ display: 'grid', gap: 12 }}>
                                {[
                                    { metric: 'Prediction Accuracy', value: '91.3%', trend: '+2.1% since last cycle', color: C.green },
                                    { metric: 'Avg Response Time', value: '1.2s', trend: '-0.4s improvement', color: C.cyan },
                                    { metric: 'Cost Savings', value: '₹2.4L', trend: 'From autonomous rerouting', color: C.amber },
                                    { metric: 'Stockout Prevention', value: '12', trend: 'Shortages averted this month', color: C.blue },
                                ].map((m, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, boxShadow: `0 0 8px ${m.color}40`, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600 }}>{m.metric}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.trend}</div>
                                        </div>
                                        <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: m.color }}>{m.value}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}

// ==========================
// MAIN SUPPLY TAB EXPORT
// ==========================
export default function SupplyTab({ output, profile }: { output: StrategyOutput; profile: BusinessProfile | null }) {
    const [activeSection, setActiveSection] = useState('agent');
    const dept = output.departments.find(d => d.department === 'supply');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '20px 24px 0' }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Supply & Inventory Operations
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
                    Self-learning supply agent with predictive analytics, vendor management & autonomous procurement for {profile?.industry || 'your business'}
                </p>
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto' }}>
                {SECTIONS.map(s => (
                    <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                        padding: '8px 16px', fontSize: 12, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
                        background: activeSection === s.id ? 'rgba(6,182,212,0.15)' : 'transparent',
                        color: activeSection === s.id ? C.cyan : 'var(--text-tertiary)',
                    }}>{s.icon} {s.label}</button>
                ))}
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                <AnimatePresence mode="wait">
                    <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {activeSection === 'agent' && <SupplyAgent profile={profile} />}
                        {activeSection === 'dashboard' && <InventoryDashboard dept={dept} />}
                        {activeSection === 'sku' && <SKUCatalog profile={profile} />}
                        {activeSection === 'bom' && <BillOfMaterials profile={profile} />}
                        {activeSection === 'vendors' && <VendorBook profile={profile} />}
                        {activeSection === 'planning' && <StockPlanning />}
                        {activeSection === 'sops' && <InventorySOPs />}
                        {activeSection === 'wastage' && <WastageYield />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

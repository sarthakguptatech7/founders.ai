'use client';

import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';

// ===== DATA =====
const AGENTS = [
  { name: 'Marcus', role: 'Finance Director', desc: 'Monitors transactions, reconciles ledgers, and drafts financial reports autonomously.', color: 'var(--accent-secondary)' },
  { name: 'Nova', role: 'Marketing Lead', desc: 'Executes outbound campaigns, optimizes ad spend, and generates copy.', color: 'var(--accent-secondary)' },
  { name: 'Nexus', role: 'Tech Architect', desc: 'Analyzes infrastructure, deploys code, and manages technical debt.', color: 'var(--accent-secondary)' },
  { name: 'Oracle', role: 'Market Intelligence', desc: 'Scrapes competitor data, tracks market trends, and synthesizes insights.', color: 'var(--accent-secondary)' },
];

const METRICS = [
  { label: 'Time Saved', value: '84%', detail: 'Average reduction in operational overhead per deployed agent.' },
  { label: 'Tasks Automated', value: '1.2M+', detail: 'Workflows executed seamlessly across our network last month.' },
  { label: 'Decision Speed', value: '< 2s', detail: 'From intent analysis to API execution across your stack.' },
];

// ===== ANIMATION SYSTEM =====
const T = { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }; // Cinematic inertia
const FADE_UP = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-100px' }, transition: T };

export default function LandingPage() {
  const router = useRouter();
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);
  const { scrollY } = useScroll();

  // Parallax background effects
  const bgY1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const bgY2 = useTransform(scrollY, [0, 1000], [0, -150]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Ambient Background Grid */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', perspective: '1000px' }}>
        <motion.div style={{
          position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          transform: 'rotateX(60deg) translateY(-100px)',
          y: bgY1
        }} />
      </div>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px', borderBottom: '1px solid var(--border-primary)',
        background: 'rgba(10, 15, 26, 0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 16, height: 16, background: '#fff' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: '#fff' }}>Founding AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#platform" style={{ fontSize: 14, color: 'var(--text-tertiary)', textDecoration: 'none', transition: 'color 0.3s', fontWeight: 500 }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>Architecture</a>
          <a href="#agents" style={{ fontSize: 14, color: 'var(--text-tertiary)', textDecoration: 'none', transition: 'color 0.3s', fontWeight: 500 }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>Intelligence</a>
          <motion.button
            onClick={() => router.push('/workspace')}
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(79, 124, 255, 0.2)' }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}
            style={{
              padding: '10px 24px', borderRadius: 4, border: '1px solid var(--border-primary)',
              background: 'transparent', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Access Terminal
          </motion.button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* ===== SECTION 1: HERO INTELLIGENCE ENVIRONMENT ===== */}
        <section style={{ width: '100%', maxWidth: 1200, padding: '200px 24px 140px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 4, border: '1px solid var(--border-primary)', background: 'var(--bg-glass)', marginBottom: 32 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-primary)' }} />
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>System Online</span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(56px, 7vw, 92px)', fontWeight: 500,
              lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 32, maxWidth: 1000, color: '#fff'
            }}>
              Build companies that<br />run themselves.
            </h1>

            <p style={{ fontSize: 20, color: 'var(--text-tertiary)', lineHeight: 1.6, marginBottom: 56, maxWidth: 640, margin: '0 auto 56px' }}>
              Founding AI deploys intelligent agents that operate across your tools, workflows, and data — executing real work without manual effort.
            </p>

            <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
              <motion.button
                onClick={() => router.push('/workspace')}
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(79, 124, 255, 0.3)' }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.3 }}
                style={{
                  padding: '16px 36px', borderRadius: 4, border: 'none',
                  background: '#fff', color: '#000', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  position: 'relative', overflow: 'hidden'
                }}
              >
                Deploy your AI workforce
              </motion.button>
              <motion.button
                whileHover={{ background: 'var(--bg-glass-hover)' }} transition={{ duration: 0.3 }}
                style={{
                  padding: '16px 36px', borderRadius: 4, border: '1px solid var(--border-secondary)',
                  background: 'transparent', color: 'var(--text-primary)', fontSize: 15, fontWeight: 500, cursor: 'pointer',
                }}
              >
                Watch agents execute
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* ===== SECTION 2: LIVE EXECUTION DEMO ===== */}
        <section style={{ width: '100%', maxWidth: 1000, padding: '0 24px 160px' }}>
          <motion.div {...FADE_UP} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
            borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-primary)' }}>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>execution-environment.sh</div>
            </div>
            <div style={{ padding: 40, fontFamily: 'var(--font-mono)', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 24, minHeight: 400 }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <span style={{ color: 'var(--accent-secondary)' }}>user@founding.ai:~$</span> command: "Generate Q3 Sales Analysis & distribute to execs"
              </motion.div>

              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ delay: 1.5 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ color: 'var(--text-tertiary)' }}>[SYSTEM] Initializing multi-agent orchestration...</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, borderLeft: '1px solid var(--border-primary)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Agent Marcus: Querying Salesforce GraphQL API (14,244 records)...</span>
                </div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, borderLeft: '1px solid var(--border-primary)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Data aggregated. YoY Growth: +24.3%</span>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, borderLeft: '1px solid var(--border-primary)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Agent Nova: Formatting strategic brief and composing emails...</span>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.5 }} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, borderLeft: '1px solid var(--border-primary)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Dispatched 12 emails via SendGrid SMTP.</span>
                </motion.div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.5 }}>
                <span style={{ color: 'var(--text-primary)', background: 'var(--bg-glass)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-primary)' }}>
                  [SUCCESS] Workflow completed in 1.4s. Operational cost: $0.003
                </span>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <style dangerouslySetInnerHTML={{
          __html: `
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                `}} />

        {/* ===== SECTION 3: AI WORKFORCE (Agent System) ===== */}
        <section id="agents" style={{ width: '100%', maxWidth: 1200, padding: '0 24px 160px' }}>
          <motion.div {...FADE_UP} style={{ marginBottom: 64, textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 20 }}>The Cognitive Workforce</h2>
            <p style={{ fontSize: 18, color: 'var(--text-tertiary)', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
              Deploy specialized operational agents. Network them together to handle complex, multi-step corporate workflows automatically.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ ...T, delay: i * 0.1 }}
                onMouseEnter={() => setHoveredAgent(i)} onMouseLeave={() => setHoveredAgent(null)}
                style={{
                  padding: 32, background: 'var(--bg-secondary)',
                  borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)',
                  transition: 'all 0.4s ease', position: 'relative', overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 500, color: '#fff' }}>{agent.name}</div>
                  <motion.div
                    animate={{ opacity: hoveredAgent === i ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: '#fff' }}
                  >
                    [ACTIVE]
                  </motion.div>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>{agent.role}</div>
                <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{agent.desc}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ===== SECTION 5: HOW IT THINKS (Neural Map) ===== */}
        <section style={{ width: '100%', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)', padding: '120px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 80 }}>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Decision Architecture</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em' }}>How Founding AI Operates</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, alignItems: 'center' }}>
              {['Observe', 'Plan', 'Execute', 'Verify', 'Learn'].map((step, i) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ ...T, delay: i * 0.1 }} style={{
                    width: '100%', padding: '32px 16px', background: 'var(--bg-primary)',
                    border: '1px solid var(--border-secondary)', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--text-primary)' }}>{step}</div>
                  </motion.div>
                  {
                    i < 4 && (
                      <motion.div initial={{ width: 0 }} whileInView={{ width: 16 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 + 0.3 }} style={{ height: 2, background: 'var(--border-secondary)' }} />
                    )
                  }
                </div>
              ))}
            </div>
          </div>
        </section >

        {/* ===== SECTION 6: REAL BUSINESS IMPACT Metrics ===== */}
        < section style={{ width: '100%', maxWidth: 1200, padding: '160px 24px' }
        }>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
            {METRICS.map((metric, i) => (
              <motion.div key={metric.label} {...FADE_UP} transition={{ ...T, delay: i * 0.15 }} style={{
                padding: 40, borderLeft: '1px solid var(--border-secondary)'
              }}>
                <div style={{ fontSize: 56, fontFamily: 'var(--font-display)', fontWeight: 500, color: '#fff', marginBottom: 16 }}>{metric.value}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>{metric.label}</div>
                <div style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>{metric.detail}</div>
              </motion.div>
            ))}
          </div>
        </section >

        {/* ===== SECTION 8: CONTROL & SECURITY ===== */}
        < section style={{ width: '100%', padding: '120px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <motion.div {...FADE_UP}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 24 }}>Absolute Control.<br />Total Security.</h2>
              <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 40 }}>
                Trust is the prerequisite for autonomy. The execution engine enforces strict boundary constraints, complete transparency, and human-in-the-loop overrides.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {['Role-based permission schemas', 'Immutable execution audit logs', 'End-to-end encrypted action state', 'Mandatory human escalations'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--text-secondary)', fontSize: 15 }}>
                    <div style={{ width: 4, height: 4, background: '#fff' }} />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...FADE_UP} transition={{ ...T, delay: 0.2 }} style={{
              background: 'var(--bg-primary)', padding: 40, border: '1px solid var(--border-primary)', position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 1, background: 'var(--border-secondary)' }} />
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginBottom: 32, textTransform: 'uppercase', letterSpacing: 2 }}>Security Telemetry</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 24, borderBottom: '1px solid var(--border-secondary)', marginBottom: 24 }}>
                <div style={{ color: 'var(--text-secondary)' }}>Encryption Status</div>
                <div style={{ color: '#fff' }}>Valid</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 24, borderBottom: '1px solid var(--border-secondary)', marginBottom: 24 }}>
                <div style={{ color: 'var(--text-secondary)' }}>Audit Log Stream</div>
                <div style={{ color: '#fff' }}>Active</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Human Override</div>
                <div style={{ color: '#fff' }}>Standby</div>
              </div>
            </motion.div>
          </div>
        </section >

        {/* ===== SECTION 9: FINAL CTA ===== */}
        < section style={{ width: '100%', padding: '160px 24px', textAlign: 'center', borderTop: '1px solid var(--border-primary)' }}>
          <motion.div {...FADE_UP} style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 500, letterSpacing: '-0.03em', marginBottom: 40, color: '#fff' }}>Stop operating manually.</h2>
            <motion.button
              onClick={() => router.push('/workspace')}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.3 }}
              style={{
                padding: '16px 40px', borderRadius: 4, border: 'none',
                background: '#fff', color: '#000', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Initialize System
            </motion.button>
          </motion.div>
        </section >

        {/* Footer */}
        < footer style={{ width: '100%', padding: '40px 48px', borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
          <div>© 2026 Founding AI. Autonomous execution layer.</div>
          <div style={{ display: 'flex', gap: 32 }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>Privacy</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>Terms</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>System Status</span>
          </div>
        </footer >

      </main >
    </div >
  );
}

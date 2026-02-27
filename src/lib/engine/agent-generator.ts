import { BusinessProfile, AgentRole, ComplexityScores, Department } from '../types';
import { synthesizePrompt, getAgentMeta } from './prompt-synthesizer';
import { v4 as uuidv4 } from 'uuid';

const ACTIVATION_THRESHOLDS: Record<string, number> = {
    finance: 0.25,      // almost always active
    marketing: 0.3,
    tech: 0.4,
    licensing: 0.45,
    supply: 0.4,
    growth: 0.35,
    market_research: 0.3,
    launch: 0.3,
};

const SUB_AGENT_THRESHOLD = 0.75;

const TECH_SUB_ROLES: Array<{ department: Department; title: string; name: string }> = [
    { department: 'tech', title: 'Backend Systems Engineer', name: 'CORE' },
    { department: 'tech', title: 'Frontend Experience Architect', name: 'PIXEL' },
    { department: 'tech', title: 'DevOps & Infrastructure Lead', name: 'FORGE' },
];

export function generateAgents(
    profile: BusinessProfile,
    scores: ComplexityScores
): AgentRole[] {
    const agents: AgentRole[] = [];

    // Orchestrator is ALWAYS active
    const orchestratorMeta = getAgentMeta('orchestrator');
    agents.push({
        id: uuidv4(),
        name: orchestratorMeta.name,
        title: orchestratorMeta.title,
        department: 'orchestrator',
        system_prompt: synthesizePrompt(profile, 'orchestrator'),
        activation_score: 1.0,
        is_active: true,
        color: orchestratorMeta.color,
        icon: orchestratorMeta.icon,
    });

    // Evaluate each department
    const departments: Array<{ key: keyof ComplexityScores; dept: Department }> = [
        { key: 'finance', dept: 'finance' },
        { key: 'marketing', dept: 'marketing' },
        { key: 'tech', dept: 'tech' },
        { key: 'licensing', dept: 'licensing' },
        { key: 'supply', dept: 'supply' },
        { key: 'growth', dept: 'growth' },
        { key: 'market_research', dept: 'market_research' },
        { key: 'launch', dept: 'launch' },
    ];

    for (const { key, dept } of departments) {
        const score = scores[key];
        const threshold = ACTIVATION_THRESHOLDS[key] || 0.4;

        if (score >= threshold) {
            const meta = getAgentMeta(dept);
            const agent: AgentRole = {
                id: uuidv4(),
                name: meta.name,
                title: meta.title,
                department: dept,
                system_prompt: synthesizePrompt(profile, dept),
                activation_score: Math.round(score * 100) / 100,
                is_active: true,
                color: meta.color,
                icon: meta.icon,
            };

            // Sub-agent spawning for high-complexity tech
            if (dept === 'tech' && score >= SUB_AGENT_THRESHOLD) {
                agent.sub_agents = TECH_SUB_ROLES.map(sub => ({
                    id: uuidv4(),
                    name: sub.name,
                    title: sub.title,
                    department: sub.department,
                    system_prompt: synthesizePrompt(profile, sub.department),
                    activation_score: score,
                    is_active: true,
                    color: meta.color,
                    icon: meta.icon,
                }));
            }

            agents.push(agent);
        }
    }

    return agents;
}

export function getActiveAgentCount(agents: AgentRole[]): number {
    return agents.filter(a => a.is_active && a.department !== 'orchestrator').length;
}

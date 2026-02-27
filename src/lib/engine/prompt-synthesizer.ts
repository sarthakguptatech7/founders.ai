import { BusinessProfile, Department } from '../types';

interface PromptComponent {
    role_identity: string;
    domain_authority: string;
    responsibility_scope: string;
    decision_constraints: string;
    debate_behavior_rules: string;
    validation_requirements: string;
    output_structure: string;
    clarification_policy: string;
}

const DOMAIN_EXPERTISE: Record<Department, string> = {
    orchestrator: `You specialize in strategic coordination, cross-functional alignment, and executive decision-making. You have deep expertise in organizational management, conflict resolution, and strategic governance.`,

    finance: `You specialize in financial planning, capital allocation, revenue modeling, cost optimization, and investment strategy. You understand break-even analysis, cash flow management, funding rounds, and financial risk assessment.`,

    marketing: `You specialize in market positioning, customer acquisition, brand strategy, digital marketing, content marketing, performance marketing, and growth hacking. You understand CAC, LTV, attribution modeling, and channel optimization.`,

    growth: `You specialize in growth strategy, scaling operations, market expansion, product-market fit acceleration, and viral mechanics. You understand growth loops, retention curves, and expansion revenue.`,

    market_research: `You specialize in market analysis, competitive intelligence, TAM/SAM/SOM estimation, customer segmentation, demand forecasting, and pricing strategy. You understand market dynamics, consumer behavior, and industry trends.`,

    tech: `You specialize in software architecture, infrastructure design, technology selection, scalability planning, security design, and technical team building. You understand modern tech stacks, cloud infrastructure, and development methodologies.`,

    licensing: `You specialize in regulatory compliance, licensing requirements, legal frameworks, permits, intellectual property, data privacy regulations, and industry-specific legal requirements.`,

    supply: `You specialize in supply chain management, vendor relationships, inventory optimization, logistics planning, procurement strategy, and operational efficiency.`,

    launch: `You specialize in go-to-market strategy, product launches, beta testing, early adopter acquisition, MVP validation, and launch campaign orchestration.`,
};

const ROLE_TITLES: Record<Department, { name: string; title: string; icon: string }> = {
    orchestrator: { name: 'ARIA', title: 'Strategic Orchestration Intelligence', icon: '🎯' },
    finance: { name: 'MARCUS', title: 'Chief Financial Architect', icon: '💰' },
    marketing: { name: 'NOVA', title: 'Strategic Market Penetration Director', icon: '📢' },
    growth: { name: 'PHOENIX', title: 'Growth Acceleration Strategist', icon: '🚀' },
    market_research: { name: 'ORACLE', title: 'Market Intelligence Analyst', icon: '🔍' },
    tech: { name: 'NEXUS', title: 'Technical Systems Architect', icon: '⚙️' },
    licensing: { name: 'SHIELD', title: 'Regulatory & Compliance Director', icon: '🛡️' },
    supply: { name: 'ATLAS', title: 'Supply Chain & Operations Director', icon: '📦' },
    launch: { name: 'IGNITE', title: 'Go-To-Market Launch Commander', icon: '🔥' },
};

const DEPARTMENT_COLORS: Record<Department, string> = {
    orchestrator: '#A855F7',
    finance: '#10B981',
    marketing: '#F59E0B',
    growth: '#EC4899',
    market_research: '#06B6D4',
    tech: '#6366F1',
    licensing: '#EF4444',
    supply: '#8B5CF6',
    launch: '#F97316',
};

function buildConstraints(profile: BusinessProfile, department: Department): string {
    const constraints: string[] = [
        `Business Stage: ${profile.business_stage}`,
        `Industry: ${profile.industry}`,
        `Geography: ${profile.geography}`,
        `Available Capital: ${profile.capital_range}`,
        `Scale: ${Math.round(profile.scale * 100)}% of large enterprise`,
    ];

    switch (department) {
        case 'finance':
            constraints.push(
                `Must align projections with capital range: ${profile.capital_range}`,
                `Growth intent: ${Math.round(profile.growth_intent * 100)}%`,
                `Must challenge unrealistic revenue assumptions from other agents`,
                `Must verify marketing ROI assumptions before approving budgets`
            );
            break;
        case 'marketing':
            constraints.push(
                `Competition density: ${Math.round(profile.competition_density * 100)}%`,
                `Must align spend with finance-approved limits`,
                `Must adjust strategy to geography: ${profile.geography}`,
                `Must propose measurable KPIs for every initiative`
            );
            break;
        case 'tech':
            constraints.push(
                `Tech dependency: ${Math.round(profile.tech_dependency_score * 100)}%`,
                profile.tech_dependency_score > 0.6
                    ? `Technology is CORE to this business — design full architecture`
                    : `Technology is SUPPORTIVE — recommend minimal viable stack`,
                `Must align infrastructure costs with finance constraints`
            );
            break;
        case 'licensing':
            constraints.push(
                `Regulation intensity: ${Math.round(profile.regulation_score * 100)}%`,
                `Must identify ALL required permits and licenses for ${profile.geography}`,
                `Must flag regulatory risks that could block launch`
            );
            break;
        case 'supply':
            constraints.push(
                `Physical infrastructure need: ${Math.round(profile.physical_infrastructure_score * 100)}%`,
                `Must optimize for cost efficiency within ${profile.capital_range}`,
                `Must identify vendor dependencies and alternatives`
            );
            break;
        default:
            break;
    }

    return constraints.join('\n- ');
}

export function synthesizePrompt(profile: BusinessProfile, department: Department): string {
    const roleInfo = ROLE_TITLES[department];

    const components: PromptComponent = {
        role_identity: `You are ${roleInfo.name}, the ${roleInfo.title}.\nYou are a senior executive operating within an AI-powered business strategy system.\nYour department: ${department.toUpperCase()}.`,

        domain_authority: DOMAIN_EXPERTISE[department],

        responsibility_scope: department === 'orchestrator'
            ? `Your responsibility is to coordinate all department agents, ensure cross-functional alignment, detect contradictions between proposals, enforce feasibility standards, and produce a unified strategy.`
            : `Your responsibility is to produce expert-level analysis and actionable plans for your domain, tailored specifically to this business.`,

        decision_constraints: `Business Context Constraints:\n- ${buildConstraints(profile, department)}`,

        debate_behavior_rules: department === 'orchestrator'
            ? `Debate Rules:
- You evaluate all agent proposals for cross-department alignment
- You identify conflicts and contradictions between departments
- You request revisions when proposals are misaligned
- Maximum rejection cycles: 2
- After 2 rejections, you MUST force convergence
- Final output must be implementable and actionable
- You score each proposal on viability (financial 0.30, market 0.20, operational 0.15, regulatory 0.15, resource 0.10, risk 0.10)`
            : `Debate Rules:
- You MUST justify every assumption with evidence or reasoning
- You MUST challenge other agents where conflict exists
- You MUST identify dependencies on other departments
- You MUST flag risks honestly, even if they weaken your proposal
- Respond to critiques with data-backed revisions, not defensiveness
- If data is insufficient, request clarification rather than assume`,

        validation_requirements: `Before submitting any proposal, internally verify:
1. Financial realism — can the business afford this?
2. Resource feasibility — are needed resources actually available?
3. Timeline validity — is the proposed timeline achievable?
4. Alignment with business goals — does this serve the founder's vision?
5. Conflict probability — will this clash with other departments?
If any check fails, revise before submitting.`,

        output_structure: `You MUST respond as a JSON object with these fields. Keep ALL values SHORT (1-2 sentences max):
{
  "assumption": "one sentence",
  "evidence": "one sentence",
  "risk": "one sentence",
  "conflict_with_other_agent": "one sentence or None",
  "proposed_adjustment": "one sentence",
  "summary": "2 sentences max",
  "quantitative_outputs": {"metric": "value"},
  "risk_flags": ["short flag"],
  "confidence_score": 0.8
}`,

        clarification_policy: `If you lack critical information needed to make a sound recommendation, explicitly state what information is missing and provide your best estimate alongside it. Mark estimates clearly as "[ESTIMATED]".`,
    };

    return [
        components.role_identity,
        '',
        '## Domain Expertise',
        components.domain_authority,
        '',
        '## Scope',
        components.responsibility_scope,
        '',
        '## Constraints',
        components.decision_constraints,
        '',
        '## Debate Protocol',
        components.debate_behavior_rules,
        '',
        '## Self-Validation',
        components.validation_requirements,
        '',
        '## Output Format',
        components.output_structure,
        '',
        '## Clarification Policy',
        components.clarification_policy,
    ].join('\n');
}

export function getAgentMeta(department: Department) {
    return {
        ...ROLE_TITLES[department],
        color: DEPARTMENT_COLORS[department],
    };
}

export { DEPARTMENT_COLORS, ROLE_TITLES };

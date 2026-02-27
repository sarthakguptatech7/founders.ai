import {
    BusinessProfile,
    AgentRole,
    AgentMessage,
    DebateRound,
    DebateState,
    DebatePhase,
    ConflictSummary,
    ViabilityScore,
    StrategyOutput,
    DepartmentOutput,
} from '../types';
import { callClaudeJSON } from './claude-client';
import { calculateViabilityScore, shouldRejectPlan } from './scoring';
import { v4 as uuidv4 } from 'uuid';

const MAX_REVISIONS = 2;

function isValidProposal(msg: AgentMessage): boolean {
    return msg.confidence_score > 0.15 && !msg.risk_flags.includes('PROCESSING_ERROR');
}

// ===== ROUND 1: INITIAL PROPOSALS =====
async function getAgentProposal(
    agent: AgentRole,
    profile: BusinessProfile,
    roundContext: string
): Promise<AgentMessage> {
    const userPrompt = `Business: ${profile.summary}
Industry: ${profile.industry} | Stage: ${profile.business_stage} | Geography: ${profile.geography} | Capital: ${profile.capital_range}

${roundContext}

Provide your departmental proposal as a JSON object.`;

    try {
        const response = await callClaudeJSON<{
            assumption: string;
            evidence: string;
            risk: string;
            conflict_with_other_agent: string;
            proposed_adjustment: string;
            summary: string;
            quantitative_outputs?: Record<string, string | number>;
            risk_flags?: string[];
            confidence_score?: number;
        }>(agent.system_prompt, userPrompt, { maxTokens: 4096, temperature: 0.7 });

        return {
            id: uuidv4(),
            agent_id: agent.id,
            agent_name: agent.name,
            department: agent.department,
            round: 1,
            type: 'proposal',
            content: {
                assumption: response.assumption || '',
                evidence: response.evidence || '',
                risk: response.risk || '',
                conflict_with_other_agent: response.conflict_with_other_agent || 'None identified',
                proposed_adjustment: response.proposed_adjustment || '',
                summary: response.summary || '',
            },
            quantitative_outputs: response.quantitative_outputs || {},
            risk_flags: response.risk_flags || [],
            conflicts_identified: [],
            confidence_score: response.confidence_score || 0.7,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error(`[${agent.name}] Proposal error:`, (error as Error).message);
        return {
            id: uuidv4(),
            agent_id: agent.id,
            agent_name: agent.name,
            department: agent.department,
            round: 1,
            type: 'proposal',
            content: {
                assumption: 'Unable to generate proposal due to processing error',
                evidence: 'N/A',
                risk: 'High — proposal needs manual review',
                conflict_with_other_agent: 'Unknown',
                proposed_adjustment: 'Retry analysis',
                summary: `${agent.name} encountered an error generating proposal: ${(error as Error).message}`,
            },
            risk_flags: ['PROCESSING_ERROR'],
            conflicts_identified: [],
            confidence_score: 0.1,
            timestamp: new Date().toISOString(),
        };
    }
}

// ===== ROUND 2: CROSS-AGENT CRITIQUE =====
async function getAgentCritique(
    critic: AgentRole,
    targetProposal: AgentMessage,
    allProposals: AgentMessage[],
    profile: BusinessProfile
): Promise<AgentMessage> {
    // Skip critique if target proposal failed
    if (!isValidProposal(targetProposal)) {
        return {
            id: uuidv4(),
            agent_id: critic.id,
            agent_name: critic.name,
            department: critic.department,
            round: 2,
            type: 'critique',
            content: {
                assumption: `${targetProposal.agent_name}'s proposal was not available for critique`,
                evidence: 'N/A',
                risk: 'Missing departmental input',
                conflict_with_other_agent: targetProposal.agent_name,
                proposed_adjustment: `${targetProposal.agent_name} needs to re-submit their proposal`,
                summary: `${targetProposal.agent_name}'s proposal failed to generate, preventing critique and integration into ${critic.department} planning.`,
            },
            risk_flags: [`No ${targetProposal.agent_name} input`, `${critic.department} planning stalled`, 'Pre-launch delay'],
            conflicts_identified: [],
            confidence_score: 0.1,
            timestamp: new Date().toISOString(),
        };
    }

    const otherProposals = allProposals
        .filter(p => p.agent_id !== critic.id && isValidProposal(p))
        .map(p => `[${p.agent_name}]: ${p.content.summary}`)
        .join('\n');

    const userPrompt = `Critique this proposal from ${targetProposal.agent_name}:
Summary: ${targetProposal.content.summary}
Assumptions: ${targetProposal.content.assumption}
Risks: ${targetProposal.content.risk}

Other proposals: ${otherProposals}

Business: ${profile.summary} | Capital: ${profile.capital_range}

Identify conflicts, unrealistic assumptions, missing considerations. Respond as JSON.`;

    try {
        const response = await callClaudeJSON<{
            assumption: string;
            evidence: string;
            risk: string;
            conflict_with_other_agent: string;
            proposed_adjustment: string;
            summary: string;
            risk_flags?: string[];
            confidence_score?: number;
        }>(critic.system_prompt, userPrompt, { maxTokens: 2048, temperature: 0.6 });

        return {
            id: uuidv4(),
            agent_id: critic.id,
            agent_name: critic.name,
            department: critic.department,
            round: 2,
            type: 'critique',
            content: {
                assumption: response.assumption || '',
                evidence: response.evidence || '',
                risk: response.risk || '',
                conflict_with_other_agent: response.conflict_with_other_agent || '',
                proposed_adjustment: response.proposed_adjustment || '',
                summary: response.summary || '',
            },
            risk_flags: response.risk_flags || [],
            conflicts_identified: [],
            confidence_score: response.confidence_score || 0.7,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error(`[${critic.name}] Critique error:`, (error as Error).message);
        return {
            id: uuidv4(),
            agent_id: critic.id,
            agent_name: critic.name,
            department: critic.department,
            round: 2,
            type: 'critique',
            content: {
                assumption: 'Error during critique',
                evidence: 'N/A',
                risk: 'Critique incomplete',
                conflict_with_other_agent: targetProposal.agent_name,
                proposed_adjustment: 'Manual review needed',
                summary: `${critic.name} could not complete critique of ${targetProposal.agent_name}'s proposal`,
            },
            risk_flags: ['PROCESSING_ERROR'],
            conflicts_identified: [],
            confidence_score: 0.1,
            timestamp: new Date().toISOString(),
        };
    }
}

// ===== ROUND 3: ORCHESTRATOR EVALUATION =====
async function orchestratorEvaluate(
    orchestrator: AgentRole,
    proposals: AgentMessage[],
    critiques: AgentMessage[],
    profile: BusinessProfile,
    revisionCount: number
): Promise<{
    verdict: string;
    viability: ViabilityScore;
    conflicts: ConflictSummary[];
    phase: DebatePhase;
    message: AgentMessage;
}> {
    const validProposals = proposals.filter(isValidProposal);
    const validCritiques = critiques.filter(c => !c.risk_flags.includes('PROCESSING_ERROR'));

    const proposalSummary = validProposals
        .map(p => `[${p.agent_name}] ${p.content.summary} (Confidence: ${p.confidence_score})`)
        .join('\n');

    const critiqueSummary = validCritiques
        .map(c => `[${c.agent_name}]: ${c.content.summary}`)
        .join('\n');

    const userPrompt = `ORCHESTRATOR EVALUATION — Round ${revisionCount + 1}

BUSINESS: ${profile.summary} | Capital: ${profile.capital_range} | Stage: ${profile.business_stage}

PROPOSALS:
${proposalSummary || 'No valid proposals received.'}

CRITIQUES:
${critiqueSummary || 'No critiques available.'}

Evaluate holistically. Respond with JSON:
{
  "verdict": "ACCEPT or REJECT with reasoning",
  "financial_feasibility": 0.0-1.0,
  "market_realism": 0.0-1.0,
  "operational_feasibility": 0.0-1.0,
  "regulatory_compliance": 0.0-1.0,
  "resource_alignment": 0.0-1.0,
  "risk_exposure_inverse": 0.0-1.0,
  "conflicts": [{"type": "BUDGET_CONFLICT", "agents": ["A", "B"], "description": "...", "severity": 0.5}],
  "executive_summary": "2-3 sentence strategy summary",
  "key_risks": ["risk1"],
  "next_steps": ["step1"]
}`;

    try {
        const response = await callClaudeJSON<{
            verdict: string;
            financial_feasibility: number;
            market_realism: number;
            operational_feasibility: number;
            regulatory_compliance: number;
            resource_alignment: number;
            risk_exposure_inverse: number;
            conflicts: Array<{ type: string; agents: string[]; description: string; severity: number }>;
            executive_summary: string;
            key_risks: string[];
            next_steps: string[];
        }>(orchestrator.system_prompt, userPrompt, { maxTokens: 4096, temperature: 0.4 });

        const viability = calculateViabilityScore({
            financial_feasibility: response.financial_feasibility || 0.5,
            market_realism: response.market_realism || 0.5,
            operational_feasibility: response.operational_feasibility || 0.5,
            regulatory_compliance: response.regulatory_compliance || 0.5,
            resource_alignment: response.resource_alignment || 0.5,
            risk_exposure_inverse: response.risk_exposure_inverse || 0.5,
        });

        const conflicts: ConflictSummary[] = (response.conflicts || []).map(c => ({
            type: (c.type || 'STRATEGIC_CONFLICT') as ConflictSummary['type'],
            agents_involved: c.agents || [],
            description: c.description || '',
            severity: c.severity || 0.5,
            resolved: false,
        }));

        const { rejected, reasons } = shouldRejectPlan(viability, conflicts);
        const isForceConverge = revisionCount >= MAX_REVISIONS;
        const phase: DebatePhase = (rejected && !isForceConverge) ? 'REJECTED' : 'ACCEPTED';

        const message: AgentMessage = {
            id: uuidv4(),
            agent_id: orchestrator.id,
            agent_name: orchestrator.name,
            department: 'orchestrator',
            round: 3,
            type: 'orchestrator_evaluation',
            content: {
                assumption: 'Cross-departmental evaluation complete',
                evidence: `Viability Score: ${viability.composite}`,
                risk: reasons.length > 0 ? reasons.join('; ') : 'No critical risks',
                conflict_with_other_agent: 'N/A',
                proposed_adjustment: phase === 'REJECTED'
                    ? `REJECTED — agents must revise. Reasons: ${reasons.join('; ')}`
                    : isForceConverge
                        ? `FORCE CONVERGENCE — max revisions reached.`
                        : `ACCEPTED — strategy is viable.`,
                summary: response.executive_summary || response.verdict,
            },
            risk_flags: response.key_risks || [],
            conflicts_identified: conflicts.map(c => c.type),
            confidence_score: viability.composite,
            timestamp: new Date().toISOString(),
        };

        return { verdict: response.verdict, viability, conflicts, phase, message };
    } catch (error) {
        console.error('[ORCHESTRATOR] Evaluation error:', (error as Error).message);
        // Fallback: accept with default scores based on what we have
        const fallbackViability = calculateViabilityScore({
            financial_feasibility: 0.6,
            market_realism: 0.6,
            operational_feasibility: 0.6,
            regulatory_compliance: 0.6,
            resource_alignment: 0.6,
            risk_exposure_inverse: 0.6,
        });

        const message: AgentMessage = {
            id: uuidv4(),
            agent_id: orchestrator.id,
            agent_name: orchestrator.name,
            department: 'orchestrator',
            round: 3,
            type: 'orchestrator_evaluation',
            content: {
                assumption: 'Evaluation completed with fallback scoring',
                evidence: `Viability Score: ${fallbackViability.composite}`,
                risk: 'Orchestrator evaluation had a processing error — scores are estimated',
                conflict_with_other_agent: 'N/A',
                proposed_adjustment: 'ACCEPTED with estimated viability scores',
                summary: 'Strategy accepted using estimated viability. Manual review recommended for fine-tuning.',
            },
            risk_flags: ['ORCHESTRATOR_FALLBACK'],
            conflicts_identified: [],
            confidence_score: fallbackViability.composite,
            timestamp: new Date().toISOString(),
        };

        return {
            verdict: 'ACCEPTED (fallback)',
            viability: fallbackViability,
            conflicts: [],
            phase: 'ACCEPTED',
            message,
        };
    }
}

// ===== GENERATE FINAL STRATEGY OUTPUT =====
async function generateStrategyOutput(
    orchestrator: AgentRole,
    proposals: AgentMessage[],
    profile: BusinessProfile,
    viability: ViabilityScore
): Promise<StrategyOutput> {
    const validProposals = proposals.filter(isValidProposal);

    const proposalData = validProposals
        .map(p => `[${p.agent_name} — ${p.department}]: ${p.content.summary}\nMetrics: ${JSON.stringify(p.quantitative_outputs || {})}`)
        .join('\n\n');

    if (validProposals.length === 0) {
        // No valid proposals — return a minimal output
        return {
            id: uuidv4(),
            business_profile: profile,
            executive_summary: 'Strategy generation encountered errors across all departments. Please try again with a more detailed business description.',
            departments: [],
            viability_score: viability,
            key_risks: ['All agent proposals failed — retry recommended'],
            next_steps: ['Retry with more specific business details', 'Break down the business description into clearer components'],
            generated_at: new Date().toISOString(),
        };
    }

    const deptList = validProposals.map(p => `"${p.department}"`).join(', ');
    const deptEntries = validProposals.map(p =>
        `{"department":"${p.department}","agent_name":"${p.agent_name}","summary":"${p.content.summary.replace(/"/g, "'").substring(0, 150)}"}`
    ).join(',\n');

    const userPrompt = `Create a consolidated strategy output. KEEP ALL VALUES SHORT — under 150 chars each.

BUSINESS: ${profile.summary}
INDUSTRY: ${profile.industry} | CAPITAL: ${profile.capital_range}

AGENT PROPOSALS:
${proposalData}

You MUST include exactly these departments: [${deptList}]

Respond with this exact JSON structure:
{
  "executive_summary": "3-4 sentences summarizing the full strategy",
  "departments": [
    ${validProposals.map(p => `{
      "department": "${p.department}",
      "agent_name": "${p.agent_name}",
      "title": "short title",
      "summary": "2 sentences max",
      "key_metrics": {"metric1": "value1", "metric2": "value2"},
      "action_items": ["action1", "action2", "action3"],
      "risks": ["risk1", "risk2"],
      "timeline": "timeline description",
      "details": "1 paragraph of detail"
    }`).join(',\n    ')}
  ],
  "key_risks": ["risk1", "risk2", "risk3"],
  "next_steps": ["step1", "step2", "step3"]
}`;

    try {
        const response = await callClaudeJSON<{
            executive_summary: string;
            departments: DepartmentOutput[];
            key_risks: string[];
            next_steps: string[];
        }>(orchestrator.system_prompt, userPrompt, { maxTokens: 16384, temperature: 0.5 });

        // Validate we got real data
        const hasDepts = response.departments && response.departments.length > 0;
        const hasExecSummary = response.executive_summary && response.executive_summary.length > 20;

        if (!hasDepts || !hasExecSummary) {
            console.warn('[OUTPUT] LLM returned incomplete strategy, building from proposals');
            throw new Error('Incomplete strategy output — falling back to proposal-based output');
        }

        return {
            id: uuidv4(),
            business_profile: profile,
            executive_summary: response.executive_summary,
            departments: response.departments.map(d => ({
                ...d,
                action_items: d.action_items || [],
                risks: d.risks || [],
                key_metrics: d.key_metrics || {},
            })),
            viability_score: viability,
            key_risks: response.key_risks || [],
            next_steps: response.next_steps || [],
            generated_at: new Date().toISOString(),
        };
    } catch (error) {
        console.error('[OUTPUT] Strategy generation error:', (error as Error).message);
        // Fallback: build output from individual proposals
        const departments: DepartmentOutput[] = validProposals.map(p => ({
            department: p.department,
            agent_name: p.agent_name,
            title: `${p.agent_name} — ${p.department.charAt(0).toUpperCase() + p.department.slice(1)} Strategy`,
            summary: p.content.summary,
            key_metrics: p.quantitative_outputs || {},
            action_items: [p.content.proposed_adjustment].filter(Boolean),
            risks: p.risk_flags.filter(f => f !== 'PROCESSING_ERROR'),
            timeline: 'To be determined',
            details: `Assumption: ${p.content.assumption}\n\nEvidence: ${p.content.evidence}\n\nRisk: ${p.content.risk}`,
        }));

        return {
            id: uuidv4(),
            business_profile: profile,
            executive_summary: validProposals.map(p => p.content.summary).join(' '),
            departments,
            viability_score: viability,
            key_risks: validProposals.flatMap(p => p.risk_flags).filter(f => f !== 'PROCESSING_ERROR'),
            next_steps: ['Review individual department strategies', 'Refine budget allocation', 'Begin implementation planning'],
            generated_at: new Date().toISOString(),
        };
    }
}

// ===== MAIN DEBATE ORCHESTRATION =====
export async function runDebate(
    profile: BusinessProfile,
    agents: AgentRole[],
    onMessage: (message: AgentMessage) => void,
    onPhaseChange: (phase: DebatePhase) => void,
    onConflict: (conflict: ConflictSummary) => void
): Promise<DebateState> {
    const sessionId = uuidv4();
    const orchestrator = agents.find(a => a.department === 'orchestrator')!;
    const departmentAgents = agents.filter(a => a.department !== 'orchestrator' && a.is_active);

    const state: DebateState = {
        session_id: sessionId,
        business_profile: profile,
        agents,
        rounds: [],
        current_phase: 'INITIAL_PROPOSAL',
        revision_count: 0,
        max_revisions: MAX_REVISIONS,
        status: 'in_progress',
    };

    let allProposals: AgentMessage[] = [];
    let currentViability: ViabilityScore | undefined;

    for (let revision = 0; revision <= MAX_REVISIONS; revision++) {
        // === ROUND 1: Proposals ===
        const roundContext = revision === 0
            ? 'This is the INITIAL proposal round. Present your best strategy for your department.'
            : `This is REVISION round ${revision}. Improve your proposal.`;

        onPhaseChange(revision === 0 ? 'INITIAL_PROPOSAL' : 'REVISED_PROPOSAL');
        state.current_phase = revision === 0 ? 'INITIAL_PROPOSAL' : 'REVISED_PROPOSAL';

        const proposals = await Promise.all(
            departmentAgents.map(agent => getAgentProposal(agent, profile, roundContext))
        );
        allProposals = proposals;
        proposals.forEach(p => {
            p.round = revision * 3 + 1;
            onMessage(p);
        });

        // === ROUND 2: Cross-Analysis ===
        onPhaseChange('CROSS_ANALYSIS');
        state.current_phase = 'CROSS_ANALYSIS';

        const critiques: AgentMessage[] = [];
        const validForCritique = proposals.filter(isValidProposal);

        // Each agent critiques another agent's valid proposal
        for (const agent of departmentAgents.slice(0, 3)) {
            const target = validForCritique.find(p => p.agent_id !== agent.id);
            if (target) {
                const critique = await getAgentCritique(agent, target, proposals, profile);
                critique.round = revision * 3 + 2;
                critiques.push(critique);
                onMessage(critique);
            }
        }

        // === ROUND 3: Orchestrator Evaluation ===
        onPhaseChange('ORCHESTRATOR_EVALUATION');
        state.current_phase = 'ORCHESTRATOR_EVALUATION';

        const evaluation = await orchestratorEvaluate(
            orchestrator,
            proposals,
            critiques,
            profile,
            revision
        );

        currentViability = evaluation.viability;
        onMessage(evaluation.message);
        evaluation.conflicts.forEach(c => onConflict(c));

        const round: DebateRound = {
            round_number: revision + 1,
            phase: evaluation.phase,
            messages: [...proposals, ...critiques, evaluation.message],
            conflicts: evaluation.conflicts,
            orchestrator_verdict: evaluation.verdict,
            revision_count: revision,
        };
        state.rounds.push(round);

        if (evaluation.phase === 'ACCEPTED') {
            state.current_phase = 'ACCEPTED';
            state.viability_score = evaluation.viability;
            break;
        }

        state.revision_count = revision + 1;

        if (revision >= MAX_REVISIONS) {
            state.current_phase = 'ACCEPTED';
            state.viability_score = evaluation.viability;
        }
    }

    // === Generate final strategy output ===
    if (currentViability) {
        const strategyOutput = await generateStrategyOutput(
            orchestrator,
            allProposals,
            profile,
            currentViability
        );
        state.final_strategy = strategyOutput;
    }

    state.status = 'completed';
    return state;
}

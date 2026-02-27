import { ViabilityScore, ComplexityScores, BusinessProfile, ConflictSummary, ConflictType } from '../types';

export function calculateComplexityScores(profile: BusinessProfile): ComplexityScores {
    const {
        capital_numeric,
        scale,
        growth_intent,
        competition_density,
        tech_dependency_score,
        regulation_score,
        physical_infrastructure_score,
        business_stage,
    } = profile;

    // Normalize capital to 0-1 scale (logarithmic — $1K=0.1, $100K=0.4, $1M=0.6, $10M=0.8, $100M=1.0)
    const capitalNorm = Math.min(1, Math.log10(Math.max(capital_numeric, 1000)) / 8);

    return {
        finance: Math.min(1, capitalNorm * scale * growth_intent * 2.5),
        marketing: Math.min(1, competition_density * (1 + scale) * 0.8),
        tech: tech_dependency_score,
        licensing: regulation_score,
        supply: physical_infrastructure_score,
        growth: Math.min(1, growth_intent * scale * 1.5),
        market_research: Math.min(1, competition_density * 0.8 + growth_intent * 0.3),
        launch: business_stage === 'idea' || business_stage === 'pre_launch' ? 0.8 : 0.3,
    };
}

export function calculateViabilityScore(scores: {
    financial_feasibility: number;
    market_realism: number;
    operational_feasibility: number;
    regulatory_compliance: number;
    resource_alignment: number;
    risk_exposure_inverse: number;
}): ViabilityScore {
    const composite =
        0.3 * scores.financial_feasibility +
        0.2 * scores.market_realism +
        0.15 * scores.operational_feasibility +
        0.15 * scores.regulatory_compliance +
        0.1 * scores.resource_alignment +
        0.1 * scores.risk_exposure_inverse;

    return {
        ...scores,
        composite: Math.round(composite * 100) / 100,
    };
}

export function detectConflicts(
    proposals: Array<{ agent_id: string; agent_name: string; content: string }>
): ConflictSummary[] {
    const conflicts: ConflictSummary[] = [];

    // This is augmented by Claude in the debate engine — here we do basic structural checks
    for (let i = 0; i < proposals.length; i++) {
        for (let j = i + 1; j < proposals.length; j++) {
            const a = proposals[i];
            const b = proposals[j];

            // Check for resource conflicts
            if (
                a.content.toLowerCase().includes('budget') &&
                b.content.toLowerCase().includes('budget')
            ) {
                conflicts.push({
                    type: 'RESOURCE_CONFLICT' as ConflictType,
                    agents_involved: [a.agent_name, b.agent_name],
                    description: `Both ${a.agent_name} and ${b.agent_name} have competing budget requirements`,
                    severity: 0.5,
                    resolved: false,
                });
            }
        }
    }

    return conflicts;
}

export function shouldRejectPlan(viability: ViabilityScore, conflicts: ConflictSummary[]): {
    rejected: boolean;
    reasons: string[];
} {
    const reasons: string[] = [];

    if (viability.composite < 0.65) {
        reasons.push(`Overall viability score (${viability.composite}) below threshold (0.65)`);
    }
    if (viability.financial_feasibility < 0.5) {
        reasons.push(`Financial feasibility (${viability.financial_feasibility}) critically low`);
    }
    if (viability.regulatory_compliance < 0.4) {
        reasons.push(`Regulatory compliance (${viability.regulatory_compliance}) critically low`);
    }

    const unresolvedCritical = conflicts.filter(c => !c.resolved && c.severity > 0.7);
    if (unresolvedCritical.length > 0) {
        reasons.push(`${unresolvedCritical.length} unresolved critical conflicts`);
    }

    return {
        rejected: reasons.length > 0,
        reasons,
    };
}

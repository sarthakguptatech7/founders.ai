import { BusinessProfile } from '../types';
import { callClaudeJSON } from './claude-client';
import { v4 as uuidv4 } from 'uuid';

const BUSINESS_ANALYSIS_PROMPT = `You are a Business Intelligence Analyst. Your job is to analyze a raw business description and extract a structured business profile.

You must return a JSON object with these exact fields:
{
  "industry": "string - the primary industry (e.g., 'Food & Beverage', 'Technology', 'Healthcare')",
  "business_stage": "one of: 'idea', 'pre_launch', 'early', 'growth', 'mature'",
  "geography": "string - primary market geography",
  "scale": "number 0-1 (0.1=micro, 0.3=small, 0.5=medium, 0.7=large, 0.9=enterprise)",
  "capital_range": "string description (e.g., '$10K-$50K', '₹10L-₹50L')",
  "capital_numeric": "number - estimated capital in USD",
  "tech_dependency_score": "number 0-1 (how much does this business depend on technology?)",
  "regulation_score": "number 0-1 (how regulated is this industry?)",
  "physical_infrastructure_score": "number 0-1 (how much physical infrastructure needed?)",
  "competition_density": "number 0-1 (how competitive is the market?)",
  "growth_intent": "number 0-1 (how aggressively does the founder want to grow?)",
  "summary": "string - 2-3 sentence summary of the business"
}

Be realistic with scores. A cloud kitchen has high physical_infrastructure_score but moderate tech_dependency_score. A SaaS startup has high tech_dependency_score but low physical_infrastructure_score.`;

export async function analyzeBusinessIntent(prompt: string): Promise<BusinessProfile> {
    const result = await callClaudeJSON<Omit<BusinessProfile, 'id' | 'raw_input'>>(
        BUSINESS_ANALYSIS_PROMPT,
        `Analyze this business description and extract the structured profile:\n\n"${prompt}"`,
        { temperature: 0.3 }
    );

    return {
        id: uuidv4(),
        raw_input: prompt,
        ...result,
    };
}

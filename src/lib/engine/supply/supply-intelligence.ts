import { GoogleGenerativeAI } from '@google/generative-ai';

// ===== TYPES =====
export interface SupplyDisruption {
    id: string;
    type: 'shortage' | 'price_spike' | 'supplier_delay' | 'quality_issue' | 'market_shift';
    severity: 'low' | 'medium' | 'high' | 'critical';
    sku: string;
    supplier: string;
    description: string;
    detected_at: string;
    predicted_impact: string;
    status: 'detected' | 'analyzing' | 'resolved' | 'escalated';
}

export interface AutonomousAction {
    id: string;
    disruption_id: string;
    type: 'reroute_order' | 'switch_supplier' | 'negotiate_contract' | 'adjust_procurement' | 'sync_marketing' | 'alert_team';
    description: string;
    executed_at: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    result?: string;
    cost_impact?: string;
}

export interface PredictiveForecast {
    sku: string;
    name: string;
    current_stock: number;
    predicted_demand_30d: number;
    predicted_demand_60d: number;
    shortage_probability: number;
    recommended_action: string;
    confidence: number;
    risk_factors: string[];
}

export interface SupplyChainState {
    disruptions: SupplyDisruption[];
    actions: AutonomousAction[];
    forecasts: PredictiveForecast[];
    health_score: number;
    last_scan: string;
    learning_cycles: number;
    strategy_adjustments: number;
}

// ===== IN-MEMORY STORE =====
const DEFAULT_STATE: SupplyChainState = {
    disruptions: [],
    actions: [],
    forecasts: [],
    health_score: 94,
    last_scan: new Date().toISOString(),
    learning_cycles: 0,
    strategy_adjustments: 0,
};

const g = globalThis as unknown as { _supplyChainState?: SupplyChainState };
function getState(): SupplyChainState {
    if (!g._supplyChainState) g._supplyChainState = { ...DEFAULT_STATE };
    return g._supplyChainState;
}

export function getSupplyChainState(): SupplyChainState {
    return getState();
}

export function addDisruption(d: SupplyDisruption): void {
    getState().disruptions.unshift(d);
}

export function addAction(a: AutonomousAction): void {
    getState().actions.unshift(a);
}

export function updateForecasts(f: PredictiveForecast[]): void {
    getState().forecasts = f;
}

export function incrementLearning(): void {
    const s = getState();
    s.learning_cycles += 1;
    s.last_scan = new Date().toISOString();
}

export function incrementAdjustments(): void {
    getState().strategy_adjustments += 1;
}

export function updateHealthScore(score: number): void {
    getState().health_score = score;
}

// ===== GEMINI-POWERED INTELLIGENCE =====
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeSupplyChain(businessContext: string): Promise<{
    disruptions: SupplyDisruption[];
    actions: AutonomousAction[];
    forecasts: PredictiveForecast[];
    health_score: number;
}> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const prompt = `You are an autonomous supply chain intelligence agent. Analyze:

${businessContext}

Return JSON with exactly this structure:
{
  "disruptions": [
    {
      "id": "DIS-XXX",
      "type": "shortage|price_spike|supplier_delay|quality_issue|market_shift",
      "severity": "low|medium|high|critical",
      "sku": "string",
      "supplier": "string",
      "description": "string",
      "detected_at": "ISO date",
      "predicted_impact": "string",
      "status": "detected"
    }
  ],
  "actions": [
    {
      "id": "ACT-XXX",
      "disruption_id": "DIS-XXX",
      "type": "reroute_order|switch_supplier|negotiate_contract|adjust_procurement|sync_marketing|alert_team",
      "description": "string",
      "executed_at": "ISO date",
      "status": "completed",
      "result": "string",
      "cost_impact": "string"
    }
  ],
  "forecasts": [
    {
      "sku": "SKU-XXX",
      "name": "string",
      "current_stock": 100,
      "predicted_demand_30d": 150,
      "predicted_demand_60d": 320,
      "shortage_probability": 0.75,
      "recommended_action": "string",
      "confidence": 0.88,
      "risk_factors": ["string"]
    }
  ],
  "health_score": 85
}

Generate 3-4 disruptions, 4-5 autonomous actions taken, and 4-5 predictive forecasts. Make the data realistic for the business context. Be specific with supplier names, SKU references, and dollar/rupee amounts.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);

    // Store results
    const state = getState();
    state.disruptions = parsed.disruptions || [];
    state.actions = parsed.actions || [];
    state.forecasts = parsed.forecasts || [];
    state.health_score = parsed.health_score || 85;
    state.last_scan = new Date().toISOString();
    state.learning_cycles += 1;
    state.strategy_adjustments += (parsed.actions?.length || 0);

    return parsed;
}

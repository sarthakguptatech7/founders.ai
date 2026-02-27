// ===== BUSINESS PROFILE =====
export interface BusinessProfile {
  id: string;
  raw_input: string;
  industry: string;
  business_stage: 'idea' | 'pre_launch' | 'early' | 'growth' | 'mature';
  geography: string;
  scale: number; // 0-1
  capital_range: string;
  capital_numeric: number;
  tech_dependency_score: number; // 0-1
  regulation_score: number; // 0-1
  physical_infrastructure_score: number; // 0-1
  competition_density: number; // 0-1
  growth_intent: number; // 0-1
  summary: string;
}

// ===== AGENT SYSTEM =====
export type Department =
  | 'finance'
  | 'marketing'
  | 'growth'
  | 'market_research'
  | 'tech'
  | 'licensing'
  | 'supply'
  | 'launch'
  | 'orchestrator';

export interface AgentRole {
  id: string;
  name: string;
  title: string;
  department: Department;
  system_prompt: string;
  activation_score: number;
  is_active: boolean;
  color: string;
  icon: string;
  sub_agents?: AgentRole[];
}

// ===== DEBATE ENGINE =====
export type ConflictType =
  | 'RESOURCE_CONFLICT'
  | 'TIMELINE_CONFLICT'
  | 'FINANCIAL_CONFLICT'
  | 'MARKET_CONFLICT'
  | 'LEGAL_CONFLICT'
  | 'STRATEGIC_CONFLICT';

export interface AgentMessage {
  id: string;
  agent_id: string;
  agent_name: string;
  department: Department;
  round: number;
  type: 'proposal' | 'critique' | 'revision' | 'orchestrator_evaluation' | 'clarification';
  content: {
    assumption: string;
    evidence: string;
    risk: string;
    conflict_with_other_agent: string;
    proposed_adjustment: string;
    summary: string;
  };
  quantitative_outputs?: Record<string, string | number>;
  risk_flags: string[];
  conflicts_identified: ConflictType[];
  confidence_score: number;
  timestamp: string;
}

export type DebatePhase =
  | 'INITIAL_PROPOSAL'
  | 'CROSS_ANALYSIS'
  | 'CONFLICT_DETECTION'
  | 'REVISION_REQUEST'
  | 'REVISED_PROPOSAL'
  | 'ORCHESTRATOR_EVALUATION'
  | 'ACCEPTED'
  | 'REJECTED';

export interface DebateRound {
  round_number: number;
  phase: DebatePhase;
  messages: AgentMessage[];
  conflicts: ConflictSummary[];
  orchestrator_verdict?: string;
  revision_count: number;
}

export interface ConflictSummary {
  type: ConflictType;
  agents_involved: string[];
  description: string;
  severity: number; // 0-1
  resolved: boolean;
}

export interface ViabilityScore {
  financial_feasibility: number;
  market_realism: number;
  operational_feasibility: number;
  regulatory_compliance: number;
  resource_alignment: number;
  risk_exposure_inverse: number;
  composite: number;
}

export interface DebateState {
  session_id: string;
  business_profile: BusinessProfile;
  agents: AgentRole[];
  rounds: DebateRound[];
  current_phase: DebatePhase;
  viability_score?: ViabilityScore;
  final_strategy?: StrategyOutput;
  revision_count: number;
  max_revisions: number;
  status: 'in_progress' | 'completed' | 'failed';
}

// ===== STRATEGY OUTPUT =====
export interface DepartmentOutput {
  department: Department;
  agent_name: string;
  title: string;
  summary: string;
  key_metrics: Record<string, string | number>;
  action_items: string[];
  risks: string[];
  timeline: string;
  details: string;
}

export interface StrategyOutput {
  id: string;
  business_profile: BusinessProfile;
  executive_summary: string;
  departments: DepartmentOutput[];
  viability_score: ViabilityScore;
  key_risks: string[];
  next_steps: string[];
  generated_at: string;
}

// ===== MEMORY =====
export interface FactMemory {
  business_data: Record<string, unknown>;
  financial_numbers: Record<string, number>;
  legal_requirements: string[];
}

export interface EpisodicMemory {
  proposals: AgentMessage[];
  rejections: { round: number; reason: string }[];
  decision_timeline: { timestamp: string; action: string; agent: string }[];
}

export interface SessionMemory {
  session_id: string;
  business_profile?: BusinessProfile;
  agents: AgentRole[];
  debate_state?: DebateState;
  fact_memory: FactMemory;
  episodic_memory: EpisodicMemory;
  created_at: string;
  updated_at: string;
}

// ===== COMPLEXITY SCORES =====
export interface ComplexityScores {
  finance: number;
  marketing: number;
  tech: number;
  licensing: number;
  supply: number;
  growth: number;
  market_research: number;
  launch: number;
}

// ===== API TYPES =====
export interface BusinessAnalysisRequest {
  prompt: string;
}

export interface BusinessAnalysisResponse {
  profile: BusinessProfile;
  complexity_scores: ComplexityScores;
}

export interface AgentGenerationRequest {
  profile: BusinessProfile;
  complexity_scores: ComplexityScores;
}

export interface AgentGenerationResponse {
  agents: AgentRole[];
}

export interface DebateRequest {
  session_id: string;
  profile: BusinessProfile;
  agents: AgentRole[];
}

export interface DebateStreamEvent {
  type: 'agent_message' | 'phase_change' | 'conflict' | 'verdict' | 'complete' | 'error';
  data: AgentMessage | DebatePhase | ConflictSummary | StrategyOutput | string;
}

// ===== UI STATE =====
export type PipelineStage =
  | 'idle'
  | 'analyzing_business'
  | 'generating_agents'
  | 'debating'
  | 'generating_output'
  | 'complete'
  | 'error';

export interface AppState {
  // Pipeline
  stage: PipelineStage;
  error: string | null;

  // Data
  businessProfile: BusinessProfile | null;
  complexityScores: ComplexityScores | null;
  agents: AgentRole[];
  debateMessages: AgentMessage[];
  debatePhase: DebatePhase | null;
  conflicts: ConflictSummary[];
  viabilityScore: ViabilityScore | null;
  strategyOutput: StrategyOutput | null;

  // UI
  selectedAgent: string | null;
  activeTab: string;

  // Actions
  setStage: (stage: PipelineStage) => void;
  setError: (error: string | null) => void;
  setBusinessProfile: (profile: BusinessProfile) => void;
  setComplexityScores: (scores: ComplexityScores) => void;
  setAgents: (agents: AgentRole[]) => void;
  addDebateMessage: (message: AgentMessage) => void;
  setDebatePhase: (phase: DebatePhase) => void;
  addConflict: (conflict: ConflictSummary) => void;
  setViabilityScore: (score: ViabilityScore) => void;
  setStrategyOutput: (output: StrategyOutput) => void;
  setSelectedAgent: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  reset: () => void;
}

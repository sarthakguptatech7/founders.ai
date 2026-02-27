import { GoogleGenerativeAI } from '@google/generative-ai';

// ===== TYPES =====
export interface InvestorProfile {
  id: string;
  name: string;
  firm: string;
  type: 'angel' | 'vc' | 'pe' | 'corporate' | 'family_office';
  stage_focus: string[];
  sector_focus: string[];
  check_size: string;
  portfolio_companies: string[];
  location: string;
  match_score: number;
  status: 'identified' | 'researched' | 'outreach_sent' | 'meeting_scheduled' | 'in_negotiation' | 'term_sheet' | 'passed';
  contact_method: string;
  notes: string;
}

export interface PitchDeckSlide {
  title: string;
  content: string;
  type: 'cover' | 'problem' | 'solution' | 'market' | 'traction' | 'business_model' | 'team' | 'financials' | 'ask' | 'closing';
}

export interface OutreachAction {
  id: string;
  investor_id: string;
  investor_name: string;
  type: 'email' | 'linkedin' | 'warm_intro' | 'meeting_scheduled' | 'followup';
  subject: string;
  status: 'drafted' | 'sent' | 'opened' | 'replied' | 'meeting_set';
  sent_at: string;
  response?: string;
}

export interface NegotiationTerm {
  term: string;
  proposed_value: string;
  market_benchmark: string;
  ai_recommendation: string;
  favorability: 'favorable' | 'neutral' | 'unfavorable';
}

export interface FundraisingState {
  investors: InvestorProfile[];
  pitch_deck: PitchDeckSlide[];
  outreach: OutreachAction[];
  negotiations: NegotiationTerm[];
  round_target: string;
  valuation_estimate: string;
  pipeline_value: string;
  meetings_scheduled: number;
}

// ===== IN-MEMORY STORE =====
const g = globalThis as unknown as { _fundraisingState?: FundraisingState };
function getState(): FundraisingState {
  if (!g._fundraisingState) g._fundraisingState = {
    investors: [], pitch_deck: [], outreach: [], negotiations: [],
    round_target: '', valuation_estimate: '', pipeline_value: '', meetings_scheduled: 0,
  };
  return g._fundraisingState;
}

export function getFundraisingState(): FundraisingState { return getState(); }

// ===== GEMINI-POWERED INTELLIGENCE =====
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function runFundraisingAgent(businessContext: string): Promise<FundraisingState> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  const prompt = `You are an autonomous fundraising & investor relations AI agent. Analyze:

${businessContext}

Return JSON with this structure:
{
  "round_target": "$X amount",
  "valuation_estimate": "$X valuation",
  "pipeline_value": "$X in pipeline",
  "meetings_scheduled": 5,
  "investors": [
    {
      "id": "INV-001",
      "name": "Person Name",
      "firm": "VC Firm Name",
      "type": "angel|vc|pe|corporate|family_office",
      "stage_focus": ["seed", "series_a"],
      "sector_focus": ["AI/ML", "SaaS"],
      "check_size": "$100K-500K",
      "portfolio_companies": ["Company1", "Company2"],
      "location": "City, Country",
      "match_score": 0.92,
      "status": "identified|researched|outreach_sent|meeting_scheduled",
      "contact_method": "LinkedIn / Email / Warm Intro via X",
      "notes": "Why this investor is a fit"
    }
  ],
  "pitch_deck": [
    { "title": "Slide Title", "content": "Slide bullet points", "type": "cover|problem|solution|market|traction|business_model|team|financials|ask|closing" }
  ],
  "outreach": [
    {
      "id": "OUT-001",
      "investor_id": "INV-001",
      "investor_name": "Name",
      "type": "email|linkedin|warm_intro|meeting_scheduled|followup",
      "subject": "Email subject line",
      "status": "drafted|sent|opened|replied|meeting_set",
      "sent_at": "ISO date",
      "response": "Response preview if any"
    }
  ],
  "negotiations": [
    {
      "term": "Pre-money Valuation",
      "proposed_value": "$5M",
      "market_benchmark": "$3-7M for this stage",
      "ai_recommendation": "Accept — within market range",
      "favorability": "favorable|neutral|unfavorable"
    }
  ]
}

Generate 5-6 realistic investors, 8-10 pitch deck slides, 4-5 outreach actions, and 5-6 negotiation terms. Make data specific to the business context provided.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');

  const parsed = JSON.parse(jsonMatch[0]);
  const state = getState();
  Object.assign(state, parsed);
  return state;
}

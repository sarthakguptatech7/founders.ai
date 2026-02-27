import { SessionMemory, BusinessProfile, AgentRole, AgentMessage, DebateState } from '../types';
import { v4 as uuidv4 } from 'uuid';

class MemoryStore {
    private sessions: Map<string, SessionMemory> = new Map();

    createSession(): SessionMemory {
        const session: SessionMemory = {
            session_id: uuidv4(),
            agents: [],
            fact_memory: {
                business_data: {},
                financial_numbers: {},
                legal_requirements: [],
            },
            episodic_memory: {
                proposals: [],
                rejections: [],
                decision_timeline: [],
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        this.sessions.set(session.session_id, session);
        return session;
    }

    getSession(sessionId: string): SessionMemory | undefined {
        return this.sessions.get(sessionId);
    }

    updateBusinessProfile(sessionId: string, profile: BusinessProfile): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.business_profile = profile;
            session.fact_memory.business_data = { ...profile };
            session.updated_at = new Date().toISOString();
        }
    }

    updateAgents(sessionId: string, agents: AgentRole[]): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.agents = agents;
            session.updated_at = new Date().toISOString();
        }
    }

    addProposal(sessionId: string, message: AgentMessage): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.episodic_memory.proposals.push(message);
            session.episodic_memory.decision_timeline.push({
                timestamp: new Date().toISOString(),
                action: `${message.type}: ${message.content.summary}`,
                agent: message.agent_name,
            });
            session.updated_at = new Date().toISOString();
        }
    }

    addRejection(sessionId: string, round: number, reason: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.episodic_memory.rejections.push({ round, reason });
            session.updated_at = new Date().toISOString();
        }
    }

    updateDebateState(sessionId: string, state: DebateState): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.debate_state = state;
            session.updated_at = new Date().toISOString();
        }
    }

    getAllSessions(): SessionMemory[] {
        return Array.from(this.sessions.values());
    }

    deleteSession(sessionId: string): void {
        this.sessions.delete(sessionId);
    }
}

// Singleton instance
export const memoryStore = new MemoryStore();

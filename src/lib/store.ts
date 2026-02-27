import { create } from 'zustand';
import { AppState, PipelineStage, BusinessProfile, ComplexityScores, AgentRole, AgentMessage, DebatePhase, ConflictSummary, ViabilityScore, StrategyOutput } from '@/lib/types';

// Tech project types (mirrored from server)
interface TechFileInfo {
    path: string;
    purpose: string;
    content?: string;
}

interface TechProjectInfo {
    id: string;
    name: string;
    scope: string;
    status: string;
    currentVersion: number;
    previewReady: boolean;
}

interface TechState {
    techProject: TechProjectInfo | null;
    techFiles: TechFileInfo[];
    techBuildStatus: 'idle' | 'building' | 'ready' | 'editing' | 'error';
    techBuildMessage: string;
    techSelectedFile: string | null;
    techFileContent: string;
    techEditHistory: string[];
    setTechProject: (project: TechProjectInfo | null) => void;
    setTechFiles: (files: TechFileInfo[]) => void;
    setTechBuildStatus: (status: TechState['techBuildStatus']) => void;
    setTechBuildMessage: (message: string) => void;
    setTechSelectedFile: (path: string | null) => void;
    setTechFileContent: (content: string) => void;
    addTechEdit: (edit: string) => void;
    setTechFileByPath: (path: string, content: string) => void;
    resetTech: () => void;
}

export const useAppStore = create<AppState & TechState>((set) => ({
    // Pipeline
    stage: 'idle',
    error: null,

    // Data
    businessProfile: null,
    complexityScores: null,
    agents: [],
    debateMessages: [],
    debatePhase: null,
    conflicts: [],
    viabilityScore: null,
    strategyOutput: null,

    // UI
    selectedAgent: null,
    activeTab: 'overview',

    // Tech Agent
    techProject: null,
    techFiles: [],
    techBuildStatus: 'idle',
    techBuildMessage: '',
    techSelectedFile: null,
    techFileContent: '',
    techEditHistory: [],

    // Actions — Pipeline
    setStage: (stage: PipelineStage) => set({ stage, error: stage === 'error' ? undefined : null }),
    setError: (error: string | null) => set({ error, stage: error ? 'error' : undefined }),
    setBusinessProfile: (profile: BusinessProfile) => set({ businessProfile: profile }),
    setComplexityScores: (scores: ComplexityScores) => set({ complexityScores: scores }),
    setAgents: (agents: AgentRole[]) => set({ agents }),
    addDebateMessage: (message: AgentMessage) =>
        set((state) => ({ debateMessages: [...state.debateMessages, message] })),
    setDebatePhase: (phase: DebatePhase) => set({ debatePhase: phase }),
    addConflict: (conflict: ConflictSummary) =>
        set((state) => ({ conflicts: [...state.conflicts, conflict] })),
    setViabilityScore: (score: ViabilityScore) => set({ viabilityScore: score }),
    setStrategyOutput: (output: StrategyOutput) => set({ strategyOutput: output }),
    setSelectedAgent: (id: string | null) => set({ selectedAgent: id }),
    setActiveTab: (tab: string) => set({ activeTab: tab }),
    reset: () =>
        set({
            stage: 'idle',
            error: null,
            businessProfile: null,
            complexityScores: null,
            agents: [],
            debateMessages: [],
            debatePhase: null,
            conflicts: [],
            viabilityScore: null,
            strategyOutput: null,
            selectedAgent: null,
            activeTab: 'overview',
            techProject: null,
            techFiles: [],
            techBuildStatus: 'idle',
            techBuildMessage: '',
            techSelectedFile: null,
            techFileContent: '',
            techEditHistory: [],
        }),

    // Actions — Tech Agent
    setTechProject: (project) => set({ techProject: project }),
    setTechFiles: (files) => set({ techFiles: files }),
    setTechBuildStatus: (status) => set({ techBuildStatus: status }),
    setTechBuildMessage: (message) => set({ techBuildMessage: message }),
    setTechSelectedFile: (path) => set({ techSelectedFile: path }),
    setTechFileContent: (content) => set({ techFileContent: content }),
    addTechEdit: (edit) => set((state) => ({ techEditHistory: [...state.techEditHistory, edit] })),
    setTechFileByPath: (path, content) => set((state) => ({
        techFiles: state.techFiles.map(f => f.path === path ? { ...f, content } : f),
    })),
    resetTech: () => set({
        techProject: null,
        techFiles: [],
        techBuildStatus: 'idle',
        techBuildMessage: '',
        techSelectedFile: null,
        techFileContent: '',
        techEditHistory: [],
    }),
}));

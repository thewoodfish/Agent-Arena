'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import type { AgentConfig, BattleOutcome, MatchState, RoundResult } from '@/lib/types';

export type Screen = 'build' | 'lobby' | 'battle' | 'results';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'loading';
  message: string;
}

interface GameState {
  currentScreen: Screen;
  agentConfig: AgentConfig | null;
  currentMatch: MatchState | null;
  battleRounds: RoundResult[];
  battleOutcome: BattleOutcome | null;
  isSimulating: boolean;
  streamingRound: number;
  walletAddress: string | null;
  connectedWallet: boolean;
  demoMode: boolean;
  toasts: Toast[];

  // Actions
  setScreen: (screen: Screen) => void;
  setAgentConfig: (config: AgentConfig) => void;
  computePowerRating: (config: Partial<AgentConfig>) => number;
  setCurrentMatch: (match: MatchState) => void;
  addRound: (round: RoundResult) => void;
  setBattleOutcome: (outcome: BattleOutcome) => void;
  setSimulating: (val: boolean) => void;
  incrementStreamingRound: () => void;
  setWallet: (address: string | null, connected: boolean) => void;
  toggleDemoMode: () => void;
  resetBattle: () => void;
  resetAll: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      immer((set, get) => ({
        currentScreen: 'build',
        agentConfig: null,
        currentMatch: null,
        battleRounds: [],
        battleOutcome: null,
        isSimulating: false,
        streamingRound: 0,
        walletAddress: null,
        connectedWallet: false,
        demoMode: true,
        toasts: [],

        setScreen: (screen) =>
          set((state) => { state.currentScreen = screen; }),

        setAgentConfig: (config) =>
          set((state) => { state.agentConfig = config; }),

        computePowerRating: (config) => {
          const { aggression = 50, riskTolerance = 50, defenseWeight = 50, adaptability = 50 } = config;
          return Math.round((aggression * 35 + riskTolerance * 20 + defenseWeight * 20 + adaptability * 25) / 100);
        },

        setCurrentMatch: (match) =>
          set((state) => { state.currentMatch = match; }),

        addRound: (round) =>
          set((state) => { state.battleRounds.push(round); }),

        setBattleOutcome: (outcome) =>
          set((state) => { state.battleOutcome = outcome; }),

        setSimulating: (val) =>
          set((state) => { state.isSimulating = val; }),

        incrementStreamingRound: () =>
          set((state) => { state.streamingRound += 1; }),

        setWallet: (address, connected) =>
          set((state) => {
            state.walletAddress = address;
            state.connectedWallet = connected;
            if (connected) state.demoMode = false;
          }),

        toggleDemoMode: () =>
          set((state) => { state.demoMode = !state.demoMode; }),

        resetBattle: () =>
          set((state) => {
            state.battleRounds = [];
            state.battleOutcome = null;
            state.isSimulating = false;
            state.streamingRound = 0;
            state.currentMatch = null;
          }),

        resetAll: () =>
          set((state) => {
            state.currentScreen = 'build';
            state.currentMatch = null;
            state.battleRounds = [];
            state.battleOutcome = null;
            state.isSimulating = false;
            state.streamingRound = 0;
          }),

        addToast: (toast) =>
          set((state) => {
            const id = `toast-${Date.now()}-${Math.random()}`;
            state.toasts.push({ ...toast, id });
          }),

        removeToast: (id) =>
          set((state) => {
            state.toasts = state.toasts.filter((t) => t.id !== id);
          }),
      })),
      {
        name: 'agent-arena-storage',
        partialize: (state) => ({ agentConfig: state.agentConfig }),
      }
    ),
    { name: 'AgentArena' }
  )
);

// Selectors
export const useCurrentScreen = () => useGameStore((s) => s.currentScreen);
export const useAgentConfig = () => useGameStore((s) => s.agentConfig);
export const useBattleState = () =>
  useGameStore(
    useShallow((s) => ({
      rounds: s.battleRounds,
      outcome: s.battleOutcome,
      isSimulating: s.isSimulating,
      streamingRound: s.streamingRound,
    }))
  );
export const useWallet = () =>
  useGameStore(
    useShallow((s) => ({
      address: s.walletAddress,
      connected: s.connectedWallet,
      demoMode: s.demoMode,
    }))
  );

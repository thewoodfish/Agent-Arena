'use client';

import { useCallback, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { runLocalMatch } from '@/lib/battleLogic';
import { API_URL, STAKE_AMOUNT } from '@/lib/constants';
import type { BattleOutcome, MatchState, RoundResult } from '@/lib/types';

const ROUND_DELAY_MS = 800;

export function useBattleEngine() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    addRound,
    setBattleOutcome,
    setSimulating,
    incrementStreamingRound,
    setScreen,
    demoMode,
  } = useGameStore(
    useShallow((s) => ({
      addRound: s.addRound,
      setBattleOutcome: s.setBattleOutcome,
      setSimulating: s.setSimulating,
      incrementStreamingRound: s.incrementStreamingRound,
      setScreen: s.setScreen,
      demoMode: s.demoMode,
    }))
  );

  const startBattle = useCallback(
    async (match: MatchState) => {
      setIsRunning(true);
      setSimulating(true);
      setError(null);

      const handleResult = async (
        rounds: RoundResult[],
        winner: string,
        winnerAddress: string,
        finalHp1: number,
        finalHp2: number,
        totalDmg1: number,
        totalDmg2: number,
        resultHash: string
      ) => {
        for (let i = 0; i < rounds.length; i++) {
          await new Promise((r) => setTimeout(r, ROUND_DELAY_MS));
          addRound(rounds[i]);
          incrementStreamingRound();
        }
        await new Promise((r) => setTimeout(r, 1500));
        const outcome: BattleOutcome = {
          winner,
          winnerAddress,
          winnerHp: winner === match.agent1.name ? finalHp1 : finalHp2,
          totalRounds: rounds.length,
          totalDamageDealt: totalDmg1 + totalDmg2,
          rewardAmount: match.stakeAmount * 2,
          txHash: resultHash,
        };
        setBattleOutcome(outcome);
        setSimulating(false);
        setIsRunning(false);
        setScreen('results');
      };

      // Try real engine first (unless demo mode)
      if (!demoMode) {
        try {
          const healthRes = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(2000) });
          if (healthRes.ok) {
            setIsConnected(true);
            const res = await fetch(`${API_URL}/simulate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agent1: {
                  id: match.agent1.id,
                  name: match.agent1.name,
                  owner: match.agent1.owner,
                  strategy: match.agent1.strategy,
                  aggression: match.agent1.aggression,
                  riskTolerance: match.agent1.riskTolerance,
                  defenseWeight: match.agent1.defenseWeight,
                  adaptability: match.agent1.adaptability,
                  powerRating: match.agent1.powerRating,
                },
                agent2: {
                  id: match.agent2.id,
                  name: match.agent2.name,
                  owner: match.agent2.owner,
                  strategy: match.agent2.strategy,
                  aggression: match.agent2.aggression,
                  riskTolerance: match.agent2.riskTolerance,
                  defenseWeight: match.agent2.defenseWeight,
                  adaptability: match.agent2.adaptability,
                  powerRating: match.agent2.powerRating,
                },
                match_id: match.matchId,
                blockSeed: '',
              }),
            });
            if (res.ok) {
              const data = await res.json();
              await handleResult(
                data.rounds,
                data.winner,
                data.winner_address,
                data.final_hp_1,
                data.final_hp_2,
                data.total_damage_1,
                data.total_damage_2,
                data.result_hash
              );
              return;
            }
          }
        } catch {
          // Fall through to local simulation
        }
      }

      // Local JS fallback
      setIsConnected(false);
      const result = runLocalMatch(match.agent1, match.agent2, match.matchId);
      await handleResult(
        result.rounds,
        result.winner,
        result.winner_address,
        result.final_hp_1,
        result.final_hp_2,
        result.total_damage_1,
        result.total_damage_2,
        result.result_hash
      );
    },
    [addRound, setBattleOutcome, setSimulating, incrementStreamingRound, setScreen, demoMode]
  );

  return { startBattle, isConnected, isRunning, error };
}

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { generateDemoAgent, DEMO_MATCH_ID } from '@/lib/demoData';
import { STAKE_AMOUNT } from '@/lib/constants';
import type { AgentConfig, MatchState } from '@/lib/types';
import { useWalletActions } from '@/hooks/useWallet';

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-[var(--muted)] w-16 flex-shrink-0 uppercase">{label}</span>
      <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono tabular-nums w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

function AgentCard({ agent, side }: { agent: AgentConfig; side: 'left' | 'right' }) {
  const avatar = agent.strategy === 'attacker' ? '⚔️' : agent.strategy === 'defender' ? '🛡️' : '♟️';
  const accentColor = side === 'left' ? 'var(--cyan)' : 'var(--magenta)';
  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: side === 'left' ? 0 : 0.15 }}
      className="rounded-sm border bg-[var(--panel)] p-4 flex flex-col gap-3"
      style={{ borderColor: accentColor, borderTop: `2px solid ${accentColor}` }}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="text-4xl">{avatar}</span>
        <p className="font-display font-black text-lg tracking-wider" style={{ color: accentColor }}>
          {agent.name}
        </p>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">{agent.strategy}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <StatBar label="Aggr" value={agent.aggression} color="var(--magenta)" />
        <StatBar label="Risk" value={agent.riskTolerance} color="var(--amber)" />
        <StatBar label="Def" value={agent.defenseWeight} color="var(--cyan)" />
        <StatBar label="Adapt" value={agent.adaptability} color="var(--green)" />
      </div>
      <div className="text-center">
        <span className="font-display text-2xl font-black">{agent.powerRating}</span>
        <p className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider">Power</p>
      </div>
    </motion.div>
  );
}

export function MatchLobby() {
  const { agentConfig, setScreen, setCurrentMatch, addToast, demoMode } = useGameStore(
    useShallow((s) => ({
      agentConfig: s.agentConfig,
      setScreen: s.setScreen,
      setCurrentMatch: s.setCurrentMatch,
      addToast: s.addToast,
      demoMode: s.demoMode,
    }))
  );
  const wallet = useWalletActions();

  const [opponent, setOpponent] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOpponent(generateDemoAgent());
  }, []);

  const handleExecuteMatch = async () => {
    if (!agentConfig || !opponent) return;
    setLoading(true);

    try {
      let matchId = DEMO_MATCH_ID;

      if (!demoMode) {
        addToast({ type: 'loading', message: 'Locking stake onchain…' });
        const { txHash, matchId: mid } = await wallet.createMatch(agentConfig.id, STAKE_AMOUNT);
        matchId = mid;
        addToast({ type: 'success', message: `Stake locked! TX: ${txHash.slice(0, 10)}…` });
      }

      const match: MatchState = {
        matchId,
        agent1: agentConfig,
        agent2: opponent,
        stakeAmount: STAKE_AMOUNT,
        status: 'active',
        rounds: [],
      };
      setCurrentMatch(match);
      setScreen('battle');
    } catch {
      addToast({ type: 'error', message: 'Failed to start match' });
    } finally {
      setLoading(false);
    }
  };

  if (!agentConfig) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-5xl mx-auto px-4 py-6"
    >
      <div className="flex flex-col gap-6">
        {/* VS Layout */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <AgentCard agent={agentConfig} side="left" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="font-display text-4xl font-black text-center"
            style={{
              color: 'var(--amber)',
              textShadow: '0 0 20px var(--amber)',
              animation: 'pulse 2s infinite',
            }}
          >
            VS
          </motion.div>
          {opponent && <AgentCard agent={opponent} side="right" />}
        </div>

        {/* Stake Panel */}
        <Panel title="Match Stakes" accent="amber">
          <div className="flex flex-wrap gap-6 justify-center text-center">
            <div>
              <p className="font-display text-xl font-bold text-[var(--cyan)]">50 ONE</p>
              <p className="text-[10px] font-mono text-[var(--muted)] uppercase">Your Stake</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-[var(--magenta)]">50 ONE</p>
              <p className="text-[10px] font-mono text-[var(--muted)] uppercase">Opponent Stake</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-[var(--amber)]">100 ONE</p>
              <p className="text-[10px] font-mono text-[var(--muted)] uppercase">Prize Pool</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap gap-4 text-[11px] font-mono text-[var(--muted)]">
            <span>Contract: 0xCAFE…CAFE</span>
            <span>Engine: v1.0.0</span>
            <span>{demoMode ? 'DEMO MODE — simulated' : `Network: ${process.env.NEXT_PUBLIC_NETWORK || 'devnet'}`}</span>
          </div>
        </Panel>

        {/* Pre-match intelligence */}
        <Panel title="Pre-Match Intelligence" accent="cyan">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono text-[var(--muted)]">
            <div>
              <p className="text-xs text-[var(--cyan)] mb-1 uppercase tracking-wider">Your Predicted Playstyle</p>
              <p>
                {agentConfig.strategy === 'attacker' ? '→ High-pressure offense from round 1' :
                 agentConfig.strategy === 'defender' ? '→ Defensive wall, attrition wins' :
                 '→ Adaptive counter-strategy, reads opponent'}
              </p>
              <p className="mt-1 text-[var(--muted)]">
                Aggression threshold: {(65 - agentConfig.adaptability * 0.2).toFixed(0)} |
                Retreat at: {(30 - agentConfig.riskTolerance * 0.15).toFixed(0)} HP
              </p>
            </div>
            {opponent && (
              <div>
                <p className="text-xs text-[var(--magenta)] mb-1 uppercase tracking-wider">Opponent Predicted Playstyle</p>
                <p>
                  {opponent.strategy === 'attacker' ? '→ Aggressive early, risks high damage' :
                   opponent.strategy === 'defender' ? '→ Patient defense, waits for mistakes' :
                   '→ Mirror tactics, hard to predict'}
                </p>
                <p className="mt-1 text-[var(--muted)]">
                  Power: {opponent.powerRating} |
                  Adaptability: {opponent.adaptability}
                </p>
              </div>
            )}
          </div>
        </Panel>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setScreen('build')}>← Back</Button>
          <Button
            variant="primary"
            loading={loading}
            onClick={handleExecuteMatch}
          >
            {demoMode ? '⚡ EXECUTE MATCH — AGENTS TAKE OVER' : 'LOCK STAKE & FIND MATCH →'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

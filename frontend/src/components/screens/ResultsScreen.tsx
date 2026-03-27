'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { TxRow } from '@/components/ui/TxRow';
import { DEMO_TX_HASH, DEMO_BLOCK_NUMBER } from '@/lib/demoData';
import { ONECHAIN_EXPLORER } from '@/lib/constants';

const UPGRADE_CARDS = [
  { icon: '🧠', title: 'LLM Policy', desc: 'GPT-4 powered decision making' },
  { icon: '📈', title: 'RL Training Loop', desc: 'Self-improving agents' },
  { icon: '🌐', title: 'Multi-Agent Envs', desc: 'Team battles and alliances' },
  { icon: '⚡', title: 'Autonomous Trading', desc: 'DeFi strategy agents' },
];

function Counter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (ref.current) ref.current.textContent = Math.round(target * eased).toString();
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <span ref={ref}>0</span>;
}

export function ResultsScreen() {
  const { battleOutcome, currentMatch, agentConfig, setScreen, resetBattle, demoMode } = useGameStore(
    useShallow((s) => ({
      battleOutcome: s.battleOutcome,
      currentMatch: s.currentMatch,
      agentConfig: s.agentConfig,
      setScreen: s.setScreen,
      resetBattle: s.resetBattle,
      demoMode: s.demoMode,
    }))
  );

  if (!battleOutcome || !agentConfig) return null;

  const playerWon = battleOutcome.winner === agentConfig.name;
  const winColor = playerWon ? 'var(--amber)' : 'var(--magenta)';
  const timestamp = new Date().toLocaleTimeString();

  const handleRematch = () => {
    resetBattle();
    setScreen('build');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto px-4 py-6"
    >
      <div className="flex flex-col gap-6">
        {/* Winner display */}
        <div className="text-center flex flex-col items-center gap-3 py-6 rounded-sm border bg-[var(--panel)]"
          style={{ borderColor: winColor, borderTop: `2px solid ${winColor}` }}>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="text-6xl"
            style={{ filter: `drop-shadow(0 0 16px ${winColor})` }}
          >
            {playerWon ? '🏆' : '💀'}
          </motion.span>
          <p className="text-xs font-mono text-[var(--muted)] uppercase tracking-[0.3em]">Match Winner</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="font-display text-4xl font-black tracking-wider"
            style={{ color: winColor, textShadow: `0 0 24px ${winColor}` }}
          >
            {battleOutcome.winner}
          </motion.p>
          <p className="text-sm font-mono text-[var(--muted)]">
            {playerWon
              ? 'Your strategy outperformed the opponent'
              : 'Refine your strategy and rematch'}
          </p>
          <div
            className="px-4 py-2 rounded-sm border font-mono text-sm font-bold"
            style={{ borderColor: 'var(--amber)', color: 'var(--amber)', background: 'rgba(255,179,0,0.1)' }}
          >
            100 ONE — {demoMode ? 'Simulated reward' : 'Transferred onchain'}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {([
            ['Rounds Played', battleOutcome.totalRounds],
            ['Total Damage', battleOutcome.totalDamageDealt],
            ['HP Remaining', battleOutcome.winnerHp],
          ] as [string, number][]).map(([label, val]) => (
            <div
              key={label}
              className="rounded-sm border border-[var(--border)] bg-[var(--panel)] p-4 text-center"
            >
              <p className="font-display text-3xl font-black text-[var(--text)]">
                <Counter target={val} />
              </p>
              <p className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Onchain verification */}
        <Panel title="Onchain Verification" accent="cyan" className="">
          <TxRow
            hash={demoMode ? DEMO_TX_HASH : battleOutcome.txHash}
            description="Match Result Verified"
            blockNumber={DEMO_BLOCK_NUMBER}
            timestamp={timestamp}
            verified
            simulated={demoMode}
          />
          <TxRow
            hash={demoMode ? DEMO_TX_HASH.replace('7f', '8a') : `0x${battleOutcome.txHash.slice(2, 10)}ff`}
            description="Reward Distributed"
            blockNumber={DEMO_BLOCK_NUMBER + 1}
            timestamp={timestamp}
            verified
            simulated={demoMode}
          />
          {!demoMode && battleOutcome.txHash && (
            <a
              href={`${ONECHAIN_EXPLORER}/txblock/${battleOutcome.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-[var(--cyan)] hover:opacity-80 transition-opacity"
            >
              <span>View on OneScan ↗</span>
            </a>
          )}
        </Panel>

        {/* Upgrade teaser */}
        <div>
          <p className="text-xs font-mono text-[var(--muted)] uppercase tracking-widest mb-3">
            Coming Soon — Future Capabilities
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {UPGRADE_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-sm border border-[var(--border)] bg-[var(--panel)] p-3 opacity-50 flex flex-col items-center gap-2 text-center"
              >
                <span className="text-2xl">{card.icon}</span>
                <p className="text-xs font-mono font-bold text-[var(--text)]">{card.title}</p>
                <p className="text-[10px] font-mono text-[var(--muted)]">{card.desc}</p>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-[var(--border)] text-[var(--muted)] uppercase tracking-wider">
                  Coming Soon
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setScreen('battle')}>← Match Details</Button>
          <Button variant="primary" onClick={handleRematch}>
            REFINE STRATEGY & REMATCH →
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

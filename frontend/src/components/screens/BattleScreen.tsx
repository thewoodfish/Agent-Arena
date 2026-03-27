'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { useBattleEngine } from '@/hooks/useBattleEngine';
import { ActionBadge } from '@/components/ui/ActionBadge';
import type { Action, RoundResult } from '@/lib/types';

interface CombatantProps {
  name: string;
  hp: number;
  maxHp?: number;
  currentAction: Action | 'ready';
  side: 'left' | 'right';
  takingDamage: boolean;
  avatar: string;
  reasoning?: string;
}

function HpBar({ hp, maxHp = 100, color }: { hp: number; maxHp?: number; color: string }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const flashRed = hp < 30;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono tabular-nums w-8" style={{ color }}>{hp}</span>
      <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
          style={{
            background: flashRed ? 'var(--magenta)' : color,
            boxShadow: flashRed ? '0 0 8px var(--magenta)' : 'none',
          }}
        />
      </div>
    </div>
  );
}

function CombatantDisplay({ name, hp, currentAction, side, takingDamage, avatar, reasoning }: CombatantProps) {
  const color = side === 'left' ? 'var(--cyan)' : 'var(--magenta)';
  return (
    <motion.div
      animate={
        takingDamage
          ? { x: [0, side === 'left' ? -6 : 6, 0, side === 'left' ? 4 : -4, 0] }
          : currentAction === 'attack' || currentAction === 'special'
          ? { scale: [1, 1.04, 1] }
          : {}
      }
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-3 p-4 rounded-sm border bg-[var(--panel)]"
      style={{
        borderColor: takingDamage ? 'var(--magenta)' : color,
        boxShadow: currentAction === 'attack' ? `0 0 20px ${color}40` : 'none',
        transition: 'box-shadow 0.3s, border-color 0.3s',
      }}
    >
      <motion.span
        key={currentAction}
        animate={{ scale: [0.9, 1.1, 1] }}
        transition={{ duration: 0.3 }}
        className="text-5xl"
      >
        {avatar}
      </motion.span>
      <p className="font-display font-black text-sm tracking-wider" style={{ color }}>{name}</p>
      <HpBar hp={hp} color={color} />
      <ActionBadge action={currentAction} />
      {reasoning && (
        <p className="text-[10px] font-mono text-[var(--muted)] text-center leading-tight max-w-[160px]">
          {reasoning}
        </p>
      )}
    </motion.div>
  );
}

function LogEntry({ line, round }: { line: string; round: number }) {
  const color = line.includes('attacks')
    ? 'var(--magenta)'
    : line.includes('defends')
    ? 'var(--cyan)'
    : line.includes('damage')
    ? 'var(--text)'
    : 'var(--amber)';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 font-mono text-[11px] leading-snug"
    >
      <span className="text-[var(--border)] flex-shrink-0">[R{String(round).padStart(2, '0')}]</span>
      <span style={{ color }}>{line}</span>
    </motion.div>
  );
}

function getReasoningText(action: Action | 'ready', hp: number): string {
  if (action === 'retreat') return `hp=${hp} < threshold → retreat`;
  if (action === 'defend') return 'opp aggression high → defend';
  if (action === 'attack') return `hp=${hp} > threshold → push`;
  if (action === 'special') return 'adapt > 60 → special move';
  return 'awaiting round start…';
}

export function BattleScreen() {
  const { currentMatch, battleRounds, isSimulating } = useGameStore(
    useShallow((s) => ({
      currentMatch: s.currentMatch,
      battleRounds: s.battleRounds,
      isSimulating: s.isSimulating,
    }))
  );
  const { startBattle } = useBattleEngine();
  const logRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const [hp1, setHp1] = useState(100);
  const [hp2, setHp2] = useState(100);
  const [action1, setAction1] = useState<Action | 'ready'>('ready');
  const [action2, setAction2] = useState<Action | 'ready'>('ready');
  const [dmg1, setDmg1] = useState(false);
  const [dmg2, setDmg2] = useState(false);
  const [logLines, setLogLines] = useState<Array<{ line: string; round: number }>>([]);

  // Track latest round to update display
  const lastRound = battleRounds[battleRounds.length - 1];
  useEffect(() => {
    if (!lastRound) return;
    setHp1(lastRound.hp1After);
    setHp2(lastRound.hp2After);
    setAction1(lastRound.action1);
    setAction2(lastRound.action2);
    if (lastRound.damage1 > 0) {
      setDmg1(true);
      setTimeout(() => setDmg1(false), 400);
    }
    if (lastRound.damage2 > 0) {
      setDmg2(true);
      setTimeout(() => setDmg2(false), 400);
    }
    const newLines = lastRound.log.map((line) => ({ line, round: lastRound.round }));
    setLogLines((prev) => [...prev, ...newLines]);
  }, [lastRound]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logLines]);

  useEffect(() => {
    if (!started.current && currentMatch) {
      started.current = true;
      startBattle(currentMatch);
    }
  }, [currentMatch, startBattle]);

  const a1 = currentMatch?.agent1;
  const a2 = currentMatch?.agent2;
  const avatar1 = a1?.strategy === 'attacker' ? '⚔️' : a1?.strategy === 'defender' ? '🛡️' : '♟️';
  const avatar2 = a2?.strategy === 'attacker' ? '⚔️' : a2?.strategy === 'defender' ? '🛡️' : '♟️';
  const currentRound = battleRounds.length;
  const progressPct = (currentRound / 10) * 100;

  if (!currentMatch) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-5xl mx-auto px-4 py-6"
    >
      {/* Autonomous status bar */}
      <div className="text-center mb-4">
        <span className="text-[10px] font-mono tracking-widest text-[var(--muted)] uppercase border border-[var(--border)] px-3 py-1 rounded-full">
          NO HUMAN INPUT — AGENTS EXECUTING AUTONOMOUSLY
        </span>
      </div>

      {/* Round progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-mono text-[var(--muted)] uppercase tracking-wider">Round Progress</span>
          <motion.span
            key={currentRound}
            initial={{ color: 'var(--amber)' }}
            animate={{ color: 'var(--text)' }}
            transition={{ duration: 0.5 }}
            className="font-display font-black text-sm"
          >
            ROUND {currentRound} / 10
          </motion.span>
        </div>
        <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--cyan)] rounded-full"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Battle arena */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <CombatantDisplay
              name={a1?.name ?? ''}
              hp={hp1}
              currentAction={action1}
              side="left"
              takingDamage={dmg1}
              avatar={avatar1}
              reasoning={getReasoningText(action1, hp1)}
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRound}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="font-display text-xs font-black text-center text-[var(--muted)] px-2"
              >
                R{currentRound}
              </motion.div>
            </AnimatePresence>
            <CombatantDisplay
              name={a2?.name ?? ''}
              hp={hp2}
              currentAction={action2}
              side="right"
              takingDamage={dmg2}
              avatar={avatar2}
              reasoning={getReasoningText(action2, hp2)}
            />
          </div>

          {/* HP summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-sm border border-[var(--border)] bg-[var(--panel)] px-3 py-2">
              <p className="text-[10px] font-mono text-[var(--muted)] uppercase mb-1">{a1?.name}</p>
              <HpBar hp={hp1} color="var(--cyan)" />
            </div>
            <div className="rounded-sm border border-[var(--border)] bg-[var(--panel)] px-3 py-2">
              <p className="text-[10px] font-mono text-[var(--muted)] uppercase mb-1">{a2?.name}</p>
              <HpBar hp={hp2} color="var(--magenta)" />
            </div>
          </div>
        </div>

        {/* Battle log */}
        <div className="rounded-sm border border-[var(--border)] bg-[var(--panel)] flex flex-col overflow-hidden" style={{ minHeight: '300px' }}>
          <div className="px-3 py-2 border-b border-[var(--border)]" style={{ borderTop: '2px solid var(--amber)' }}>
            <span className="text-xs font-mono text-[var(--amber)] uppercase tracking-widest">Execution Log</span>
          </div>
          <div
            ref={logRef}
            className="flex-1 overflow-y-auto p-3 flex flex-col gap-1"
            style={{ maxHeight: '380px' }}
          >
            {isSimulating && logLines.length === 0 && (
              <span className="text-[11px] font-mono text-[var(--muted)] animate-pulse">
                Initializing battle simulation…
              </span>
            )}
            <AnimatePresence>
              {logLines.map((entry, i) => (
                <LogEntry key={i} line={entry.line} round={entry.round} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

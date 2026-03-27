'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore, useCurrentScreen } from '@/store/gameStore';
import { AgentBuilder } from '@/components/screens/AgentBuilder';
import { MatchLobby } from '@/components/screens/MatchLobby';
import { BattleScreen } from '@/components/screens/BattleScreen';
import { ResultsScreen } from '@/components/screens/ResultsScreen';
import { ToastNotification } from '@/components/ToastNotification';
import { useWalletActions } from '@/hooks/useWallet';
import { useDisplayName } from '@/hooks/useOneID';
import { PACKAGE_ID, ONECHAIN_EXPLORER } from '@/lib/constants';
import type { Screen } from '@/store/gameStore';

const STEPS: { id: Screen; label: string }[] = [
  { id: 'build',   label: 'BUILD AGENT' },
  { id: 'lobby',   label: 'JOIN MATCH' },
  { id: 'battle',  label: 'BATTLE' },
  { id: 'results', label: 'RESULT' },
];

const SCREEN_ORDER: Screen[] = ['build', 'lobby', 'battle', 'results'];

function StepProgress({ current }: { current: Screen }) {
  const idx = SCREEN_ORDER.indexOf(current);
  return (
    <div className="hidden md:flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: done ? 'var(--green)' : active ? 'var(--cyan)' : 'var(--border)',
                  boxShadow: active ? '0 0 6px var(--cyan)' : 'none',
                }}
              />
              <span
                className="text-[9px] font-mono uppercase tracking-widest"
                style={{
                  color: done ? 'var(--green)' : active ? 'var(--cyan)' : 'var(--muted)',
                }}
              >
                {done ? '✓' : ''}{step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="mx-2 text-[var(--border)] text-[10px]">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WalletButton() {
  const address = useGameStore((s) => s.walletAddress);
  const connected = useGameStore((s) => s.connectedWallet);
  const demoMode = useGameStore((s) => s.demoMode);
  const wallet = useWalletActions();
  const [connecting, setConnecting] = useState(false);
  const displayName = useDisplayName(connected && !demoMode ? address : null);

  const handleConnect = async () => {
    setConnecting(true);
    try { await wallet.connectWallet(); } finally { setConnecting(false); }
  };

  if (connected && address) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[var(--border)] bg-[var(--panel)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" style={{ animation: 'pulse 2s infinite' }} />
        <span className="text-[10px] font-mono text-[var(--cyan)]">
          {demoMode ? `${address.slice(0, 6)}…${address.slice(-4)}` : displayName}
        </span>
        <span className="text-[10px] font-mono text-[var(--muted)]">| OneChain testnet</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm border transition-all"
      style={{
        borderColor: 'var(--cyan)',
        color: 'var(--cyan)',
        background: 'rgba(0,255,224,0.08)',
      }}
    >
      {connecting ? '…' : demoMode ? '⚡ DEMO MODE' : 'CONNECT WALLET'}
    </button>
  );
}

function DemoModeBanner() {
  const demoMode = useGameStore((s) => s.demoMode);
  const toggleDemoMode = useGameStore((s) => s.toggleDemoMode);
  const [dismissed, setDismissed] = useState(false);

  if (!demoMode || dismissed) return null;
  return (
    <div
      className="w-full flex items-center justify-between px-4 py-1.5 text-[10px] font-mono"
      style={{ background: 'var(--amber)', color: '#111' }}
    >
      <span>⚡ DEMO MODE — No wallet required · Full simulation active · Press D to toggle</span>
      <button onClick={() => setDismissed(true)} className="ml-4 font-bold hover:opacity-70">×</button>
    </div>
  );
}

export default function Home() {
  const currentScreen = useCurrentScreen();
  const idx = SCREEN_ORDER.indexOf(currentScreen);

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <DemoModeBanner />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)/90] backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-shrink-0">
            <span className="font-display text-lg font-black tracking-wider">
              <span style={{ color: 'var(--cyan)' }}>AGENT </span>
              <span style={{ color: 'var(--magenta)' }}>ARENA</span>
            </span>
            <p className="text-[8px] font-mono text-[var(--muted)] tracking-widest hidden sm:block">
              // AUTONOMOUS AGENTS · COMPETE ONCHAIN · STRATEGY WINS
            </p>
          </div>

          <div className="flex-1 flex justify-center">
            <StepProgress current={currentScreen} />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/leaderboard"
              className="text-[10px] font-mono text-[var(--muted)] hover:text-[var(--cyan)] uppercase tracking-wider transition-colors hidden sm:block"
            >
              Leaderboard
            </Link>
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          {currentScreen === 'build' && (
            <motion.div
              key="build"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <AgentBuilder />
            </motion.div>
          )}
          {currentScreen === 'lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <MatchLobby />
            </motion.div>
          )}
          {currentScreen === 'battle' && (
            <motion.div
              key="battle"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <BattleScreen />
            </motion.div>
          )}
          {currentScreen === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <ResultsScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom status bar */}
      <footer className="border-t border-[var(--border)] px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center gap-4 text-[9px] font-mono text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] inline-block" style={{ animation: 'pulse 2s infinite' }} />
            ENGINE READY
          </span>
          <span>·</span>
          <span>NETWORK: TESTNET</span>
          <span>·</span>
          <a
            href={`${ONECHAIN_EXPLORER}/object/${PACKAGE_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--cyan)] transition-colors"
          >
            CONTRACTS: {PACKAGE_ID.slice(0, 8)}…{PACKAGE_ID.slice(-4)} ↗
          </a>
          <span className="ml-auto">v1.0.0</span>
        </div>
      </footer>

      <ToastNotification />
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { Panel } from '@/components/ui/Panel';
import { SliderField } from '@/components/ui/SliderField';
import { Button } from '@/components/ui/Button';
import { useWalletActions } from '@/hooks/useWallet';
import type { AgentConfig, Strategy } from '@/lib/types';

const STRATEGIES: { id: Strategy; icon: string; label: string; desc: string }[] = [
  { id: 'attacker', icon: '⚔️', label: 'Attacker', desc: 'Aggressive push, high damage output' },
  { id: 'defender', icon: '🛡️', label: 'Defender', desc: 'Outlast opponents through attrition' },
  { id: 'tactician', icon: '♟️', label: 'Tactician', desc: 'Adaptive counter-strategy' },
];

const STRATEGY_AVATARS: Record<Strategy, string> = {
  attacker: '⚔️',
  defender: '🛡️',
  tactician: '♟️',
};

function generatePseudocode(config: Partial<AgentConfig>): string {
  const { aggression = 50, riskTolerance = 50, defenseWeight = 50, adaptability = 50, strategy = 'attacker' } = config;
  const retreatAt = (30 - riskTolerance * 0.15).toFixed(1);
  const defendAt = (65 - adaptability * 0.2).toFixed(1);
  const attackAbove = (50 + defenseWeight * 0.15).toFixed(1);
  return `fn decide_action(hp, opp) {
  // Priority 1 — retreat threshold
  if hp < ${retreatAt} { return retreat }

  // Priority 2 — defend vs high aggression
  if opp.aggression > ${defendAt}
     && hp < ${(60 + defenseWeight * 0.2).toFixed(1)} {
    return defend
  }

  // Priority 3 — attack window
  if hp > ${attackAbove} {
    ${strategy === 'attacker' && aggression > 40 ? `if strategy == attacker
       && aggression > 40 { return attack }` : `if opp.hp > my.hp * 0.9 { return attack }`}
  }

  // Priority 4 — special move
  ${adaptability > 60 ? `if adapt > 60 && rng() < 0.25 { return special }` : '// adaptability too low for special'}

  return defend
}`;
}

export function AgentBuilder() {
  const { setScreen, setAgentConfig, computePowerRating, addToast, demoMode, walletAddress } = useGameStore(
    useShallow((s) => ({
      setScreen: s.setScreen,
      setAgentConfig: s.setAgentConfig,
      computePowerRating: s.computePowerRating,
      addToast: s.addToast,
      demoMode: s.demoMode,
      walletAddress: s.walletAddress,
    }))
  );
  const wallet = useWalletActions();

  const [name, setName] = useState('');
  const [strategy, setStrategy] = useState<Strategy>('attacker');
  const [aggression, setAggression] = useState(65);
  const [riskTolerance, setRiskTolerance] = useState(50);
  const [defenseWeight, setDefenseWeight] = useState(40);
  const [adaptability, setAdaptability] = useState(60);
  const [deploying, setDeploying] = useState(false);

  const powerRating = computePowerRating({ aggression, riskTolerance, defenseWeight, adaptability });
  const winProb = Math.min(99, Math.max(1, Math.round(powerRating * 0.85 + Math.random() * 10)));

  const handleDeploy = useCallback(async () => {
    if (!name.trim()) {
      addToast({ type: 'error', message: 'Enter an agent name first' });
      return;
    }
    if (!walletAddress && !demoMode) {
      addToast({ type: 'info', message: 'Connect a wallet to deploy onchain' });
      return;
    }

    setDeploying(true);
    const config: AgentConfig = {
      id: '',
      name: name.toUpperCase().slice(0, 18),
      owner: walletAddress || '0xDEMO',
      strategy,
      aggression,
      riskTolerance,
      defenseWeight,
      adaptability,
      powerRating,
      createdAt: Date.now(),
    };

    try {
      addToast({ type: 'loading', message: 'Deploying agent onchain…' });
      const { txHash, agentId } = await wallet.createAgent(config);
      config.id = agentId;
      setAgentConfig(config);
      addToast({ type: 'success', message: `Agent deployed! TX: ${txHash.slice(0, 12)}…` });
      setScreen('lobby');
    } catch (e) {
      addToast({ type: 'error', message: 'Deploy failed — try again' });
    } finally {
      setDeploying(false);
    }
  }, [name, strategy, aggression, riskTolerance, defenseWeight, adaptability, powerRating, wallet, walletAddress, demoMode, addToast, setAgentConfig, setScreen]);

  const pseudocode = generatePseudocode({ aggression, riskTolerance, defenseWeight, adaptability, strategy });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-6xl mx-auto px-4 py-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Builder */}
        <div className="flex flex-col gap-4">
          {/* Identity */}
          <Panel title="Agent Identity" accent="cyan">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-mono text-[var(--muted)] uppercase tracking-wider block mb-1.5">
                  Designation
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 18))}
                  placeholder="ENTER NAME…"
                  maxLength={18}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-sm px-3 py-2 font-display text-lg font-bold text-[var(--cyan)] placeholder:text-[var(--border)] outline-none focus:border-[var(--cyan)] transition-colors uppercase"
                />
              </div>
              <div>
                <p className="text-xs font-mono text-[var(--muted)] uppercase tracking-wider mb-2">Strategy</p>
                <div className="grid grid-cols-3 gap-2">
                  {STRATEGIES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStrategy(s.id)}
                      className="flex flex-col items-center gap-1 p-3 rounded-sm border transition-all duration-150 text-center"
                      style={{
                        borderColor: strategy === s.id ? 'var(--cyan)' : 'var(--border)',
                        background: strategy === s.id ? 'rgba(0,255,224,0.08)' : 'transparent',
                        boxShadow: strategy === s.id ? '0 0 12px rgba(0,255,224,0.2)' : 'none',
                      }}
                    >
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-xs font-mono font-bold text-[var(--text)]">{s.label}</span>
                      <span className="text-[10px] font-mono text-[var(--muted)] leading-tight">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* Behavioral Params */}
          <Panel title="Behavioral Parameters" accent="magenta">
            <div className="flex flex-col gap-4">
              <SliderField label="Aggression" value={aggression} color="cyan" onChange={setAggression} />
              <SliderField label="Risk Tolerance" value={riskTolerance} color="magenta" onChange={setRiskTolerance} />
              <SliderField label="Defense Weight" value={defenseWeight} color="amber" onChange={setDefenseWeight} />
              <SliderField label="Adaptability" value={adaptability} color="cyan" onChange={setAdaptability} />
            </div>
          </Panel>

          {/* Decision Logic Preview */}
          <Panel title="Decision Logic" accent="amber">
            <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto text-[var(--muted)] whitespace-pre-wrap">
              {pseudocode.split('\n').map((line, i) => {
                if (line.trim().startsWith('//'))
                  return <span key={i} className="text-[var(--border)]">{line}{'\n'}</span>;
                if (line.includes('return'))
                  return <span key={i} style={{ color: 'var(--cyan)' }}>{line}{'\n'}</span>;
                if (line.includes('fn ') || line.includes('if '))
                  return <span key={i} style={{ color: 'var(--amber)' }}>{line}{'\n'}</span>;
                return <span key={i}>{line}{'\n'}</span>;
              })}
            </pre>
          </Panel>
        </div>

        {/* RIGHT — Preview card (sticky) */}
        <div className="lg:sticky lg:top-6 h-fit flex flex-col gap-4">
          <Panel title="Agent Preview" accent="cyan">
            <div className="flex flex-col items-center gap-4 py-2">
              <motion.span
                key={strategy}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl"
              >
                {STRATEGY_AVATARS[strategy]}
              </motion.span>
              <div className="text-center">
                <p className="font-display text-2xl font-black text-[var(--cyan)] tracking-wider">
                  {name || 'UNNAMED'}
                </p>
                <p className="text-xs font-mono text-[var(--muted)] uppercase tracking-widest mt-0.5">
                  {strategy}
                </p>
              </div>

              <div className="w-full flex flex-col gap-2">
                {([
                  ['Aggression', aggression, 'var(--magenta)'],
                  ['Risk', riskTolerance, 'var(--amber)'],
                  ['Defense', defenseWeight, 'var(--cyan)'],
                  ['Adaptability', adaptability, 'var(--green)'],
                ] as [string, number, string][]).map(([label, val, color]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[var(--muted)] w-20 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: color }}
                        animate={{ width: `${val}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className="text-[11px] font-mono tabular-nums w-8 text-right" style={{ color }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 w-full justify-center">
                <div className="text-center">
                  <motion.p
                    key={powerRating}
                    initial={{ scale: 1.3, color: 'var(--amber)' }}
                    animate={{ scale: 1, color: 'var(--text)' }}
                    className="font-display text-3xl font-black"
                  >
                    {powerRating}
                  </motion.p>
                  <p className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider">Power Rating</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-3xl font-black text-[var(--green)]">{winProb}%</p>
                  <p className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider">Win Est.</p>
                </div>
              </div>

              <div className="w-full flex items-center justify-center gap-2 py-1.5 rounded-sm border border-[var(--border)]">
                <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">
                  {demoMode ? '⚡ Demo NFT' : '🔗 Onchain NFT'}
                </span>
              </div>
            </div>
          </Panel>

          <Button
            variant="primary"
            fullWidth
            loading={deploying}
            onClick={handleDeploy}
          >
            DEPLOY TO ARENA →
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

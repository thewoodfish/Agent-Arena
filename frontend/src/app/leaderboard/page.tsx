'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';

type Strategy = 'attacker' | 'defender' | 'tactician';
type SortKey = 'rank' | 'power' | 'wins' | 'winRate' | 'earnings';

interface LeaderEntry {
  rank: number;
  name: string;
  owner: string;
  strategy: Strategy;
  power: number;
  wins: number;
  losses: number;
  winRate: number;
  earnings: number;
}

const MOCK_DATA: LeaderEntry[] = [
  { rank: 1,  name: 'OMEGA-PRIME',   owner: '0xA1B2',  strategy: 'attacker',  power: 89, wins: 47, losses: 6,  winRate: 89, earnings: 4700 },
  { rank: 2,  name: 'IRON-SAGE',     owner: '0xC3D4',  strategy: 'tactician', power: 84, wins: 41, losses: 9,  winRate: 82, earnings: 4100 },
  { rank: 3,  name: 'VOID-STRIKER',  owner: '0xE5F6',  strategy: 'attacker',  power: 81, wins: 38, losses: 12, winRate: 76, earnings: 3800 },
  { rank: 4,  name: 'BASTION-X',     owner: '0xA7B8',  strategy: 'defender',  power: 78, wins: 35, losses: 15, winRate: 70, earnings: 3500 },
  { rank: 5,  name: 'ECHO-MIND',     owner: '0xC9D0',  strategy: 'tactician', power: 75, wins: 31, losses: 14, winRate: 69, earnings: 3100 },
  { rank: 6,  name: 'IRON-WARDEN',   owner: '0xE1F2',  strategy: 'defender',  power: 72, wins: 28, losses: 16, winRate: 64, earnings: 2800 },
  { rank: 7,  name: 'NEXUS-BOT',     owner: '0xA3B4',  strategy: 'attacker',  power: 68, wins: 24, losses: 18, winRate: 57, earnings: 2400 },
  { rank: 8,  name: 'PHANTOM-7',     owner: '0xC5D6',  strategy: 'tactician', power: 65, wins: 21, losses: 19, winRate: 52, earnings: 2100 },
  { rank: 9,  name: 'STORM-AI',      owner: '0xE7F8',  strategy: 'attacker',  power: 61, wins: 17, losses: 23, winRate: 43, earnings: 1700 },
  { rank: 10, name: 'CIPHER-X',      owner: '0xA9B0',  strategy: 'defender',  power: 57, wins: 12, losses: 28, winRate: 30, earnings: 1200 },
];

const STRATEGY_LABELS: Record<Strategy, string> = {
  attacker: '⚔️ ATTACKER',
  defender: '🛡️ DEFENDER',
  tactician: '♟️ TACTICIAN',
};

const FILTER_TABS: Array<{ id: 'ALL' | Strategy; label: string }> = [
  { id: 'ALL', label: 'ALL' },
  { id: 'attacker', label: '⚔️ ATTACKER' },
  { id: 'defender', label: '🛡️ DEFENDER' },
  { id: 'tactician', label: '♟️ TACTICIAN' },
];

export default function LeaderboardPage() {
  const agentConfig = useGameStore((s) => s.agentConfig);
  const [filter, setFilter] = useState<'ALL' | Strategy>('ALL');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let data = MOCK_DATA;
    if (filter !== 'ALL') data = data.filter((e) => e.strategy === filter);
    if (search.trim()) data = data.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
    data = [...data].sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      return mul * (a[sortKey] > b[sortKey] ? 1 : -1);
    });
    return data;
  }, [filter, search, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortHeader = ({ label, key }: { label: string; key: SortKey }) => (
    <th
      className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] cursor-pointer hover:text-[var(--cyan)] transition-colors select-none whitespace-nowrap"
      onClick={() => handleSort(key)}
    >
      {label} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-1 mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/" className="text-xs font-mono text-[var(--muted)] hover:text-[var(--cyan)] transition-colors">
              ← Back to Arena
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-black text-[var(--cyan)] tracking-wider">
              AGENT LEADERBOARD
            </h1>
            <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full border border-[var(--green)] text-[var(--green)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] inline-block" style={{ animation: 'pulse 1.5s infinite' }} />
              LIVE
            </span>
          </div>
          <p className="text-xs font-mono text-[var(--muted)]">// Top performing agents across all matches</p>
        </div>

        {/* Player's best agent (if connected) */}
        {agentConfig && (
          <div className="mb-5 rounded-sm border border-[var(--cyan)] bg-[var(--panel)] p-4">
            <p className="text-[10px] font-mono text-[var(--cyan)] uppercase tracking-widest mb-2">Your Best Agent</p>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-2xl">{agentConfig.strategy === 'attacker' ? '⚔️' : agentConfig.strategy === 'defender' ? '🛡️' : '♟️'}</span>
              <div>
                <p className="font-display font-black text-[var(--cyan)]">{agentConfig.name}</p>
                <p className="text-[10px] font-mono text-[var(--muted)]">{STRATEGY_LABELS[agentConfig.strategy]} · Power {agentConfig.powerRating}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter + search */}
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <div className="flex gap-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className="text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-sm border transition-all"
                style={{
                  borderColor: filter === tab.id ? 'var(--cyan)' : 'var(--border)',
                  color: filter === tab.id ? 'var(--cyan)' : 'var(--muted)',
                  background: filter === tab.id ? 'rgba(0,255,224,0.08)' : 'transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="SEARCH AGENT…"
            className="bg-[var(--panel)] border border-[var(--border)] rounded-sm px-3 py-1.5 text-xs font-mono text-[var(--text)] placeholder:text-[var(--border)] outline-none focus:border-[var(--cyan)] transition-colors uppercase ml-auto"
          />
        </div>

        {/* Table */}
        <div className="rounded-sm border border-[var(--border)] bg-[var(--panel)] overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <SortHeader label="RANK" key="rank" />
                <th className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">AGENT</th>
                <th className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">STRATEGY</th>
                <SortHeader label="PWR" key="power" />
                <th className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">W/L</th>
                <SortHeader label="WIN%" key="winRate" />
                <SortHeader label="EARNINGS" key="earnings" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const accentColor = entry.rank === 1 ? 'var(--amber)' : entry.rank === 2 ? '#c0c0c0' : '#cd7f32';
                return (
                  <tr
                    key={entry.rank}
                    className="border-b border-[var(--border)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                    style={isTop3 ? { borderLeft: `3px solid ${accentColor}` } : undefined}
                  >
                    <td className="px-3 py-3 font-mono text-sm font-bold" style={{ color: isTop3 ? accentColor : 'var(--muted)' }}>
                      {entry.rank === 1 ? '👑 1' : `#${entry.rank}`}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-mono font-bold text-sm text-[var(--text)]">{entry.name}</p>
                      <p className="font-mono text-[10px] text-[var(--muted)]">{entry.owner}</p>
                    </td>
                    <td className="px-3 py-3 text-[11px] font-mono text-[var(--muted)]">{STRATEGY_LABELS[entry.strategy]}</td>
                    <td className="px-3 py-3 font-mono font-bold text-sm text-[var(--text)]">{entry.power}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-[var(--muted)]">{entry.wins}W/{entry.losses}L</td>
                    <td className="px-3 py-3 font-mono text-sm font-bold" style={{ color: entry.winRate > 60 ? 'var(--green)' : 'var(--muted)' }}>
                      {entry.winRate}%
                    </td>
                    <td className="px-3 py-3 font-mono text-sm font-bold text-[var(--amber)]">{entry.earnings} ONE</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

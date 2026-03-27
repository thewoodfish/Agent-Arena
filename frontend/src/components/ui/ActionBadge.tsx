'use client';

import type { Action } from '@/lib/types';

interface ActionBadgeProps {
  action: Action | 'ready';
}

const STYLES: Record<string, { label: string; color: string; bg: string }> = {
  attack:  { label: 'ATTACK',  color: 'var(--magenta)', bg: 'rgba(255,45,120,0.15)' },
  defend:  { label: 'DEFEND',  color: 'var(--cyan)',    bg: 'rgba(0,255,224,0.12)' },
  retreat: { label: 'RETREAT', color: 'var(--amber)',   bg: 'rgba(255,179,0,0.15)' },
  special: { label: 'SPECIAL', color: 'var(--green)',   bg: 'rgba(57,255,122,0.15)' },
  ready:   { label: 'READY',   color: 'var(--muted)',   bg: 'rgba(255,255,255,0.05)' },
};

export function ActionBadge({ action }: ActionBadgeProps) {
  const s = STYLES[action] ?? STYLES.ready;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-widest uppercase"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}30` }}
    >
      {s.label}
    </span>
  );
}

'use client';

import React from 'react';

interface PanelProps {
  title?: string;
  accent?: 'cyan' | 'magenta' | 'amber';
  children: React.ReactNode;
  className?: string;
}

const ACCENT_COLORS = {
  cyan: 'var(--cyan)',
  magenta: 'var(--magenta)',
  amber: 'var(--amber)',
};

export function Panel({ title, accent = 'cyan', children, className = '' }: PanelProps) {
  const color = ACCENT_COLORS[accent];
  return (
    <div
      className={`rounded-sm border border-[var(--border)] bg-[var(--panel)] overflow-hidden ${className}`}
    >
      {title && (
        <div
          className="px-4 py-2 border-b border-[var(--border)]"
          style={{ borderTop: `2px solid ${color}` }}
        >
          <span
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color }}
          >
            {title}
          </span>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

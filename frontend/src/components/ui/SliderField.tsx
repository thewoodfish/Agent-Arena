'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SliderFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  color?: 'cyan' | 'magenta' | 'amber';
  onChange: (val: number) => void;
}

const COLORS = {
  cyan: 'var(--cyan)',
  magenta: 'var(--magenta)',
  amber: 'var(--amber)',
};

export function SliderField({
  label,
  value,
  min = 0,
  max = 100,
  color = 'cyan',
  onChange,
}: SliderFieldProps) {
  const c = COLORS[color];
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-mono text-[var(--muted)] uppercase tracking-wider">{label}</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={value}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1 }}
            className="text-sm font-mono font-bold tabular-nums"
            style={{ color: c }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="relative h-1.5 rounded-full bg-[var(--border)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
          style={{ width: `${pct}%`, background: c }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ accentColor: c }}
        />
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import type { Toast } from '@/store/gameStore';

const TOAST_STYLES: Record<Toast['type'], { color: string; icon: string }> = {
  success: { color: 'var(--green)',   icon: '✓' },
  error:   { color: 'var(--magenta)', icon: '✗' },
  info:    { color: 'var(--cyan)',    icon: 'ℹ' },
  loading: { color: 'var(--amber)',   icon: '⟳' },
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useGameStore((s) => s.removeToast);
  const s = TOAST_STYLES[toast.type];

  useEffect(() => {
    if (toast.type === 'loading') return;
    const t = setTimeout(() => removeToast(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast, removeToast]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="flex items-center gap-3 px-4 py-3 rounded-sm border bg-[var(--panel)] min-w-[240px] max-w-[340px]"
      style={{ borderColor: s.color, borderLeft: `3px solid ${s.color}` }}
    >
      <span
        className={`text-sm font-mono font-bold flex-shrink-0 ${toast.type === 'loading' ? 'animate-spin inline-block' : ''}`}
        style={{ color: s.color }}
      >
        {s.icon}
      </span>
      <span className="text-xs font-mono text-[var(--text)] leading-snug">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-auto text-[var(--muted)] hover:text-[var(--text)] text-xs font-mono flex-shrink-0"
      >
        ×
      </button>
    </motion.div>
  );
}

export function ToastNotification() {
  const toasts = useGameStore((s) => s.toasts);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

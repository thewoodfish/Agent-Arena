'use client';

import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 px-5 py-2.5 font-mono text-sm tracking-wider uppercase transition-all duration-150 rounded-sm border cursor-pointer select-none';

  const variants = {
    primary:
      'bg-[var(--cyan)] text-[var(--bg)] border-[var(--cyan)] hover:shadow-[0_0_16px_var(--cyan)] active:translate-y-0 hover:-translate-y-px',
    danger:
      'bg-[var(--magenta)] text-white border-[var(--magenta)] hover:shadow-[0_0_16px_var(--magenta)] active:translate-y-0 hover:-translate-y-px',
    ghost:
      'bg-transparent text-[var(--muted)] border-[var(--border)] hover:border-[var(--cyan)] hover:text-[var(--cyan)] active:translate-y-0 hover:-translate-y-px',
  };

  const disabledStyles = disabled || loading ? 'opacity-40 pointer-events-none' : '';
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${disabledStyles} ${widthStyle} ${className}`}
    >
      {loading && (
        <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

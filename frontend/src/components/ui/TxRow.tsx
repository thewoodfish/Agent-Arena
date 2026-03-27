'use client';

interface TxRowProps {
  hash: string;
  description: string;
  blockNumber?: number;
  timestamp?: string;
  verified?: boolean;
  simulated?: boolean;
}

function truncateHash(hash: string): string {
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export function TxRow({ hash, description, blockNumber, timestamp, verified = true, simulated = false }: TxRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
      <span
        className="flex-shrink-0 w-2 h-2 rounded-full"
        style={{
          background: verified ? 'var(--green)' : 'var(--muted)',
          boxShadow: verified ? '0 0 6px var(--green)' : 'none',
          animation: verified ? 'pulse 2s infinite' : 'none',
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-[var(--text)]">{description}</span>
          {simulated && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--muted)]">
              simulated
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-[11px] font-mono text-[var(--cyan)]">{truncateHash(hash)}</span>
          {blockNumber && (
            <span className="text-[11px] font-mono text-[var(--muted)]">block #{blockNumber}</span>
          )}
          {timestamp && (
            <span className="text-[11px] font-mono text-[var(--muted)]">{timestamp}</span>
          )}
        </div>
      </div>
    </div>
  );
}

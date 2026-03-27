'use client';

import { useEffect, useState } from 'react';
import { useSuiClient } from '@onelabs/dapp-kit';

/**
 * Resolves a OneChain wallet address to its OneID name service name (.one domain).
 * Falls back to null if no name is registered or the query fails.
 */
export function useOneID(address: string | null | undefined): string | null {
  const client = useSuiClient();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setName(null);
      return;
    }
    let cancelled = false;
    client
      .resolveNameServiceNames({ address, limit: 1 })
      .then((result) => {
        if (!cancelled && result.data.length > 0) {
          setName(result.data[0]);
        }
      })
      .catch(() => {
        // Name service unavailable or no name registered — silent fallback
      });
    return () => {
      cancelled = true;
    };
  }, [address, client]);

  return name;
}

/** Returns display name: OneID name if available, else truncated address. */
export function useDisplayName(address: string | null | undefined): string {
  const name = useOneID(address);
  if (!address) return '';
  if (name) return name;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
